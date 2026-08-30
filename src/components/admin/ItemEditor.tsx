"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { MenuItem, DietaryTag } from "@/types/menu";
import { adminApi, AdminApiError } from "@/lib/admin/client";
import { GlassSheet } from "@/components/glass/GlassSheet";
import { GlassButton } from "@/components/glass/GlassButton";
import { cn } from "@/lib/cn";

const TAGS: { id: DietaryTag; label: string }[] = [
  { id: "vegan", label: "Vegan" },
  { id: "vegetarian", label: "Vejetaryen" },
  { id: "spicy", label: "Acılı" },
  { id: "chefs-choice", label: "Şefin Seçimi" },
  { id: "caffeine", label: "Kafeinli" },
];

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block space-y-1">
    <span className="text-[11px] font-bold tracking-wider text-[var(--ink-faint)] uppercase">{label}</span>
    {children}
  </label>
);

const input =
  "glass w-full rounded-[var(--radius-card)] px-3 py-2 text-sm outline-none placeholder:text-[var(--ink-faint)]";

export function ItemEditor({
  categorySlug, existing, onClose,
}: {
  categorySlug: string;
  existing: MenuItem | null;
  onClose: () => void;
}) {
  const [nameTr, setNameTr] = useState(existing?.name.tr ?? "");
  const [nameEn, setNameEn] = useState(existing?.name.en ?? "");
  const [descTr, setDescTr] = useState(existing?.description.tr ?? "");
  const [descEn, setDescEn] = useState(existing?.description.en ?? "");
  // Edited in lira; stored as integer kuruş so a split bill cannot drift.
  const [price, setPrice] = useState(existing ? String(existing.priceMinor / 100) : "");
  const [imageUrl, setImageUrl] = useState(existing?.image.src ?? "");
  const [calories, setCalories] = useState(existing?.calories != null ? String(existing.calories) : "");
  const [tags, setTags] = useState<DietaryTag[]>(existing?.tags ?? []);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const lira = Number(price.replace(",", "."));
    if (!nameTr.trim()) return toast.error("Türkçe ad gerekli");
    if (!Number.isFinite(lira) || lira <= 0) return toast.error("Geçerli bir fiyat girin");

    setBusy(true);
    try {
      await adminApi.upsertItem({
        slug: existing?.slug ?? null,
        categorySlug,
        name: { tr: nameTr.trim(), en: nameEn.trim() || nameTr.trim() },
        description: { tr: descTr.trim(), en: descEn.trim() },
        priceMinor: Math.round(lira * 100),
        imageUrl: imageUrl.trim() || null,
        tags,
        // Allergens are deliberately not editable as free text here: the field
        // exists on the entity, but until the café supplies verified values the
        // UI must not let a guess become a food-safety claim.
        allergens: existing?.allergens ?? [],
        calories: calories.trim() ? Number(calories) : null,
        isAvailable: existing?.isAvailable ?? true,
      });
      toast.success(existing ? "Güncellendi" : "Eklendi");
      onClose();
      // The list is rendered from the build-time dataset; a reload picks up the
      // new server state rather than guessing at it locally.
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Kaydedilemedi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassSheet
      open
      onOpenChange={(v) => !v && onClose()}
      title={existing ? existing.name.tr : "Yeni Ürün"}
      description={existing ? undefined : "Bu kategoriye eklenecek"}
      footer={
        <GlassButton variant="accent" size="lg" className="w-full" disabled={busy} onClick={submit}>
          {existing ? "Kaydet" : "Ekle"}
        </GlassButton>
      }
    >
      <div className="grid gap-3 pb-4 sm:grid-cols-2">
        <Field label="Ad (TR)">
          <input className={input} value={nameTr} onChange={(e) => setNameTr(e.target.value)} />
        </Field>
        <Field label="Name (EN)">
          <input className={input} value={nameEn} onChange={(e) => setNameEn(e.target.value)}
                 placeholder={nameTr || "—"} />
        </Field>

        <Field label="Açıklama (TR)">
          <textarea className={cn(input, "resize-none")} rows={3} value={descTr}
                    onChange={(e) => setDescTr(e.target.value)} />
        </Field>
        <Field label="Description (EN)">
          <textarea className={cn(input, "resize-none")} rows={3} value={descEn}
                    onChange={(e) => setDescEn(e.target.value)} />
        </Field>

        <Field label="Fiyat (₺)">
          <input className={input} inputMode="decimal" value={price}
                 onChange={(e) => setPrice(e.target.value)} placeholder="0" />
        </Field>
        <Field label="Kalori (opsiyonel)">
          <input className={input} inputMode="numeric" value={calories}
                 onChange={(e) => setCalories(e.target.value)} placeholder="—" />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Görsel bağlantısı">
            <input className={input} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                   placeholder="/menu-images/… veya https://…" />
          </Field>
        </div>

        <div className="sm:col-span-2 space-y-1">
          <span className="text-[11px] font-bold tracking-wider text-[var(--ink-faint)] uppercase">
            Etiketler
          </span>
          <div className="flex flex-wrap gap-1.5">
            {TAGS.map((t) => {
              const on = tags.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTags((prev) =>
                    on ? prev.filter((x) => x !== t.id) : [...prev, t.id])}
                  className={cn(
                    "rounded-[var(--radius-pill)] px-3 py-1.5 text-[13px] font-medium transition-colors",
                    on ? "bg-[var(--secondary)] text-[var(--secondary-contrast)]" : "glass text-[var(--ink-muted)]",
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </GlassSheet>
  );
}
