import { ServerOff } from "lucide-react";
import { GlassSurface } from "@/components/glass/GlassSurface";

/**
 * The customer app runs backend-free by design. Admin cannot: a simulated
 * kitchen display is worse than none, because staff would trust it.
 */
export function BackendRequired() {
  return (
    <div className="grid min-h-[60dvh] place-items-center px-4">
      <GlassSurface className="max-w-md p-6 text-center">
        <ServerOff className="mx-auto mb-3 size-9 text-[var(--ink-faint)]" strokeWidth={1.6} />
        <h1 className="text-lg font-bold">Backend not configured</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
          The admin hub needs a running Mist API. Set{" "}
          <code className="rounded bg-[var(--hairline)] px-1.5 py-0.5 font-mono text-xs">
            NEXT_PUBLIC_API_URL
          </code>{" "}
          and reload.
        </p>
        <p className="mt-3 text-xs text-[var(--ink-faint)]">
          The customer menu keeps working without it.
        </p>
      </GlassSurface>
    </div>
  );
}
