"use client";

import { useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { spring } from "@/lib/motion";

const button = cva(
  "relative isolate inline-flex items-center justify-center gap-2 overflow-hidden font-medium " +
    "select-none disabled:pointer-events-none disabled:opacity-50 " +
    "transition-colors duration-200",
  {
    variants: {
      variant: {
        glass: "glass glass-edge text-[var(--ink)] hover:bg-[var(--glass-bg-strong)]",
        accent:
          "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_6px_24px_-6px_var(--accent)] hover:brightness-110",
        ghost: "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--hairline)]",
      },
      size: {
        sm: "h-9 rounded-[var(--radius-pill)] px-3.5 text-sm",
        md: "h-11 rounded-[var(--radius-pill)] px-5 text-[0.9375rem]",
        lg: "h-13 rounded-[var(--radius-pill)] px-7 text-base",
        icon: "size-11 rounded-full",
      },
    },
    defaultVariants: { variant: "glass", size: "md" },
  },
);

type Ripple = { id: number; x: number; y: number };

type Props = ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof button> & {
    /** Pull toward the cursor on hover. Disabled on touch and reduced-motion. */
    magnetic?: boolean;
    children?: ReactNode;
  };

/**
 * Glass button with a magnetic hover pull and a click ripple — the two
 * micro-interactions that make a tap feel physical rather than instant.
 */
export function GlassButton({
  variant,
  size,
  magnetic = true,
  className,
  children,
  onPointerDown,
  ...rest
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const pull = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!magnetic || reduced || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setOffset({
      x: ((e.clientX - (r.left + r.width / 2)) / r.width) * 14,
      y: ((e.clientY - (r.top + r.height / 2)) / r.height) * 14,
    });
  };

  const release = () => setOffset({ x: 0, y: 0 });

  const press = (e: React.PointerEvent<HTMLButtonElement>) => {
    onPointerDown?.(e);
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    window.setTimeout(() => setRipples((prev) => prev.filter((p) => p.id !== id)), 620);
  };

  return (
    <motion.button
      ref={ref}
      className={cn(button({ variant, size }), className)}
      animate={offset}
      transition={spring.snappy}
      whileTap={reduced ? undefined : { scale: 0.96 }}
      onPointerMove={pull}
      onPointerLeave={release}
      onPointerDown={press}
      {...(rest as React.ComponentProps<typeof motion.button>)}
    >
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          aria-hidden
          className="pointer-events-none absolute -z-10 rounded-full bg-current/25"
          initial={{ width: 0, height: 0, opacity: 0.5, x: r.x, y: r.y }}
          animate={{ width: 320, height: 320, opacity: 0, x: r.x - 160, y: r.y - 160 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
      {children}
    </motion.button>
  );
}
