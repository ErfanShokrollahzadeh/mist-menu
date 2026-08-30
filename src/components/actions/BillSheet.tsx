"use client";

import { useEffect, useState } from "react";
import { Banknote, CreditCard, Users } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useUi } from "@/stores/ui";
import { useTable } from "@/stores/table";
import { getApi } from "@/lib/api";
import type { PaymentMethod, Order } from "@/lib/api/contracts";
import type { DictionaryKey } from "@/lib/i18n/types";
import { formatPrice } from "@/lib/menu";
import { GlassSheet } from "@/components/glass/GlassSheet";
import { GlassButton } from "@/components/glass/GlassButton";
import { TableSelector } from "@/components/tray/TableSelector";
import { DemoNotice } from "@/components/system/DemoNotice";
import { cn } from "@/lib/cn";

const METHODS: { id: PaymentMethod; icon: typeof Banknote; label: DictionaryKey }[] = [
  { id: "cash", icon: Banknote, label: "cash" },
  { id: "card", icon: CreditCard, label: "creditCard" },
  { id: "split", icon: Users, label: "splitBill" },
];

export function BillSheet() {
  const { lang, t } = useLanguage();
  const { sheet, closeSheet } = useUi();
  const tableId = useTable((s) => s.tableId);
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [people, setPeople] = useState(2);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sending, setSending] = useState(false);

  const open = sheet === "bill";

  useEffect(() => {
    if (!open || !tableId) return;
    let alive = true;
    getApi()
      .activeOrders(tableId)
      .then((o) => alive && setOrders(o))
      .catch(() => alive && setOrders([]));
    return () => {
      alive = false;
    };
  }, [open, tableId]);

  const totalMinor = orders.reduce((n, o) => n + o.totalMinor, 0);
  // Integer kurus throughout, so the split never drifts by a rounding cent.
  const perPersonMinor = people > 0 ? Math.ceil(totalMinor / people) : totalMinor;

  const request = async () => {
    if (!tableId) return;
    setSending(true);
    try {
      const bill = await getApi().requestBill({
        tableId,
        method,
        splitWays: method === "split" ? people : undefined,
      });
      closeSheet();
      toast.success(t("billRequested"), {
        description: bill.simulated ? t("demoModeDesc") : undefined,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <GlassSheet
      open={open}
      onOpenChange={(v) => !v && closeSheet()}
      title={t("billTitle")}
      description={t("billDesc")}
      footer={
        <GlassButton
          variant="accent"
          size="lg"
          className="w-full"
          disabled={!tableId || sending}
          onClick={request}
        >
          {t("requestBill")}
        </GlassButton>
      }
    >
      <div className="space-y-5 pb-4">
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">{t("yourOrders")}</h3>
          {orders.length === 0 ? (
            <p className="text-sm text-[var(--ink-muted)]">{t("noOrdersYet")}</p>
          ) : (
            <ul className="glass divide-y divide-[var(--hairline)] rounded-[var(--radius-card)] px-3">
              {orders.flatMap((o) =>
                o.lines.map((l, i) => (
                  <li key={`${o.id}-${i}`} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0 flex-1 truncate">
                      <span className="mr-1.5 font-bold tabular-nums text-[var(--ink-faint)]">
                        {l.quantity}×
                      </span>
                      {l.name[lang]}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">
                      {formatPrice(l.lineTotalMinor, lang)}
                    </span>
                  </li>
                )),
              )}
              <li className="flex items-center justify-between py-3 text-base font-bold">
                <span>{t("total")}</span>
                <span className="tabular-nums">{formatPrice(totalMinor, lang)}</span>
              </li>
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">{t("paymentMethod")}</h3>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map(({ id, icon: Icon, label }) => {
              const active = method === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMethod(id)}
                  aria-pressed={active}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-[var(--radius-card)] px-2 py-4 transition-all duration-200",
                    active
                      ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_6px_20px_-6px_var(--accent)]"
                      : "glass text-[var(--ink-muted)] hover:text-[var(--ink)]",
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.9} />
                  <span className="text-xs font-semibold">{t(label)}</span>
                </button>
              );
            })}
          </div>
        </section>

        {method === "split" && (
          <section className="glass space-y-3 rounded-[var(--radius-card)] p-4">
            <div className="flex items-center justify-between">
              <label htmlFor="split-people" className="text-sm font-semibold">
                {t("numberOfPeople")}
              </label>
              <span className="text-lg font-bold tabular-nums">{people}</span>
            </div>
            <input
              id="split-people"
              type="range"
              min={2}
              max={12}
              value={people}
              onChange={(e) => setPeople(Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
            <div className="flex items-baseline justify-between border-t border-[var(--hairline)] pt-3">
              <span className="text-sm text-[var(--ink-muted)]">{t("perPerson")}</span>
              <span className="text-xl font-bold tabular-nums text-[var(--accent-ink)]">
                {formatPrice(perPersonMinor, lang)}
              </span>
            </div>
          </section>
        )}

        {!tableId && <TableSelector />}
        <DemoNotice />
      </div>
    </GlassSheet>
  );
}
