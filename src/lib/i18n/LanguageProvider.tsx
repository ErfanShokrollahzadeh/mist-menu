"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Dictionary, DictionaryKey, TVars } from "./types";
import type { Locale } from "@/proxy";

type Translate = (key: DictionaryKey, vars?: TVars) => string;

type Ctx = { lang: Locale; t: Translate; dictionary: Dictionary };
const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({
  children,
  lang,
  dictionary,
}: {
  children: ReactNode;
  lang: Locale;
  dictionary: Dictionary;
}) {
  const value = useMemo<Ctx>(() => {
    /**
     * Resolves a key and fills `{placeholders}`. The previous build lacked
     * interpolation, so strings like `itemsCount` ("{count} ürün") existed in
     * both dictionaries but were hardcoded in Turkish at the call site and
     * leaked into the English UI.
     */
    const t: Translate = (key, vars) => {
      const raw = dictionary[key];
      if (typeof raw !== "string") return String(key);
      if (!vars) return raw;
      return raw.replace(/\{(\w+)\}/g, (match, name: string) =>
        name in vars ? String(vars[name]) : match,
      );
    };
    return { lang, t, dictionary };
  }, [lang, dictionary]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}
