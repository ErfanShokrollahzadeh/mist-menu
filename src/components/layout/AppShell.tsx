"use client";

import { Suspense, type ReactNode } from "react";
import { Toaster } from "sonner";
import { TopBar } from "./TopBar";
import { BottomHub } from "./BottomHub";
import { TableSync } from "@/components/system/TableSync";
import { TraySheet } from "@/components/tray/TraySheet";
import { WaiterSheet } from "@/components/actions/WaiterSheet";
import { BillSheet } from "@/components/actions/BillSheet";
import { WifiSheet } from "@/components/actions/WifiSheet";
import { FeedbackSheet } from "@/components/actions/FeedbackSheet";
import { useTheme } from "@/components/system/ThemeProvider";

export function AppShell({ children }: { children: ReactNode }) {
  const { resolved } = useTheme();

  return (
    <>
      {/* useSearchParams inside; without Suspense the route loses static rendering. */}
      <Suspense fallback={null}>
        <TableSync />
      </Suspense>

      <TopBar />
      {children}
      <BottomHub />

      <TraySheet />
      <WaiterSheet />
      <BillSheet />
      <WifiSheet />
      <FeedbackSheet />

      <Toaster
        position="top-center"
        theme={resolved}
        offset={76}
        toastOptions={{
          className: "glass-legible glass-edge !rounded-[var(--radius-card)] !border-[var(--glass-border)] !text-[var(--ink)]",
        }}
      />
    </>
  );
}
