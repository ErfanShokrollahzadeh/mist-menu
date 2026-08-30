"use client";

import { useState } from "react";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useCart, selectSubtotalMinor } from "@/stores/cart";
import { useTable } from "@/stores/table";
import { useUi } from "@/stores/ui";
import { formatPrice } from "@/lib/menu";
import { getApi } from "@/lib/api";
import { GlassSheet } from "@/components/glass/GlassSheet";
import { GlassButton } from "@/components/glass/GlassButton";
import { TableSelector } from "./TableSelector";
import { DemoNotice } from "@/components/system/DemoNotice";

export function TraySheet() {
  const { lang, t } = useLanguage();
  const { sheet, closeSheet } = useUi();
  const { lines, setQuantity, remove, clear } = useCart();
  const subtotal = useCart(selectSubtotalMinor);
  const tableId = useTable((s) => s.tableId);
  const [submitting, setSubmitting] = useState(false);

  const open = sheet === "tray";

  const placeOrder = async () => {
    if (!tableId || !lines.length) return;
    setSubmitting(true);
    try {
      const order = await getApi().placeOrder({
        tableId,
        locale: lang,
        clientRequestId: crypto.randomUUID(),
        lines: lines.map((l) => ({
          categorySlug: l.categorySlug,
          itemSlug: l.itemSlug,
          quantity: l.quantity,
          selections: l.selections,
          note: l.note,
        })),
      });
      clear();
      closeSheet();
      toast.success(t("orderPlaced"), {
        description: order.simulated ? t("demoModeDesc") : `#${order.orderNumber}`,
      });
    } catch {
      toast.error(t("noResults"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GlassSheet
      open={open}
      onOpenChange={(v) => !v && closeSheet()}
      title={t("trayTitle")}
      footer={
        lines.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-[var(--ink-muted)]">{t("total")}</span>
              <span className="text-xl font-bold tabular-nums">{formatPrice(subtotal, lang)}</span>
            </div>
            {!tableId && (
              <p className="text-center text-xs font-medium text-[var(--accent-ink)]">
                {t("tableRequired")}
              </p>
            )}
            <GlassButton
              variant="accent"
              size="lg"
              className="w-full"
              disabled={!tableId || submitting}
              onClick={placeOrder}
            >
              {t("placeOrder")}
            </GlassButton>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-4 pb-4">
        {lines.length === 0 ? (
          <div className="py-12 text-center">
            <ShoppingBag className="mx-auto mb-3 size-9 text-[var(--ink-faint)]" strokeWidth={1.6} />
            <h3 className="text-base font-bold">{t("trayEmpty")}</h3>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">{t("trayEmptyDesc")}</p>
          </div>
        ) : (
          <>
            <ul className="space-y-2.5">
              {lines.map((line) => (
                <li key={line.id} className="glass flex gap-3 rounded-[var(--radius-card)] p-2.5">
                  {line.image && (
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl">
                      <Image src={line.image} alt="" fill sizes="64px" className="object-cover" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug font-semibold">{line.name[lang]}</p>
                    {line.selectionLabels.length > 0 && (
                      <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                        {line.selectionLabels.map((s) => s[lang]).join(" · ")}
                      </p>
                    )}
                    {line.note && (
                      <p className="mt-0.5 text-xs italic text-[var(--ink-faint)]">{line.note}</p>
                    )}
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-sm font-bold tabular-nums">
                        {formatPrice((line.unitPriceMinor + line.modifierDeltaMinor) * line.quantity, lang)}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => setQuantity(line.id, line.quantity - 1)}
                          aria-label={t("decrease")}
                          className="grid size-7 place-items-center rounded-full transition-colors hover:bg-[var(--hairline)]"
                        >
                          {line.quantity === 1 ? <Trash2 className="size-3.5" /> : <Minus className="size-3.5" />}
                        </button>
                        <span className="w-6 text-center text-sm font-bold tabular-nums">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(line.id, line.quantity + 1)}
                          aria-label={t("increase")}
                          className="grid size-7 place-items-center rounded-full transition-colors hover:bg-[var(--hairline)]"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={clear}
              className="mx-auto block text-xs font-medium text-[var(--ink-faint)] underline-offset-2 hover:underline"
            >
              {t("clearTray")}
            </button>

            {!tableId && <TableSelector />}
            <DemoNotice />
          </>
        )}
      </div>
    </GlassSheet>
  );
}
