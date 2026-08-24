"use client";

import type {
  MistApi, Order, PlaceOrderInput, WaiterCallInput, WaiterCall,
  BillRequestInput, BillRequest, FeedbackInput, Feedback,
} from "./contracts";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api/v1${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    // The API answers with RFC 9457 problem details.
    const problem = await res.json().catch(() => null);
    throw new ApiError(res.status, problem?.detail ?? problem?.title ?? res.statusText);
  }
  return (await res.json()) as T;
}

/** Talks to Mist.Api. Selected only when NEXT_PUBLIC_API_URL is set. */
export const httpApi: MistApi = {
  isMock: false,

  placeOrder: (input: PlaceOrderInput) =>
    request<Order>("/orders", {
      method: "POST",
      // The table travels in a header too, so the rate limiter can partition
      // on it rather than on a shared cafe IP.
      headers: { "X-Mist-Table": input.tableId },
      body: JSON.stringify(input),
    }),

  activeOrders: (tableId: string) =>
    request<Order[]>(`/tables/${encodeURIComponent(tableId)}/orders/active`),

  callWaiter: (input: WaiterCallInput) =>
    request<WaiterCall>("/service/waiter-calls", {
      method: "POST",
      headers: { "X-Mist-Table": input.tableId },
      body: JSON.stringify(input),
    }),

  requestBill: (input: BillRequestInput) =>
    request<BillRequest>("/service/bill-requests", {
      method: "POST",
      headers: { "X-Mist-Table": input.tableId },
      body: JSON.stringify(input),
    }),

  sendFeedback: (input: FeedbackInput) =>
    request<Feedback>("/feedback", { method: "POST", body: JSON.stringify(input) }),
};
