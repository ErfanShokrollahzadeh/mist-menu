"use client";

import type { MistApi, RealtimeClient } from "./contracts";
import { mockApi, mockRealtime } from "./mock";
import { httpApi } from "./http";
import { createSignalRClient } from "./signalr";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/** True when no backend is configured, so the UI can say results are simulated. */
export const isMockMode = !API_URL;

let realtime: RealtimeClient | null = null;

/**
 * With NEXT_PUBLIC_API_URL unset — the Vercel default — the app runs entirely
 * on the static menu and a local simulation, so the public site never depends
 * on the backend being reachable. ASP.NET Core cannot be hosted on Vercel, so
 * this is not a temporary arrangement: the API is deployed separately and the
 * variable points at it.
 *
 * Both adapters are tiny; the heavy dependency is @microsoft/signalr, and
 * createSignalRClient defers importing it until a connection is actually made.
 */
export function getApi(): MistApi {
  return isMockMode ? mockApi : httpApi;
}

export function getRealtime(): RealtimeClient {
  if (isMockMode) return mockRealtime;
  realtime ??= createSignalRClient();
  return realtime;
}
