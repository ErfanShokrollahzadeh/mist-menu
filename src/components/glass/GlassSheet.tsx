"use client";

import { Drawer } from "vaul";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Bottom sheet with real drag physics (vaul wraps Radix Dialog, so focus
 * trapping, escape handling and aria wiring come for free).
 */
export function GlassSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" />
        <Drawer.Content
          aria-describedby={description ? undefined : ""}
          className={cn(
            "glass-legible glass-edge fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-lg flex-col",
            "rounded-t-[var(--radius-sheet)] outline-none",
            className,
          )}
        >
          <div className="mx-auto mt-3 h-1.5 w-11 shrink-0 rounded-full bg-[var(--ink-faint)]/40" />

          <header className="flex items-start gap-3 px-5 pt-4 pb-3">
            <div className="min-w-0 flex-1">
              <Drawer.Title className="text-lg font-bold tracking-tight">{title}</Drawer.Title>
              {description && (
                <Drawer.Description className="mt-0.5 text-sm text-[var(--ink-muted)]">
                  {description}
                </Drawer.Description>
              )}
            </div>
            <Drawer.Close
              className="grid size-9 shrink-0 place-items-center rounded-full text-[var(--ink-muted)] transition-colors hover:bg-[var(--hairline)] hover:text-[var(--ink)]"
              aria-label="Close"
            >
              <X className="size-[18px]" />
            </Drawer.Close>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">{children}</div>

          {footer && (
            <footer className="shrink-0 border-t border-[var(--hairline)] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {footer}
            </footer>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
