import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LoginGate } from "@/components/admin/LoginGate";
import { AdminBar } from "@/components/admin/AdminBar";

export const metadata: Metadata = {
  title: "Operations",
  // Staff tooling should never be indexed.
  robots: { index: false, follow: false },
};

/**
 * Admin has its own shell: no customer bottom hub, no ambient mesh, denser
 * grid. Being a separate route group also keeps this code out of the
 * customer bundle.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <LoginGate>
      {/* data-surface="ops" opts staff tooling out of the customer serif:
          a kitchen display is scanned at speed, where a sans face wins. */}
      <div data-surface="ops" className="min-h-dvh">
        <AdminBar />
        <main className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-5">{children}</main>
      </div>
    </LoginGate>
  );
}
