#!/usr/bin/env node
/** Verifies the QR token migration: tokens resolve, forgeries do not, tokens
 *  are admin-only, and rotation invalidates what is printed. */
import { readFileSync } from "node:fs";

const API = process.env.API_URL ?? "http://localhost:5080";
const PASSWORD = readFileSync("/tmp/admin-pw", "utf8").trim();
let failures = 0;
const check = (ok, label, detail = "") => {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

const login = await (await fetch(`${API}/api/v1/auth/login`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "admin@mistcafe.local", password: PASSWORD }),
})).json();
const auth = { authorization: `Bearer ${login.accessToken}`, "content-type": "application/json" };

console.log("\nTOKENS ARE A CREDENTIAL");
const anon = await fetch(`${API}/api/v1/admin/tables`);
check(anon.status === 401, "table listing (which carries tokens) is not public",
      `HTTP ${anon.status}`);

const tables = await (await fetch(`${API}/api/v1/admin/tables`, { headers: auth })).json();
check(tables.length === 32, "all tables listed", `${tables.length}`);
const t = tables.find((x) => x.number === "5");
check(/^[0-9a-f]{32}$/.test(t.qrToken), "token is opaque, not the table number", t.qrToken.slice(0, 12) + "…");

console.log("\nRESOLUTION");
const good = await fetch(`${API}/api/v1/tables/resolve/${t.qrToken}`);
check(good.status === 200, "a real token resolves", `HTTP ${good.status}`);
const resolved = await good.json();
check(resolved.number === "5", "to the right table", resolved.number);
check(resolved.qrToken === undefined, "the response does not echo the token back");

console.log("\nFORGERY");
for (const [label, candidate] of [
  ["a guessed table number", "5"],
  ["a plausible hex string", "00000000000000000000000000000000"],
  ["another table's number", "12"],
]) {
  const res = await fetch(`${API}/api/v1/tables/resolve/${candidate}`);
  check(res.status === 404, `${label} resolves to nothing`, `HTTP ${res.status}`);
}

console.log("\nROTATION INVALIDATES WHAT IS PRINTED");
const rotated = await (await fetch(`${API}/api/v1/admin/tables/5/rotate`,
  { method: "POST", headers: auth })).json();
check(rotated.qrToken !== t.qrToken, "token changed");
const stale = await fetch(`${API}/api/v1/tables/resolve/${t.qrToken}`);
check(stale.status === 404, "the old printed code stops working", `HTTP ${stale.status}`);
const fresh = await fetch(`${API}/api/v1/tables/resolve/${rotated.qrToken}`);
check(fresh.status === 200, "the new code works", `HTTP ${fresh.status}`);

console.log("\nVALIDATION");
const badSeats = await fetch(`${API}/api/v1/admin/tables`, {
  method: "PUT", headers: auth,
  body: JSON.stringify({ number: "99", zone: "Indoor", seats: 0, isActive: true }) });
check(badSeats.status === 400, "zero seats rejected", `HTTP ${badSeats.status}`);
const badZone = await fetch(`${API}/api/v1/admin/tables`, {
  method: "PUT", headers: auth,
  body: JSON.stringify({ number: "99", zone: "Rooftop", seats: 4, isActive: true }) });
check(badZone.status === 400, "unknown zone rejected", `HTTP ${badZone.status}`);

console.log(failures === 0 ? "\nPASS\n" : `\nFAIL — ${failures} check(s)\n`);
process.exit(failures === 0 ? 0 : 1);
