import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props<T extends ElementType> = {
  as?: T;
  /** `strong` for floating chrome, `legible` behind body text (WCAG scrim). */
  tone?: "default" | "strong" | "legible";
  /** Draw the specular top edge that reads as a glass bevel. */
  edge?: boolean;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children">;

const TONES = {
  default: "glass",
  strong: "glass-strong",
  legible: "glass-legible",
} as const;

/** The base material. Everything visible in the app sits on one of these. */
export function GlassSurface<T extends ElementType = "div">({
  as,
  tone = "default",
  edge = true,
  className,
  children,
  ...rest
}: Props<T>) {
  const Component = (as ?? "div") as ElementType;
  return (
    <Component
      className={cn(
        TONES[tone],
        edge && "glass-edge",
        "rounded-[var(--radius-card)]",
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}
