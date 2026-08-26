import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AmbientBackdrop } from "@/components/layout/AmbientBackdrop";

/**
 * Customer chrome lives here rather than in [lang]/layout.tsx so that
 * /[lang]/admin does not inherit it. Admin was rendering the customer top bar,
 * the bottom hub and the ambient mesh on top of the kitchen display.
 */
export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AmbientBackdrop />
      <AppShell>{children}</AppShell>
    </>
  );
}
