"use client";

import { FlaskConical } from "lucide-react";
import { isMockMode } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Shown wherever an action would normally reach staff. A customer in the cafe
 * must not be told a waiter is coming when nothing left the browser.
 */
export function DemoNotice() {
  const { t } = useLanguage();
  if (!isMockMode) return null;

  return (
    <p className="glass flex items-start gap-2 rounded-[var(--radius-card)] px-3 py-2.5 text-xs leading-relaxed text-[var(--ink-muted)]">
      <FlaskConical className="mt-0.5 size-3.5 shrink-0 text-[var(--accent-ink)]" />
      <span>
        <strong className="font-semibold text-[var(--ink)]">{t("demoMode")}</strong>
        {" — "}
        {t("demoModeDesc")}
      </span>
    </p>
  );
}
