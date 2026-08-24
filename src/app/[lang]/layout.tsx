import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "../globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { getDictionary } from "@/lib/i18n";
import { ThemeProvider, THEME_BOOTSTRAP } from "@/components/system/ThemeProvider";
import { AmbientBackdrop } from "@/components/layout/AmbientBackdrop";
import { AppShell } from "@/components/layout/AppShell";
import { LOCALES, type Locale } from "@/proxy";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"], // latin-ext carries ğ ı ş İ
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "MiST Café & Lounge", template: "%s · MiST Café" },
  description:
    "MiST Café & Lounge, Eskişehir — kahvaltı, ana yemekler, tatlılar, kahveler ve nargile. Masanızdan sipariş verin.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "MiST Café" },
  icons: {
    icon: [{ url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#080c15" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = (LOCALES.includes(lang as Locale) ? lang : "tr") as Locale;
  const dictionary = await getDictionary(locale);

  return (
    <html lang={locale} className={jakarta.variable} suppressHydrationWarning>
      <head>
        {/* Runs before first paint so dark-mode visitors never see a white flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="min-h-dvh antialiased">
        <ThemeProvider>
          <LanguageProvider lang={locale} dictionary={dictionary}>
            <AmbientBackdrop />
            <AppShell>{children}</AppShell>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
