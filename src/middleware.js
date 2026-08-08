import { NextResponse } from "next/server";

const locales = ["tr", "en"];
const defaultLocale = "tr";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Exclude static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return;
  }

  // Check if the path starts with a valid locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Read locale cookie if exists
  const cookieLocale = request.cookies.get("mist-lang")?.value;
  const locale = locales.includes(cookieLocale) ? cookieLocale : defaultLocale;

  // Redirect if there is no locale
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next|api|favicon.ico|.*\\.).*)',
  ],
};
