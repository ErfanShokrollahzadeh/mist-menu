"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks which category section the reader is currently looking at, and keeps
 * the sticky header's own height in a CSS variable so both the scroll offset
 * and the observer's trigger line stay correct when that header changes size
 * (a second row of chips, a wrapped search field, a larger text setting).
 *
 * One IntersectionObserver over ~11 sections — deliberately not a scroll
 * handler, which would run this work on every frame of a flick.
 */
export function useScrollSpy(slugs: string[], enabled: boolean) {
  const [active, setActive] = useState<string | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  /* Depend on the *contents*, not the array identity. MenuBrowser rebuilds
     this list on every keystroke, and re-running the effect meant tearing the
     observer down, forcing a style read and re-observing every section for
     each character typed. */
  const key = slugs.join("|");
  const slugsRef = useRef(slugs);
  slugsRef.current = slugs;

  /* Publish the sticky header height so sections can offset their scroll
     anchor by exactly the right amount instead of a guessed constant. */
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    let written = -1;
    const write = () => {
      /* Skip while the header is folded away. The scroll anchor should target
         the *expanded* layout, or jumping to a category while collapsed would
         land it under the bar once the header springs back. It also keeps this
         from firing on every frame of the 300ms collapse: setting a custom
         property on :root invalidates style for the entire document, and this
         document has 82 cards in it. */
      if (el.dataset.collapsed) return;
      // 64px is the top bar the filter header sticks beneath, plus a little air.
      const total = Math.round(el.getBoundingClientRect().height + 64 + 8);
      if (total === written) return;
      written = total;
      document.documentElement.style.setProperty("--menu-stick", `${total}px`);
    };
    write();
    const ro = new ResizeObserver(write);
    ro.observe(el);
    window.addEventListener("resize", write, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", write);
    };
  }, []);

  useEffect(() => {
    const slugs = slugsRef.current;
    if (!enabled || slugs.length === 0) {
      setActive(null);
      return;
    }

    const stick =
      parseInt(getComputedStyle(document.documentElement).getPropertyValue("--menu-stick"), 10) || 200;

    const nodes = slugs
      .map((slug) => document.getElementById(`cat-${slug}`))
      .filter((n): n is HTMLElement => n !== null);
    if (!nodes.length) return;

    /* Visible band is the strip just under the sticky header. A section counts
       as current once its top crosses that line, which is what a reader
       perceives as "the section I am in". */
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const slug = entry.target.id.replace(/^cat-/, "");
          if (entry.isIntersecting) visible.set(slug, entry.boundingClientRect.top);
          else visible.delete(slug);
        }
        if (visible.size === 0) return;
        // Topmost section still in the band wins.
        let best: string | null = null;
        let bestTop = Infinity;
        for (const [slug, top] of visible) {
          if (top < bestTop) {
            bestTop = top;
            best = slug;
          }
        }
        setActive(best);
      },
      { rootMargin: `-${stick}px 0px -65% 0px`, threshold: 0 },
    );

    /* Seed with the first section. At scroll-top nothing has crossed the
       trigger line yet, so without this the rail starts with no pill lit and
       only wakes up once the reader scrolls. */
    setActive((prev) => (prev && slugs.includes(prev) ? prev : (slugs[0] ?? null)));

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [key, enabled]);

  return { active, headerRef };
}

/** Smooth-scrolls a category into view, respecting the sticky header offset. */
export function jumpToCategory(slug: string) {
  const el = document.getElementById(`cat-${slug}`);
  if (!el) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}
