"use client";

import { useEffect, useState } from "react";

/**
 * True while the reader is scrolling *down* past `threshold`, false the moment
 * they scroll up or return to the top.
 *
 * Shared by the two pieces of chrome that react to it: the menu header folds
 * its search away, and the bottom bar condenses to icons. Both want the same
 * signal, so they read the same hook rather than each running a listener.
 *
 * One passive listener coalesced into a frame. The expensive thing in this app
 * was never a scroll listener — it was animating the blurred backdrop
 * underneath 255 glass surfaces.
 */
export function useScrolledDown(threshold = 220) {
  const [down, setDown] = useState(false);

  useEffect(() => {
    let frame = 0;
    let last = window.scrollY;

    const read = () => {
      frame = 0;
      const y = window.scrollY;
      const delta = y - last;
      // Ignore sub-pixel jitter and rubber-banding at the top.
      if (Math.abs(delta) > 6) {
        setDown(y > threshold && delta > 0);
        last = y;
      }
      if (y <= threshold) setDown(false);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [threshold]);

  return down;
}
