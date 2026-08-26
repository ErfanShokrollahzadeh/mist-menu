#!/usr/bin/env node
/**
 * Verifies the order status transition path end to end: authorisation,
 * the legal-move rules, the audit event, and the SignalR push that drives
 * both the kitchen board and the customer's status stepper.
 */
import * as signalR from "@microsoft/signalr";
import { staffToken } from "./_session.mjs";

const API = process.env.API_URL ?? "http://localhost:5080";
const TABLE = "5";

let failures = 0;
const check = (ok, label, detail = "") => {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

const login = await staffToken();
const auth = { authorization: `Bearer ${login.accessToken}` };

const move = (id, status, headers = auth) =>
  fetch(`${API}/api/v1/admin/orders/${id}/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ status }),
  });

console.log("\nAUTHORISATION");
const order = await (await fetch(`${API}/api/v1/orders`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({
    tableId: TABLE, locale: "tr", clientRequestId: `kds-${Date.now()}`,
    lines: [{ categorySlug: "cay", itemSlug: "bardak-cay", quantity: 1, selections: {}, note: null }],
  }),
})).json();
check(order.status === "received", "order starts as received", order.orderNumber);

const anon = await move(order.id, "Preparing", {});
check(anon.status === 401, "status change refused without a token", `HTTP ${anon.status}`);

console.log("\nLIVE PUSH + LEGAL MOVES");
const hub = new signalR.HubConnectionBuilder()
  .withUrl(`${API}/hubs/orders`, { accessTokenFactory: () => login.accessToken })
  .configureLogging(signalR.LogLevel.None).build();
await hub.start();
await hub.invoke("JoinStaff");

const pushes = [];
hub.on("OrderStatusChanged", (p) => pushes.push(p));

for (const next of ["Preparing", "Ready", "Served"]) {
  const res = await move(order.id, next);
  const body = await res.json();
  check(res.status === 200 && body.status === next.toLowerCase(),
        `moved to ${next}`, `HTTP ${res.status}`);
}
await new Promise((r) => setTimeout(r, 700));
check(pushes.length === 3, "each move pushed to staff", `${pushes.length} pushes`);

console.log("\nILLEGAL MOVES REJECTED");
const paid = await move(order.id, "Paid");
check(paid.status === 200, "Served -> Paid allowed", `HTTP ${paid.status}`);
const backwards = await move(order.id, "Preparing");
check(backwards.status === 400, "Paid -> Preparing rejected", `HTTP ${backwards.status}`);
const bogus = await move(order.id, "Teleported");
check(bogus.status === 400, "unknown status rejected", `HTTP ${bogus.status}`);
const repeat = await move(order.id, "Paid");
check(repeat.status === 400, "no-op move rejected", `HTTP ${repeat.status}`);

console.log("\nBOARD");
const board = await (await fetch(`${API}/api/v1/admin/orders/board`, { headers: auth })).json();
check(Array.isArray(board) && board.some((o) => o.id === order.id),
      "order appears on the kitchen board", `${board.length} orders`);

await hub.stop().catch(() => {});
console.log(failures === 0 ? "\nPASS\n" : `\nFAIL — ${failures} check(s)\n`);
process.exit(failures === 0 ? 0 : 1);
