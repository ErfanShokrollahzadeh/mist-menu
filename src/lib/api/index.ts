"use client";

import type { MistApi, RealtimeClient } from "./contracts";
import { mockApi, mockRealtime } from "./mock";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * With NEXT_PUBLIC_API_URL unset — the Vercel default — the app runs entirely
 * on the static menu and a local simulation, so the public site never depends
 * on the backend being reachable. Point the variable at a running Mist.Api to
 * switch to live orders and SignalR.
 */
export function getApi(): MistApi {
  if (!API_URL) return mockApi;
  // Loaded lazily so @microsoft/signalr stays out of the default bundle.
  throw new Error("HTTP adapter is wired up in src/lib/api/http.ts");
}

export function getRealtime(): RealtimeClient {
  if (!API_URL) return mockRealtime;
  throw new Error("SignalR adapter is wired up in src/lib/api/signalr.ts");
}

export const isMockMode = !API_URL;
