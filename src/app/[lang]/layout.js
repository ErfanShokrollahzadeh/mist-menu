import { Inter, Playfair_Display } from "next/font/google";
import "../globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { getDictionary } from "@/dictionaries";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata = {
  title: "Mist Café",
  description:
    "Mist Café'nin modern dijital menüsü. Kahvaltı, ana yemekler, tatlılar, kahveler ve daha fazlası.",
};

export default async function RootLayout({ children, params }) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <html lang={lang} data-scroll-behavior="smooth">
      <body className={inter.className} suppressHydrationWarning={true}>
        <LanguageProvider lang={lang} dictionary={dictionary}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
