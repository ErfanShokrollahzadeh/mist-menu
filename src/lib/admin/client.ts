"use client";

import type { Order, OrderStatus } from "@/lib/api/contracts";
import type { AdminApi, AuthTokens } from "./contracts";
import { useAuth } from "@/stores/auth";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export class AdminApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "AdminApiError";
  }
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const problem = await res.json().catch(() => null);
    throw new AdminApiError(res.status, problem?.detail ?? problem?.title ?? res.statusText);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

/**
 * Attaches the access token and, on a 401, transparently refreshes once and
 * retries. Without that a shift-long KDS session would drop out every time
 * the 30-minute access token lapsed.
 */
async function authed<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const { tokens, setTokens } = useAuth.getState();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(tokens ? { authorization: `Bearer ${tokens.accessToken}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401 && retry && tokens?.refreshToken) {
    try {
      const refreshed = await adminApi.refresh(tokens.refreshToken);
      setTokens(refreshed);
      return authed<T>(path, init, false);
    } catch {
      setTokens(null);   // refresh itself failed — the session is genuinely over
    }
  }
  return parse<T>(res);
}

export const adminApi: AdminApi = {
  login: (email, password) =>
    fetch(`${BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then(parse<AuthTokens>),

  refresh: (refreshToken) =>
    fetch(`${BASE}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }).then(parse<AuthTokens>),

  logout: (refreshToken) =>
    authed<void>("/api/v1/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  kitchenBoard: () => authed<Order[]>("/api/v1/admin/orders/board"),

  changeStatus: (orderId: string, status: OrderStatus) =>
    authed<Order>(`/api/v1/admin/orders/${orderId}/status`, {
      method: "PATCH",
      // The API takes the .NET casing; the wire format elsewhere is lowercase.
      body: JSON.stringify({ status: status.charAt(0).toUpperCase() + status.slice(1) }),
    }),
};

export const isBackendConfigured = Boolean(BASE);
