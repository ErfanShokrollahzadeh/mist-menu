"use client";

import { useState } from "react";
import { GlassWater, Sparkles, HandHelping, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useUi } from "@/stores/ui";
import { useTable } from "@/stores/table";
import { getApi } from "@/lib/api";
import type { WaiterReason } from "@/lib/api/contracts";
import type { DictionaryKey } from "@/lib/i18n/types";
import { GlassSheet } from "@/components/glass/GlassSheet";
import { GlassButton } from "@/components/glass/GlassButton";
import { TableSelector } from "@/components/tray/TableSelector";
import { DemoNotice } from "@/components/system/DemoNotice";
import { cn } from "@/lib/cn";

const REASONS: { id: WaiterReason; icon: typeof GlassWater; label: DictionaryKey }[] = [
  { id: "water", icon: GlassWater, label: "waiterWater" },
  { id: "napkins", icon: Sparkles, label: "waiterNapkins" },
  { id: "assistance", icon: HandHelping, label: "waiterAssistance" },
  { id: "order", icon: ClipboardList, label: "waiterOrder" },
];

export function WaiterSheet() {
  const { t } = useLanguage();
  const { sheet, closeSheet } = useUi();
  const tableId = useTable((s) => s.tableId);
  const [reason, setReason] = useState<WaiterReason>("assistance");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!tableId) return;
    setSending(true);
    try {
      const call = await getApi().callWaiter({ tableId, reason });
      closeSheet();
      toast.success(t("waiterSent"), {
        description: call.simulated ? t("demoModeDesc") : undefined,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <GlassSheet
      open={sheet === "waiter"}
      onOpenChange={(v) => !v && closeSheet()}
      title={t("waiterTitle")}
      description={t("waiterDesc")}
      footer={
        <GlassButton
          variant="accent"
          size="lg"
          className="w-full"
          disabled={!tableId || sending}
          onClick={send}
        >
          {t("waiterSend")}
        </GlassButton>
      }
    >
      <div className="space-y-4 pb-4">
        <div className="grid grid-cols-2 gap-2.5">
          {REASONS.map(({ id, icon: Icon, label }) => {
            const active = reason === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setReason(id)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-[var(--radius-card)] px-3 py-5 transition-all duration-200",
                  active
                    ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_6px_20px_-6px_var(--accent)]"
                    : "glass text-[var(--ink-muted)] hover:text-[var(--ink)]",
                )}
              >
                <Icon className="size-6" strokeWidth={1.9} />
                <span className="text-[13px] font-semibold">{t(label)}</span>
              </button>
            );
          })}
        </div>

        {!tableId && <TableSelector />}
        <DemoNotice />
      </div>
    </GlassSheet>
  );
}
