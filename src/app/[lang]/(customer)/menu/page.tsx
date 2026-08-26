import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { MenuBrowser } from "./MenuBrowser";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const d = await getDictionary(lang);
  return { title: d.menu };
}

export default function MenuPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-32 sm:px-6">
      <MenuBrowser />
    </main>
  );
}
