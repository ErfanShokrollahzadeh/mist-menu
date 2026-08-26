"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Printer, RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { TableDto } from "@/lib/admin/contracts";
import { adminApi } from "@/lib/admin/client";
import { GlassSurface } from "@/components/glass/GlassSurface";
import { GlassButton } from "@/components/glass/GlassButton";
import { cn } from "@/lib/cn";

const ZONE_LABEL: Record<string, string> = {
  Indoor: "İç Mekân", Terrace: "Teras", Garden: "Bahçe",
};

export function TableManager({ origin }: { origin: string }) {
  const [tables, setTables] = useState<TableDto[]>([]);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTables(await adminApi.tables());
    } catch {
      toast.error("Masalar yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // The printed code carries the opaque token, never the table number: a bare
  // number in the URL lets anyone order to somebody else's table.
  const linkFor = useCallback(
    (t: TableDto) => `${origin}/tr/menu?t=${t.qrToken}`,
    [origin],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const t of tables) {
        next[t.number] = await QRCode.toString(linkFor(t), {
          type: "svg", margin: 0, errorCorrectionLevel: "M",
          color: { dark: "#000000", light: "#ffffff" },
        });
      }
      if (!cancelled) setCodes(next);
    })();
    return () => { cancelled = true; };
  }, [tables, linkFor]);

  const rotate = async (t: TableDto) => {
    if (!window.confirm(
      `Masa ${t.number} için yeni kod üretilsin mi?\n\nBasılı olan kod çalışmayı durduracak.`,
    )) return;
    try {
      const updated = await adminApi.rotateToken(t.number);
      setTables((prev) => prev.map((x) => (x.number === t.number ? updated : x)));
      toast.success(`Masa ${t.number} kodu yenilendi — yeniden bastırın`);
    } catch {
      toast.error("Kod yenilenemedi");
    }
  };

  const byZone = useMemo(() => {
    const groups = new Map<string, TableDto[]>();
    for (const t of tables) {
      const list = groups.get(t.zone) ?? [];
      list.push(t);
      groups.set(t.zone, list);
    }
    return [...groups.entries()];
  }, [tables]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-xl font-bold tracking-tight">Masalar & QR</h1>
        <div className="flex gap-2">
          <GlassButton variant="ghost" size="sm" onClick={() => void load()} className="gap-1.5">
            <RefreshCw className={cn("size-4", loading && "animate-spin")} /> Yenile
          </GlassButton>
          <GlassButton variant="accent" size="sm" onClick={() => window.print()} className="gap-1.5">
            <Printer className="size-4" /> Yazdır
          </GlassButton>
        </div>
      </div>

      <p className="text-sm text-[var(--ink-muted)] print:hidden">
        Her kod masaya özel bir jeton taşır. Kodu yenilerseniz o masanın basılı kodu geçersiz olur.
      </p>

      {byZone.map(([zone, list]) => (
        <section key={zone} className="space-y-2">
          <h2 className="text-[11px] font-bold tracking-wider text-[var(--ink-faint)] uppercase print:text-black">
            {ZONE_LABEL[zone] ?? zone}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 print:grid-cols-3">
            {list.map((t) => (
              <GlassSurface
                key={t.number}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 print:border print:border-black print:bg-white",
                  !t.isActive && "opacity-50",
                )}
              >
                <span className="text-sm font-bold print:text-black">Masa {t.number}</span>
                <div
                  className="size-28 bg-white p-1.5 [&>svg]:size-full"
                  // Generated locally from the table's own token.
                  dangerouslySetInnerHTML={{ __html: codes[t.number] ?? "" }}
                />
                <span className="text-[10px] text-[var(--ink-faint)] print:text-black">
                  {t.seats} kişilik
                </span>
                <GlassButton
                  variant="ghost" size="sm"
                  onClick={() => rotate(t)}
                  className="gap-1 text-[11px] print:hidden"
                  aria-label={`Masa ${t.number} kodunu yenile`}
                >
                  <RotateCcw className="size-3" /> Yenile
                </GlassButton>
              </GlassSurface>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
