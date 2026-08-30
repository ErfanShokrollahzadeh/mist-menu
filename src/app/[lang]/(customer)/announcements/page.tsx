"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { CalendarDays } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { GlassSurface } from "@/components/glass/GlassSurface";
import { cascade, cascadeItem } from "@/lib/motion";

/**
 * Sourced from the cafe's own promotional artwork, catalogued in
 * data/photo-manifest.json with role "announcement".
 */
const POSTS = [
  {
    id: "coffee-festival",
    image: "/menu-images/promo-coffee-festival.jpg",
    title: { tr: "Eskişehir Kahve Festivali", en: "Eskişehir Coffee Festival" },
    body: {
      tr: "5-6-7 Haziran'da festival alanındayız. Standımıza uğrayın, imza kahvelerimizi tadın.",
      en: "Find us at the festival on 5-7 June. Stop by our stand and taste our signature coffees.",
    },
    date: { tr: "5–7 Haziran", en: "5–7 June" },
  },
  {
    id: "filter-coffee",
    image: "/menu-images/promo-filter-coffee-dessert.jpg",
    title: { tr: "Tatlının Yanına Filtre Kahve", en: "Filter Coffee With Every Dessert" },
    body: {
      tr: "Tatlı siparişlerinizin yanında filtre kahve ikramımızdır.",
      en: "Order any dessert and the filter coffee is on us.",
    },
    date: { tr: "Süresiz", en: "Ongoing" },
  },
] as const;

export default function AnnouncementsPage() {
  const { lang, t } = useLanguage();

  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 px-4 pt-6 pb-32 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("announcements")}</h1>

      <motion.ul variants={cascade} initial="hidden" animate="show" className="space-y-4">
        {POSTS.map((post) => (
          <motion.li key={post.id} variants={cascadeItem}>
            <GlassSurface className="overflow-hidden p-0">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={post.image}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 720px"
                  className="object-cover"
                />
              </div>
              <div className="space-y-1.5 p-4">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[var(--accent-ink)] uppercase">
                  <CalendarDays className="size-3.5" />
                  {post.date[lang]}
                </span>
                <h2 className="text-lg font-bold tracking-tight">{post.title[lang]}</h2>
                <p className="text-sm leading-relaxed text-[var(--ink-muted)]">{post.body[lang]}</p>
              </div>
            </GlassSurface>
          </motion.li>
        ))}
      </motion.ul>
    </main>
  );
}
