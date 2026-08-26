#!/usr/bin/env node
/** Verifies the menu CMS: authorisation split, validation, cache invalidation,
 *  reordering, and the refusal to delete an item that appears on past orders. */
import { staffToken } from "./_session.mjs";

const API = process.env.API_URL ?? "http://localhost:5080";
let failures = 0;
const check = (ok, label, detail = "") => {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

const login = await staffToken();
const auth = { authorization: `Bearer ${login.accessToken}`, "content-type": "application/json" };

const menu = async () => (await (await fetch(`${API}/api/v1/menu`)).json());
const findItem = (doc, cat, slug) =>
  doc.categories.find((c) => c.slug === cat)?.items.find((i) => i.slug === slug);

console.log("\nAUTHORISATION");
const anon = await fetch(`${API}/api/v1/admin/menu/items`, {
  method: "PUT", headers: { "content-type": "application/json" }, body: "{}" });
check(anon.status === 401, "menu writes refused without a token", `HTTP ${anon.status}`);

console.log("\nCACHE INVALIDATION (the edit must be visible at once)");
await menu();                                   // warm the cache
const before = findItem(await menu(), "cay", "bardak-cay");
const toggled = await fetch(
  `${API}/api/v1/admin/menu/cay/bardak-cay/availability`,
  { method: "PATCH", headers: auth, body: JSON.stringify({ isAvailable: false }) });
check(toggled.status === 200, "sold-out toggle accepted", `HTTP ${toggled.status}`);
const after = findItem(await menu(), "cay", "bardak-cay");
check(before.isAvailable === true && after.isAvailable === false,
      "public menu reflects it immediately, not after the TTL",
      `${before.isAvailable} -> ${after.isAvailable}`);
await fetch(`${API}/api/v1/admin/menu/cay/bardak-cay/availability`,
  { method: "PATCH", headers: auth, body: JSON.stringify({ isAvailable: true }) });

console.log("\nCREATE / EDIT / VALIDATE");
const draft = {
  slug: null, categorySlug: "cay",
  name: { tr: "Test Çayı", en: "Test Tea" },
  description: { tr: "", en: "" },
  priceMinor: 5500, imageUrl: null, tags: ["caffeine"], allergens: [],
  calories: null, isAvailable: true,
};
const created = await fetch(`${API}/api/v1/admin/menu/items`,
  { method: "PUT", headers: auth, body: JSON.stringify(draft) });
check(created.status === 200, "item created", `HTTP ${created.status}`);
const item = await created.json();
check(item.slug === "test-cayi", "slug generated with the Turkish fold", item.slug);
check(findItem(await menu(), "cay", "test-cayi") !== undefined, "appears on the public menu");

const dupe = await fetch(`${API}/api/v1/admin/menu/items`,
  { method: "PUT", headers: auth, body: JSON.stringify(draft) });
check(dupe.status === 400, "duplicate name rejected", `HTTP ${dupe.status}`);

const freePrice = await fetch(`${API}/api/v1/admin/menu/items`,
  { method: "PUT", headers: auth, body: JSON.stringify({ ...draft, priceMinor: 0 }) });
check(freePrice.status === 400, "zero price rejected", `HTTP ${freePrice.status}`);

console.log("\nREORDER");
const cay = (await menu()).categories.find((c) => c.slug === "cay");
const reversed = cay.items.map((i) => i.slug).reverse();
const reorder = await fetch(`${API}/api/v1/admin/menu/cay/reorder`,
  { method: "POST", headers: auth, body: JSON.stringify({ slugs: reversed }) });
check(reorder.status === 200, "reorder accepted", `HTTP ${reorder.status}`);
const after2 = (await menu()).categories.find((c) => c.slug === "cay").items.map((i) => i.slug);
check(JSON.stringify(after2) === JSON.stringify(reversed), "new order persisted and served");
await fetch(`${API}/api/v1/admin/menu/cay/reorder`,
  { method: "POST", headers: auth, body: JSON.stringify({ slugs: reversed.slice().reverse() }) });

const dupOrder = await fetch(`${API}/api/v1/admin/menu/cay/reorder`,
  { method: "POST", headers: auth, body: JSON.stringify({ slugs: ["bardak-cay", "bardak-cay"] }) });
check(dupOrder.status === 400, "duplicate slugs in an ordering rejected", `HTTP ${dupOrder.status}`);

console.log("\nHISTORY IS PROTECTED");
const del = await fetch(`${API}/api/v1/admin/menu/cay/test-cayi`, { method: "DELETE", headers: auth });
check(del.status === 204, "an unsold item can be deleted", `HTTP ${del.status}`);
const sold = await fetch(`${API}/api/v1/admin/menu/cay/bardak-cay`, { method: "DELETE", headers: auth });
check(sold.status === 400, "an item on past orders cannot be deleted", `HTTP ${sold.status}`);

console.log(failures === 0 ? "\nPASS\n" : `\nFAIL — ${failures} check(s)\n`);
process.exit(failures === 0 ? 0 : 1);
