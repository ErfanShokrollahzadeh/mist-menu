/**
 * Shared staff session for the e2e suites.
 *
 * Logging in per suite blows the API's own 5/min auth budget once more than a
 * few run in sequence — the throttle then answers 429 with an empty body and
 * every suite dies on JSON.parse rather than reporting anything useful. One
 * cached token serves them all, and a genuine throttle is reported as such.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const API = process.env.API_URL ?? "http://localhost:5080";
const CACHE = "/tmp/mist-e2e-token.json";
const EMAIL = "admin@mistcafe.local";

export async function staffToken() {
  if (existsSync(CACHE)) {
    try {
      const cached = JSON.parse(readFileSync(CACHE, "utf8"));
      if (new Date(cached.accessTokenExpiresAt) > new Date(Date.now() + 60_000)) return cached;
    } catch {
      /* fall through and log in again */
    }
  }

  const password = readFileSync("/tmp/admin-pw", "utf8").trim();
  const res = await fetch(`${API}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password }),
  });

  if (res.status === 429) {
    throw new Error(
      "Login throttled (429). The API allows 5 auth calls per minute per IP; " +
      "wait for the window to clear and re-run.",
    );
  }
  if (!res.ok) throw new Error(`Login failed: HTTP ${res.status}`);

  const tokens = await res.json();
  writeFileSync(CACHE, JSON.stringify(tokens));
  return tokens;
}

export const authHeaders = (tokens) => ({
  authorization: `Bearer ${tokens.accessToken}`,
  "content-type": "application/json",
});
