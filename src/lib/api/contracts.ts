import type { Locale } from "@/types/menu";

export type OrderStatus = "received" | "preparing" | "ready" | "served" | "paid";
export type WaiterReason = "water" | "napkins" | "assistance" | "order";
export type PaymentMethod = "cash" | "card" | "split";

export interface PlaceOrderLine {
  categorySlug: string;
  itemSlug: string;
  quantity: number;
  selections: Record<string, string[]>;
  note?: string;
}

export interface PlaceOrderInput {
  tableId: string;
  locale: Locale;
  lines: PlaceOrderLine[];
  note?: string;
  /** Idempotency key — a retried submit must not create a second order. */
  clientRequestId: string;
}

/**
 * A line as the API returns it — not the shape that was sent.
 *
 * The request carries `selections` (group slug -> option slugs); the response
 * carries `selectedOptions`, already resolved to localized labels, plus the
 * unit price actually charged. Reusing PlaceOrderLine here described a payload
 * the server never sends.
 */
export interface OrderLine {
  categorySlug: string;
  itemSlug: string;
  name: Record<Locale, string>;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  selectedOptions: Record<Locale, string>[];
  note?: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId: string;
  status: OrderStatus;
  totalMinor: number;
  placedAt: string;
  lines: OrderLine[];
  /** True when this came from the mock adapter and never reached a kitchen. */
  simulated: boolean;
}

export interface WaiterCallInput { tableId: string; reason: WaiterReason; note?: string }
export interface WaiterCall { id: string; tableId: string; reason: WaiterReason; createdAt: string; simulated: boolean }

export interface BillRequestInput { tableId: string; method: PaymentMethod; splitWays?: number }
export interface BillRequest { id: string; tableId: string; method: PaymentMethod; splitWays?: number; createdAt: string; simulated: boolean }

export interface FeedbackInput {
  tableId?: string;
  rating: number;
  compliments: string[];
  comment?: string;
  locale: Locale;
}
export interface Feedback { id: string; createdAt: string; simulated: boolean }

export interface MistApi {
  /** True when no backend is configured and results are simulated locally. */
  readonly isMock: boolean;
  placeOrder(input: PlaceOrderInput): Promise<Order>;
  activeOrders(tableId: string): Promise<Order[]>;
  callWaiter(input: WaiterCallInput): Promise<WaiterCall>;
  requestBill(input: BillRequestInput): Promise<BillRequest>;
  sendFeedback(input: FeedbackInput): Promise<Feedback>;
}

/** Emitted by whichever realtime transport is active. */
export type RealtimeEvent =
  | { type: "order-status"; orderId: string; status: OrderStatus }
  | { type: "waiter-acknowledged"; callId: string }
  | { type: "bill-acknowledged"; billId: string };

export interface RealtimeClient {
  join(tableId: string): Promise<void>;
  on(handler: (event: RealtimeEvent) => void): () => void;
  dispose(): Promise<void>;
}
