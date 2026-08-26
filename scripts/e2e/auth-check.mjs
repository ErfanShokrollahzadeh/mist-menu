#!/usr/bin/env node
/**
 * Verifies staff auth end to end, including the WebSocket case that has no
 * Authorization header and therefore needs the access_token query parameter.
 */
import * as signalR from "@microsoft/signalr";
import { readFileSync } from "node:fs";

const API = process.env.API_URL ?? "http://localhost:5080";
const EMAIL = "admin@mistcafe.local";
const PASSWORD = readFileSync("/tmp/admin-pw", "utf8").trim();

let failures = 0;
const check = (ok, label, detail = "") => {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

const post = (path, body, token) =>
  fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

console.log("\nLOGIN");
const loginRes = await post("/api/v1/auth/login", { email: EMAIL, password: PASSWORD });
check(loginRes.status === 200, "valid credentials accepted", `HTTP ${loginRes.status}`);
const tokens = await loginRes.json();
check(tokens.role === "Admin", "role claim returned", tokens.role);

console.log("\nREFRESH ROTATION");
// /auth/* is rate limited to 5/min per IP, so this section spends its budget
// carefully: rotate once, then immediately replay the spent token.
const r1 = await post("/api/v1/auth/refresh", { refreshToken: tokens.refreshToken });
check(r1.status === 200, "refresh token exchanges for a new pair", `HTTP ${r1.status}`);
const rotated = await r1.json();
check(rotated.refreshToken !== tokens.refreshToken, "refresh token actually rotated");

const replay = await post("/api/v1/auth/refresh", { refreshToken: tokens.refreshToken });
if (replay.status === 429) {
  check(false, "replay check inconclusive — rate limiter fired first",
        "run against a fresh window");
} else {
  check(replay.status === 401, "the consumed token cannot be replayed", `HTTP ${replay.status}`);
}

console.log("\nHUB AUTHORISATION (the WebSocket header problem)");
const connect = async (token) => {
  const conn = new signalR.HubConnectionBuilder()
    .withUrl(`${API}/hubs/orders`, token ? { accessTokenFactory: () => token } : {})
    .configureLogging(signalR.LogLevel.None)
    .build();
  await conn.start();
  try {
    await conn.invoke("JoinStaff");
    return { joined: true, conn };
  } catch (err) {
    return { joined: false, conn, error: String(err.message ?? err) };
  }
};

const anon = await connect(null);
check(!anon.joined, "JoinStaff refused without a token");
await anon.conn.stop().catch(() => {});

const authed = await connect(rotated.accessToken);
check(authed.joined, "JoinStaff accepted with a staff token", authed.error ?? "");
await authed.conn.stop().catch(() => {});

console.log("\nPUBLIC ENDPOINTS STAY ANONYMOUS");
const menu = await fetch(`${API}/api/v1/menu`);
check(menu.status === 200, "customers can still read the menu unauthenticated", `HTTP ${menu.status}`);

console.log("\nLOGIN RATE LIMIT");
// Deliberately last: this exhausts the per-IP budget for the window.
let sawLimit = false;
for (let i = 0; i < 8 && !sawLimit; i++) {
  const res = await post("/api/v1/auth/login", { email: EMAIL, password: "wrong" });
  if (res.status === 429) sawLimit = true;
}
check(sawLimit, "repeated login attempts are throttled", "429 within 8 tries");

console.log(failures === 0 ? "\nPASS\n" : `\nFAIL — ${failures} check(s)\n`);
process.exit(failures === 0 ? 0 : 1);
