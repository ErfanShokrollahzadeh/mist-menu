"use client";

import { Suspense, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Toaster } from "sonner";
import { TopBar } from "./TopBar";
import { BottomHub } from "./BottomHub";
import { TableSync } from "@/components/system/TableSync";
import { ServiceWorkerRegistrar } from "@/components/system/ServiceWorkerRegistrar";
import { useTheme } from "@/components/system/ThemeProvider";

/*
 * The five sheets pull in vaul and their own trees, and not one of them is
 * needed to paint or hydrate the menu — they are all behind a tap. Loading them
 * as separate chunks gets them off the hydration critical path, which is what
 * made the first few taps after load feel unresponsive.
 *
 * They stay rendered unconditionally rather than mounted on open: vaul owns the
 * close animation, so unmounting a sheet when it closes would cut that
 * animation off. Rendering them always keeps behaviour identical to before.
 */
const TraySheet = dynamic(() => import("@/components/tray/TraySheet").then((m) => m.TraySheet), { ssr: false });
const WaiterSheet = dynamic(() => import("@/components/actions/WaiterSheet").then((m) => m.WaiterSheet), { ssr: false });
const BillSheet = dynamic(() => import("@/components/actions/BillSheet").then((m) => m.BillSheet), { ssr: false });
const WifiSheet = dynamic(() => import("@/components/actions/WifiSheet").then((m) => m.WifiSheet), { ssr: false });
const FeedbackSheet = dynamic(() => import("@/components/actions/FeedbackSheet").then((m) => m.FeedbackSheet), { ssr: false });

export function AppShell({ children }: { children: ReactNode }) {
  const { resolved } = useTheme();

  return (
    <>
      {/* useSearchParams inside; without Suspense the route loses static rendering. */}
      <Suspense fallback={null}>
        <TableSync />
      </Suspense>

      <ServiceWorkerRegistrar />

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
