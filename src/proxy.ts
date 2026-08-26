import { NextResponse, type NextRequest } from "next/server";

export const LOCALES = ["tr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "tr";
export const LOCALE_COOKIE = "mist-lang";

const isLocale = (value: string | undefined): value is Locale =>
  LOCALES.includes(value as Locale);

/**
 * Next 16 renamed the `middleware` convention to `proxy`.
 * Prefixes every un-prefixed path with a locale, preferring the visitor's
 * saved choice over the Turkish default.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return NextResponse.next();

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(saved) ? saved : DEFAULT_LOCALE;

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|manifest.webmanifest|sw.js|.*\\.).*)"],
};
