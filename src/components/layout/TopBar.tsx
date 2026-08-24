"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Languages, Moon, Sun, MonitorSmartphone } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useTheme } from "@/components/system/ThemeProvider";
import { useTable } from "@/stores/table";
import { GlassButton } from "@/components/glass/GlassButton";
import { LOCALE_COOKIE } from "@/proxy";
import { cn } from "@/lib/cn";

const THEME_CYCLE = { system: "light", light: "dark", dark: "system" } as const;
const THEME_ICON = { light: Sun, dark: Moon, system: MonitorSmartphone };

/**
 * Single top bar for every route. The previous build carried two ~150-line
 * navbars that were 90% identical.
 */
export function TopBar() {
  const { lang, t } = useLanguage();
  const { choice, setChoice } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const tableId = useTable((s) => s.tableId);

  const other = lang === "tr" ? "en" : "tr";
  const ThemeIcon = THEME_ICON[choice];

  const switchLocale = () => {
    document.cookie = `${LOCALE_COOKIE}=${other};path=/;max-age=31536000;samesite=lax`;
    router.push(pathname.replace(new RegExp(`^/${lang}`), `/${other}`));
  };

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="glass glass-edge sticky top-0 z-40 mx-auto flex h-16 w-full items-center gap-3 rounded-none px-4 sm:px-6"
    >
      <Link href={`/${lang}`} className="flex items-center gap-2.5" aria-label={t("home")}>
        <Image
          src="/menu-images/brand-logo.jpg"
          alt=""
          width={36}
          height={36}
          className="rounded-full ring-1 ring-[var(--glass-border)]"
          priority
        />
        <span className="hidden text-[0.8125rem] font-semibold tracking-[0.14em] uppercase sm:block">
          {t("brand")}
        </span>
      </Link>

      <div className="flex-1" />

      {tableId && (
        <span className="glass rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold tabular-nums">
          {t("tableDetected", { table: tableId })}
        </span>
      )}

      <GlassButton
        variant="ghost"
        size="icon"
        onClick={() => setChoice(THEME_CYCLE[choice])}
        aria-label={`${t("theme")}: ${t(`theme${choice[0]!.toUpperCase()}${choice.slice(1)}` as "themeLight")}`}
      >
        <ThemeIcon className="size-[18px]" />
      </GlassButton>

      <GlassButton
        variant="ghost"
        size="sm"
        onClick={switchLocale}
        aria-label={`${t("language")}: ${other.toUpperCase()}`}
        className="gap-1.5"
      >
        <Languages className="size-4" />
        <span className={cn("text-xs font-bold tracking-wider")}>{other.toUpperCase()}</span>
      </GlassButton>
    </motion.header>
  );
}
