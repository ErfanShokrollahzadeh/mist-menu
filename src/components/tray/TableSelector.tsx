"use client";

import { cafe } from "@/config/cafe";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useTable } from "@/stores/table";
import { cn } from "@/lib/cn";

export function TableSelector() {
  const { lang, t } = useLanguage();
  const { tableId, setTable } = useTable();

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">{t("selectTable")}</p>
      {cafe.zones.map((zone) => (
        <div key={zone.slug} className="space-y-1.5">
          <p className="text-[11px] font-bold tracking-wider text-[var(--ink-faint)] uppercase">
            {zone.name[lang]}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {zone.tables.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTable(n)}
                aria-pressed={tableId === n}
                className={cn(
                  "size-10 rounded-xl text-sm font-semibold tabular-nums transition-all duration-200",
                  tableId === n
                    ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_4px_14px_-4px_var(--accent)]"
                    : "glass text-[var(--ink-muted)] hover:text-[var(--ink)]",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
