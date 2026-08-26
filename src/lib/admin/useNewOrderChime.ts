"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A two-tone chime for new orders, synthesised rather than shipped as an asset.
 *
 * Browsers refuse to start audio until the page has had a user gesture, so a
 * kitchen display left alone would believe it was audible while making no
 * sound. The `armed` flag is surfaced in the UI so staff can see the
 * difference rather than discover it during a rush.
 */
export function useNewOrderChime() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [armed, setArmed] = useState(false);

  const arm = useCallback(async () => {
    try {
      ctxRef.current ??= new AudioContext();
      if (ctxRef.current.state === "suspended") await ctxRef.current.resume();
      setArmed(ctxRef.current.state === "running");
    } catch {
      setArmed(false);
    }
  }, []);

  const play = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || ctx.state !== "running") return;

    const now = ctx.currentTime;
    for (const [i, freq] of [880, 1320].entries()) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      // Short exponential decay: audible across a kitchen, gone before it nags.
      gain.gain.setValueAtTime(0.0001, now + i * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.14 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.14 + 0.32);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.34);
    }
  }, []);

  useEffect(() => () => void ctxRef.current?.close().catch(() => {}), []);

  return { armed, arm, play };
}
