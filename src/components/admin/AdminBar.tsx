"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ChefHat, LogOut } from "lucide-react";
import { useAuth } from "@/stores/auth";
import { adminApi } from "@/lib/admin/client";
import { GlassButton } from "@/components/glass/GlassButton";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/cn";

export function AdminBar() {
  const { lang } = useLanguage();
  const { tokens, setTokens, isAdmin } = useAuth();
  const pathname = usePathname();

  const links = [
    { href: `/${lang}/admin`, label: "Panel", icon: LayoutDashboard, adminOnly: true },
    { href: `/${lang}/admin/kds`, label: "Mutfak", icon: ChefHat, adminOnly: false },
  ].filter((l) => !l.adminOnly || isAdmin());

  const signOut = async () => {
    if (tokens?.refreshToken) await adminApi.logout(tokens.refreshToken).catch(() => {});
    setTokens(null);
  };

  return (
    <header className="glass glass-edge sticky top-0 z-40 flex h-14 items-center gap-2 rounded-none px-3 sm:px-5">
      <span className="mr-2 text-[13px] font-bold tracking-[0.12em] uppercase">MiST Ops</span>

      <nav className="flex items-center gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <span className="hidden text-xs font-medium text-[var(--ink-muted)] sm:block">
        {tokens?.displayName} · {tokens?.role}
      </span>
      <GlassButton variant="ghost" size="icon" onClick={signOut} aria-label="Çıkış">
        <LogOut className="size-4" />
      </GlassButton>
    </header>
  );
}
