"use client";

import { useCallback, useEffect, useState } from "react";
import { Receipt, Wallet, ShoppingBasket, Timer } from "lucide-react";
import { toast } from "sonner";
import type { AnalyticsDto } from "@/lib/admin/analytics";
import { adminApi } from "@/lib/admin/client";
import { useAuth } from "@/stores/auth";
import { formatPrice } from "@/lib/menu";
import { GlassSurface } from "@/components/glass/GlassSurface";
import { StatTile } from "./charts/StatTile";
import { RevenueLine } from "./charts/RevenueLine";
import { PeakHeatmap } from "./charts/PeakHeatmap";
import { TopItemsBar } from "./charts/TopItemsBar";
import { cn } from "@/lib/cn";

const RANGES = [
  { days: 7, label: "7 gün" },
  { days: 30, label: "30 gün" },
  { days: 90, label: "90 gün" },
] as const;

const iso = (d: Date) => d.toISOString().slice(0, 10);

export function Dashboard() {
  const isAdmin = useAuth((s) => s.isAdmin());
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<AnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (span: number) => {
    setLoading(true);
    try {
      const to = new Date();
      const from = new Date(to.getTime() - (span - 1) * 86400000);
      setData(await adminApi.analytics(iso(from), iso(to)));
    } catch {
      toast.error("Analitik yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isAdmin) void load(days); }, [isAdmin, days, load]);

  // Sales figures are the owner's business; the API enforces this too.
  if (!isAdmin) {
    return (
      <GlassSurface className="max-w-md p-5">
        <h1 className="text-lg font-bold">Yetki gerekli</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Satış raporları yalnızca yöneticiler içindir. Mutfak panosuna geçebilirsiniz.
        </p>
      </GlassSurface>
    );
  }

  const s = data?.summary;

  return (
    <div className="space-y-4">
      {/* Filters sit in one row above the charts. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">Satış Raporu</h1>
        <div className="glass flex items-center gap-1 rounded-[var(--radius-pill)] p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              aria-pressed={days === r.days}
              className={cn(
                "rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold transition-colors",
                days === r.days
                  ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Ciro" value={s ? formatPrice(s.revenueMinor, "tr") : "—"}
                  icon={<Wallet className="size-4" />} />
        <StatTile label="Sipariş" value={s ? String(s.orderCount) : "—"}
                  icon={<Receipt className="size-4" />} />
        <StatTile label="Ortalama Sepet" value={s ? formatPrice(s.averageTicketMinor, "tr") : "—"}
                  hint={s ? `${s.itemsSold} ürün satıldı` : undefined}
                  icon={<ShoppingBasket className="size-4" />} />
        <StatTile
          label="Hazırlama"
          value={s?.medianPrepMinutes != null ? `${s.medianPrepMinutes} dk` : "—"}
          hint={s?.p90PrepMinutes != null ? `%90: ${s.p90PrepMinutes} dk` : "veri yok"}
          icon={<Timer className="size-4" />}
        />
      </div>

      <GlassSurface className="p-4">
        <h2 className="mb-3 text-sm font-bold">Günlük Ciro (₺)</h2>
        {loading ? <Skeleton /> : <RevenueLine points={data?.revenue ?? []} />}
      </GlassSurface>

      <div className="grid gap-3 xl:grid-cols-2">
        <GlassSurface className="p-4">
          <h2 className="mb-3 text-sm font-bold">Yoğun Saatler</h2>
          {loading ? <Skeleton /> : <PeakHeatmap cells={data?.peak ?? []} />}
        </GlassSurface>
        <GlassSurface className="p-4">
          <h2 className="mb-3 text-sm font-bold">En Çok Satanlar</h2>
          {loading ? <Skeleton /> : <TopItemsBar items={data?.topItems ?? []} />}
        </GlassSurface>
      </div>
    </div>
  );
}

const Skeleton = () => (
  <div className="h-48 animate-pulse rounded-[var(--radius-card)] bg-[var(--hairline)]" />
);
