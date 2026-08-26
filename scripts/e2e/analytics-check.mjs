#!/usr/bin/env node
/** Asserts the API's aggregation against totals computed independently by the seeder. */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { staffToken } from "./_session.mjs";

const API = process.env.API_URL ?? "http://localhost:5080";

// Seed our own fixture rather than trusting what a previous suite left behind:
// the assertion is that the API's aggregates equal totals computed here
// independently, which only holds if these are the only orders in the window.
execFileSync("node", ["scripts/e2e/seed-history.mjs"], { stdio: "pipe" });
const expected = JSON.parse(readFileSync("/tmp/expected-analytics.json", "utf8"));

let failures = 0;
const check = (ok, label, detail = "") => {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

const login = await staffToken();
const auth = { authorization: `Bearer ${login.accessToken}` };

const today = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const from = iso(new Date(today.getTime() - 13 * 86400000));
const res = await fetch(`${API}/api/v1/admin/analytics?from=${from}&to=${iso(today)}`, { headers: auth });
check(res.status === 200, "analytics endpoint answers", `HTTP ${res.status}`);
const a = await res.json();

console.log("\nTOTALS MATCH HAND-COMPUTED VALUES");
check(a.summary.orderCount === expected.orderCount, "order count",
      `${a.summary.orderCount} vs ${expected.orderCount}`);
check(a.summary.revenueMinor === expected.revenueMinor, "revenue (kuruş)",
      `${a.summary.revenueMinor} vs ${expected.revenueMinor}`);
check(a.summary.itemsSold === expected.itemsSold, "items sold",
      `${a.summary.itemsSold} vs ${expected.itemsSold}`);
check(a.summary.averageTicketMinor === expected.averageTicketMinor, "average ticket",
      `${a.summary.averageTicketMinor} vs ${expected.averageTicketMinor}`);

console.log("\nDERIVED SERIES");
const seriesTotal = a.revenue.reduce((n, p) => n + p.revenueMinor, 0);
check(seriesTotal === expected.revenueMinor, "daily series sums to the headline",
      `${seriesTotal}`);
const peakTotal = a.peak.reduce((n, c) => n + c.orderCount, 0);
check(peakTotal === expected.orderCount, "heatmap cells sum to the order count", `${peakTotal}`);

const top = expected.topBySlug[0];
const apiTop = a.topItems[0];
check(apiTop?.slug === top.slug, "top seller identified", `${apiTop?.slug} vs ${top.slug}`);
check(apiTop?.quantitySold === top.qty, "top seller quantity",
      `${apiTop?.quantitySold} vs ${top.qty}`);
check(apiTop?.revenueMinor === top.revenue, "top seller revenue",
      `${apiTop?.revenueMinor} vs ${top.revenue}`);

console.log("\nGUARDS");
const staffOnly = await fetch(`${API}/api/v1/admin/analytics`, {});
check(staffOnly.status === 401, "analytics refused without a token", `HTTP ${staffOnly.status}`);
const bad = await fetch(`${API}/api/v1/admin/analytics?from=2020-01-01&to=2026-01-01`, { headers: auth });
check(bad.status === 400, "over-long range rejected", `HTTP ${bad.status}`);
const inverted = await fetch(`${API}/api/v1/admin/analytics?from=2026-06-01&to=2026-05-01`, { headers: auth });
check(inverted.status === 400, "inverted range rejected", `HTTP ${inverted.status}`);

console.log(failures === 0 ? "\nPASS\n" : `\nFAIL — ${failures} check(s)\n`);
process.exit(failures === 0 ? 0 : 1);
