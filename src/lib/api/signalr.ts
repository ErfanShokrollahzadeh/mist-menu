"use client";

import type { OrderStatus, RealtimeClient, RealtimeEvent } from "./contracts";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * SignalR transport. The module is imported dynamically so @microsoft/signalr
 * (~40 kB) never reaches visitors of the static, backend-less deployment.
 */
export function createSignalRClient(): RealtimeClient {
  const listeners = new Set<(event: RealtimeEvent) => void>();
  const emit = (event: RealtimeEvent) => listeners.forEach((fn) => fn(event));

  let ready: Promise<void> | null = null;
  let stop: (() => Promise<void>) | null = null;

  async function connect(tableId: string): Promise<void> {
    const signalR = await import("@microsoft/signalr");

    const build = (path: string) =>
      new signalR.HubConnectionBuilder()
        .withUrl(`${BASE}${path}`)
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Warning)
        .build();

    const orders = build("/hubs/orders");
    const service = build("/hubs/service");

    orders.on("OrderStatusChanged", (p: { orderId: string; status: OrderStatus }) =>
      emit({ type: "order-status", orderId: p.orderId, status: p.status }),
    );
    service.on("WaiterCallAcknowledged", (p: { callId: string }) =>
      emit({ type: "waiter-acknowledged", callId: p.callId }),
    );
    service.on("BillAcknowledged", (p: { id: string }) =>
      emit({ type: "bill-acknowledged", billId: p.id }),
    );

    await Promise.all([orders.start(), service.start()]);
    await Promise.all([orders.invoke("JoinTable", tableId), service.invoke("JoinTable", tableId)]);

    stop = async () => {
      await Promise.allSettled([orders.stop(), service.stop()]);
    };
  }

  return {
    async join(tableId: string) {
      ready ??= connect(tableId);
      await ready;
    },
    on(handler) {
      listeners.add(handler);
      return () => listeners.delete(handler);
    },
    async dispose() {
      listeners.clear();
      await stop?.();
      ready = null;
      stop = null;
    },
  };
}
