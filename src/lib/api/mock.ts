"use client";

import type {
  MistApi, Order, PlaceOrderInput, WaiterCallInput, WaiterCall,
  BillRequestInput, BillRequest, FeedbackInput, Feedback, OrderStatus,
  RealtimeClient, RealtimeEvent,
} from "./contracts";
import { getItem, lineTotalMinor } from "@/lib/menu";

const STORE_KEY = "mist.mock-orders.v1";
const latency = () => new Promise((r) => setTimeout(r, 260 + Math.random() * 240));
const id = () => Math.random().toString(36).slice(2, 10);

function read(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORE_KEY) ?? "[]") as Order[];
  } catch {
    return [];
  }
}
function write(orders: Order[]) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(orders));
  } catch {
    /* private mode */
  }
}

const listeners = new Set<(e: RealtimeEvent) => void>();
const emit = (e: RealtimeEvent) => listeners.forEach((fn) => fn(e));

/** Walks a simulated order through the kitchen so the stepper has something real to show. */
function simulateProgress(orderId: string) {
  const steps: [OrderStatus, number][] = [["preparing", 6000], ["ready", 16000], ["served", 26000]];
  for (const [status, delay] of steps) {
    window.setTimeout(() => {
      const orders = read();
      const order = orders.find((o) => o.id === orderId);
      if (!order || order.status === "paid") return;
      order.status = status;
      write(orders);
      emit({ type: "order-status", orderId, status });
    }, delay);
  }
}

/**
 * Default adapter. Everything it returns carries `simulated: true`, and the UI
 * surfaces that — a customer sitting in the actual cafe must never believe a
 * waiter was called when no request left the browser.
 */
export const mockApi: MistApi = {
  isMock: true,

  async placeOrder(input: PlaceOrderInput): Promise<Order> {
    await latency();
    const orders = read();

    const existing = orders.find((o) => o.orderNumber === input.clientRequestId.slice(0, 8));
    if (existing) return existing;

    // Must produce the same shape the API does, or mock and live diverge —
    // the exact drift the single canonical dataset exists to prevent.
    const lines = input.lines.map((l) => {
      const item = getItem(l.categorySlug, l.itemSlug);
      const chosen = item
        ? Object.entries(l.selections).flatMap(([g, opts]) =>
            opts.flatMap((o) => {
              const option = item.modifierGroups
                .find((mg) => mg.slug === g)
                ?.options.find((mo) => mo.slug === o);
              return option ? [option] : [];
            }),
          )
        : [];
      const deltas = chosen.map((o) => o.priceDeltaMinor);
      const unitPriceMinor = (item?.priceMinor ?? 0) + deltas.reduce((a, b) => a + b, 0);

      return {
        categorySlug: l.categorySlug,
        itemSlug: l.itemSlug,
        name: item?.name ?? { tr: l.itemSlug, en: l.itemSlug },
        quantity: l.quantity,
        unitPriceMinor,
        lineTotalMinor: item ? lineTotalMinor(item.priceMinor, deltas, l.quantity) : 0,
        selectedOptions: chosen.map((o) => o.name),
        note: l.note,
      };
    });

    const order: Order = {
      id: id(),
      orderNumber: input.clientRequestId.slice(0, 8),
      tableId: input.tableId,
      status: "received",
      totalMinor: lines.reduce((n, l) => n + l.lineTotalMinor, 0),
      placedAt: new Date().toISOString(),
      lines,
      simulated: true,
    };

    write([...orders, order]);
    simulateProgress(order.id);
    return order;
  },

  async activeOrders(tableId: string): Promise<Order[]> {
    await latency();
    return read().filter((o) => o.tableId === tableId && o.status !== "paid");
  },

  async callWaiter(input: WaiterCallInput): Promise<WaiterCall> {
    await latency();
    return { id: id(), ...input, createdAt: new Date().toISOString(), simulated: true };
  },

  async requestBill(input: BillRequestInput): Promise<BillRequest> {
    await latency();
    return { id: id(), ...input, createdAt: new Date().toISOString(), simulated: true };
  },

  async sendFeedback(_input: FeedbackInput): Promise<Feedback> {
    await latency();
    return { id: id(), createdAt: new Date().toISOString(), simulated: true };
  },
};

export const mockRealtime: RealtimeClient = {
  async join() {},
  on(handler) {
    listeners.add(handler);
    return () => listeners.delete(handler);
  },
  async dispose() {
    listeners.clear();
  },
};
