import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata = {
  title: "Mist Café — Menü",
  description:
    "Mist Café'nin modern dijital menüsü. Kahvaltı, ana yemekler, tatlılar, kahveler ve daha fazlası.",
};

import { LanguageProvider } from "@/context/LanguageContext";

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className={inter.className} suppressHydrationWarning={true}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
