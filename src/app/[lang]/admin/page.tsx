import Link from "next/link";
import { ChefHat } from "lucide-react";
import { GlassSurface } from "@/components/glass/GlassSurface";

export default async function AdminHomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold tracking-tight">Panel</h1>
      <GlassSurface className="max-w-sm">
        <Link href={`/${lang}/admin/kds`} className="flex items-center gap-3 p-4">
          <span className="grid size-11 place-items-center rounded-2xl bg-[var(--accent)]/12 text-[var(--accent)]">
            <ChefHat className="size-[22px]" strokeWidth={1.9} />
          </span>
          <span>
            <span className="block font-semibold">Mutfak Panosu</span>
            <span className="block text-xs text-[var(--ink-faint)]">Canlı sipariş akışı</span>
          </span>
        </Link>
      </GlassSurface>
      <p className="text-sm text-[var(--ink-muted)]">
        Satış analitiği, menü yönetimi ve masa/QR araçları sırada.
      </p>
    </div>
  );
}
