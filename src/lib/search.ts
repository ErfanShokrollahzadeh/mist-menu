import type { MenuItem, Locale } from "@/types/menu";

/**
 * Lazy façade over `./search-impl`.
 *
 * fuse.js plus the pre-folded haystacks are ~60 KB that most visitors never
 * touch — a QR menu is mostly browsed, not searched. Keeping the real
 * implementation behind a dynamic import takes that off the first-paint path
 * without making the render path async.
 */

type Impl = typeof import("./search-impl");

let impl: Impl | null = null;
let pending: Promise<Impl> | null = null;

/** Starts (or joins) the fetch of fuse.js and the index. Idempotent. */
export function loadSearch(): Promise<Impl> {
  pending ??= import("./search-impl").then((m) => (impl = m));
  return pending;
}

/** True once `loadSearch()` has resolved and `searchMenu` can actually answer. */
export const isSearchReady = () => impl !== null;

/**
 * Deliberately synchronous: the component tree stays simple and `useMemo` keeps
 * working. Returns [] until the chunk lands — callers must re-run the query
 * once `loadSearch()` resolves, which MenuBrowser does via state.
 */
export function searchMenu(query: string, locale: Locale, limit = 60): MenuItem[] {
  return impl ? impl.searchMenu(query, locale, limit) : [];
}
