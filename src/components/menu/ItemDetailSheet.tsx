"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Minus, Plus, Info } from "lucide-react";
import { toast } from "sonner";
import type { MenuItem } from "@/types/menu";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatPrice, lineTotalMinor } from "@/lib/menu";
import { useCart } from "@/stores/cart";
import { menu } from "@/lib/menu";
import { GlassSheet } from "@/components/glass/GlassSheet";
import { GlassButton } from "@/components/glass/GlassButton";
import { DietaryBadges } from "./DietaryBadges";
import { cn } from "@/lib/cn";

/** Every required single-select group starts on its default option. */
function defaultSelections(item: MenuItem | null): Record<string, string[]> {
  if (!item) return {};
  return Object.fromEntries(
    item.modifierGroups.map((g) => {
      const def = g.options.find((o) => o.isDefault) ?? g.options[0];
      return [g.slug, g.isRequired && def ? [def.slug] : []];
    }),
  );
}

export function ItemDetailSheet({
  item,
  onClose,
}: {
  item: MenuItem | null;
  onClose: () => void;
}) {
  const { lang, t } = useLanguage();
  const add = useCart((s) => s.add);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (item) {
      setSelections(defaultSelections(item));
      setQuantity(1);
      setNote("");
    }
  }, [item]);

  const deltaMinor = useMemo(() => {
    if (!item) return 0;
    let d = 0;
    for (const g of item.modifierGroups)
      for (const slug of selections[g.slug] ?? [])
        d += g.options.find((o) => o.slug === slug)?.priceDeltaMinor ?? 0;
    return d;
  }, [item, selections]);

  if (!item) return null;

  const missingRequired = item.modifierGroups.some(
    (g) => g.isRequired && (selections[g.slug]?.length ?? 0) < g.minSelect,
  );

  const total = lineTotalMinor(item.priceMinor, [deltaMinor], quantity);

  const choose = (groupSlug: string, optionSlug: string, single: boolean) =>
    setSelections((prev) => {
      const current = prev[groupSlug] ?? [];
      if (single) return { ...prev, [groupSlug]: [optionSlug] };
      return {
        ...prev,
        [groupSlug]: current.includes(optionSlug)
          ? current.filter((s) => s !== optionSlug)
          : [...current, optionSlug],
      };
    });

  const submit = () => {
    add(item, selections, quantity, note.trim() || undefined);
    toast.success(t("addedToTray", { name: item.name[lang] }));
    onClose();
  };

  return (
    <GlassSheet
      open={Boolean(item)}
      onOpenChange={(open) => !open && onClose()}
      title={item.name[lang]}
      description={item.description[lang] || undefined}
      footer={
        <GlassButton
          variant="accent"
          size="lg"
          className="w-full justify-between"
          disabled={missingRequired}
          onClick={submit}
        >
          <span>{t("addToTray")}</span>
          <span className="tabular-nums">{formatPrice(total, lang)}</span>
        </GlassButton>
      }
    >
      <div className="space-y-5 pb-4">
        {item.image.src && (
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-card)]">
            <Image
              src={item.image.src}
              alt={item.image.alt[lang]}
              fill
              sizes="(max-width: 640px) 100vw, 512px"
              className="object-cover"
            />
          </div>
        )}

        <DietaryBadges tags={item.tags} t={t} />

        {item.modifierGroups.map((group) => {
          const single = group.selection === "single";
          const chosen = selections[group.slug] ?? [];
          return (
            <fieldset key={group.slug} className="space-y-2">
              <legend className="flex w-full items-baseline justify-between pb-1">
                <span className="text-sm font-semibold">{group.name[lang]}</span>
                {group.isRequired && (
                  <span className="text-[10px] font-bold tracking-wider text-[var(--accent-ink)] uppercase">
                    {t("required")}
                  </span>
                )}
              </legend>
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt) => {
                  const active = chosen.includes(opt.slug);
                  return (
                    <button
                      key={opt.slug}
                      type="button"
                      onClick={() => choose(group.slug, opt.slug, single)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-[var(--radius-pill)] px-3.5 py-2 text-[13px] font-medium transition-all duration-200",
                        active
                          ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_4px_14px_-4px_var(--accent)]"
                          : "glass text-[var(--ink-muted)] hover:text-[var(--ink)]",
                      )}
                    >
                      {opt.name[lang]}
                      {opt.priceDeltaMinor !== 0 && (
                        <span className="ml-1.5 tabular-nums opacity-80">
                          {opt.priceDeltaMinor > 0 ? "+" : ""}
                          {formatPrice(opt.priceDeltaMinor, lang)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}

        <div className="space-y-2">
          <label htmlFor="item-note" className="text-sm font-semibold">
            {t("itemNote")}
          </label>
          <textarea
            id="item-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("itemNotePlaceholder")}
            rows={2}
            maxLength={200}
            className="glass w-full resize-none rounded-[var(--radius-card)] px-3.5 py-2.5 text-sm outline-none placeholder:text-[var(--ink-faint)]"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{t("quantity")}</span>
          <div className="glass flex items-center gap-1 rounded-[var(--radius-pill)] p-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label={t("decrease")}
              className="grid size-9 place-items-center rounded-full transition-colors hover:bg-[var(--hairline)] disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center text-base font-bold tabular-nums">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              aria-label={t("increase")}
              className="grid size-9 place-items-center rounded-full transition-colors hover:bg-[var(--hairline)]"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        {/* The dataset carries no allergen information; say so rather than imply none. */}
        {!menu.allergenDataAvailable && (
          <p className="flex items-start gap-2 text-xs leading-relaxed text-[var(--ink-faint)]">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            {t("allergenNotice")}
          </p>
        )}
      </div>
    </GlassSheet>
  );
}
