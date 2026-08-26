"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { GlassButton } from "@/components/glass/GlassButton";
import type { DictionaryKey } from "@/lib/i18n/types";

const SLIDE_MS = 5600;

const SLIDES: { src: string; title: DictionaryKey; subtitle: DictionaryKey }[] = [
  { src: "/menu-images/breakfast-table-full.jpg", title: "slide1Title", subtitle: "slide1Subtitle" },
  { src: "/menu-images/cocktail-blue-lagoon.jpg", title: "slide2Title", subtitle: "slide2Subtitle" },
  { src: "/menu-images/coffee-lavazza-machine.jpg", title: "slide3Title", subtitle: "slide3Subtitle" },
];

export function HeroCarousel() {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const advance = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), []);

  useEffect(() => {
    if (paused || reduced) return;
    const timer = window.setInterval(advance, SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [advance, paused, reduced]);

  const slide = SLIDES[index]!;

  return (
    <section
      className="relative h-[clamp(24rem,68dvh,34rem)] w-full overflow-hidden rounded-[var(--radius-sheet)]"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 0.7 }, scale: { duration: SLIDE_MS / 1000 + 1, ease: "linear" } }}
          className="absolute inset-0"
        >
          <Image
            src={slide.src}
            alt=""
            fill
            sizes="100vw"
            priority={index === 0}
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/35" />

      <div className="relative flex h-full flex-col justify-end gap-4 p-6 sm:p-9">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="max-w-lg space-y-1.5"
          >
            <h1 className="text-gradient-gold text-4xl font-extrabold tracking-tight sm:text-5xl">
              {t(slide.title)}
            </h1>
            <p className="text-base text-white/85 sm:text-lg">{t(slide.subtitle)}</p>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-4">
          <GlassButton
            variant="accent"
            size="lg"
            className="gap-2"
            onClick={() => router.push(`/${lang}/menu`)}
          >
            {t("heroBrowse")}
            <ArrowRight className="size-[18px]" />
          </GlassButton>

          <div className="flex flex-1 items-center gap-1.5" role="tablist" aria-label="Slides">
            {SLIDES.map((s, i) => (
              <button
                key={s.src}
                role="tab"
                aria-selected={i === index}
                aria-label={t(s.title)}
                onClick={() => setIndex(i)}
                className="group h-1.5 flex-1 overflow-hidden rounded-full bg-white/25"
              >
                <motion.span
                  className="block h-full rounded-full bg-white"
                  initial={false}
                  animate={{ width: i < index ? "100%" : i === index ? "100%" : "0%" }}
                  transition={
                    i === index && !paused && !reduced
                      ? { duration: SLIDE_MS / 1000, ease: "linear" }
                      : { duration: 0.25 }
                  }
                  style={i === index ? undefined : { width: i < index ? "100%" : "0%" }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
