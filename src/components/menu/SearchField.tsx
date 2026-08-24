"use client";

import { Search, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function SearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="glass glass-edge flex h-12 items-center gap-2.5 rounded-[var(--radius-pill)] px-4">
      <Search className="size-[18px] shrink-0 text-[var(--ink-faint)]" />
      <input
        type="search"
        role="searchbox"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchPlaceholder")}
        // Turkish keyboards autocapitalise; the fold handles it either way.
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[var(--ink-faint)] [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t("searchClear")}
          className="grid size-7 shrink-0 place-items-center rounded-full text-[var(--ink-faint)] transition-colors hover:bg-[var(--hairline)] hover:text-[var(--ink)]"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
