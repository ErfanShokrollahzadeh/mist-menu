#!/usr/bin/env node
/**
 * Proves the real-time path end to end: a staff client joins the hub, an
 * anonymous customer POSTs an order and a waiter call, and both must arrive
 * as pushes within the timeout.
 */
import * as signalR from "@microsoft/signalr";

const API = process.env.API_URL ?? "http://localhost:5080";
const TABLE = "7";
const TIMEOUT = 8000;

const waitFor = (label, wire) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out waiting for ${label}`)), TIMEOUT);
    wire((payload) => { clearTimeout(timer); resolve(payload); });
  });

const orders = new signalR.HubConnectionBuilder().withUrl(`${API}/hubs/orders`).build();
const service = new signalR.HubConnectionBuilder().withUrl(`${API}/hubs/service`).build();

let failures = 0;
const check = (ok, label, detail = "") => {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

try {
  await orders.start();
  await service.start();
  check(true, "both hubs connected");

  await orders.invoke("JoinStaff");
  await orders.invoke("JoinTable", TABLE);
  await service.invoke("JoinStaff");
  check(true, "joined staff and table groups");

  const orderPush = waitFor("OrderCreated", (done) => orders.on("OrderCreated", done));
  const res = await fetch(`${API}/api/v1/orders`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      tableId: TABLE, locale: "tr", clientRequestId: `signalr-${Date.now()}`,
      lines: [{ categorySlug: "cay", itemSlug: "bardak-cay", quantity: 2, selections: {}, note: null }],
    }),
  });
  check(res.status === 201, "order accepted", `HTTP ${res.status}`);

  const pushed = await orderPush;
  check(pushed.tableId === TABLE, "OrderCreated pushed to staff", `order ${pushed.orderNumber}, table ${pushed.tableId}`);
  check(pushed.totalMinor === 8000, "pushed total is correct", `${pushed.totalMinor} kurus`);

  const callPush = waitFor("WaiterCalled", (done) => service.on("WaiterCalled", done));
  await fetch(`${API}/api/v1/service/waiter-calls`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tableId: TABLE, reason: "napkins", note: null }),
  });
  const call = await callPush;
  check(call.reason === "napkins", "WaiterCalled pushed to staff", `table ${call.tableId}, reason ${call.reason}`);
} catch (err) {
  check(false, "realtime round-trip", err.message);
} finally {
  await orders.stop().catch(() => {});
  await service.stop().catch(() => {});
}

console.log(failures === 0 ? "\nPASS\n" : `\nFAIL — ${failures} check(s)\n`);
process.exit(failures === 0 ? 0 : 1);
