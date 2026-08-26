"use client";

import { Phone, MapPin, Clock } from "lucide-react";
import { InstagramIcon, WhatsAppIcon } from "@/components/system/BrandIcons";
import { motion } from "motion/react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cafe } from "@/config/cafe";
import { GlassSurface } from "@/components/glass/GlassSurface";
import { cascade, cascadeItem } from "@/lib/motion";

export default function ContactPage() {
  const { t } = useLanguage();
  const mapsSrc = `https://maps.google.com/maps?q=${encodeURIComponent(cafe.contact.mapsQuery)}&output=embed`;

  const rows = [
    { icon: Phone, label: t("callUs"), value: cafe.contact.phoneDisplay, href: `tel:${cafe.contact.phone}` },
    { icon: MapPin, label: t("address"), value: cafe.contact.address, href: `https://maps.google.com/?q=${encodeURIComponent(cafe.contact.mapsQuery)}` },
    { icon: Clock, label: t("openingHours"), value: `${cafe.hours.open} – ${cafe.hours.close} · ${cafe.hours.note}` },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 px-4 pt-6 pb-32 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("contact")}</h1>

      <motion.ul variants={cascade} initial="hidden" animate="show" className="space-y-2.5">
        {rows.map(({ icon: Icon, label, value, href }) => {
          const body = (
            <>
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)]">
                <Icon className="size-5" strokeWidth={1.9} />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-bold tracking-wider text-[var(--ink-faint)] uppercase">
                  {label}
                </span>
                <span className="block text-[15px] font-medium">{value}</span>
              </span>
            </>
          );
          return (
            <motion.li key={label} variants={cascadeItem}>
              <GlassSurface>
                {href ? (
                  <a
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-3.5 p-4 transition-transform duration-200 active:scale-[0.99]"
                  >
                    {body}
                  </a>
                ) : (
                  <div className="flex items-center gap-3.5 p-4">{body}</div>
                )}
              </GlassSurface>
            </motion.li>
          );
        })}
      </motion.ul>

      <GlassSurface className="overflow-hidden p-0">
        <iframe
          src={mapsSrc}
          title={t("location")}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-72 w-full border-0"
        />
      </GlassSurface>

      <div className="flex justify-center gap-3">
        <a
          href={cafe.social.instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="glass grid size-12 place-items-center rounded-full text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
        >
          <InstagramIcon className="size-5" />
        </a>
        <a
          href={cafe.social.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="glass grid size-12 place-items-center rounded-full text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
        >
          <WhatsAppIcon className="size-5" />
        </a>
      </div>
    </main>
  );
}
