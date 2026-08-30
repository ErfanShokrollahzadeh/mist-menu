"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useUi } from "@/stores/ui";
import { useTable } from "@/stores/table";
import { getApi } from "@/lib/api";
import type { DictionaryKey } from "@/lib/i18n/types";
import { GlassSheet } from "@/components/glass/GlassSheet";
import { GlassButton } from "@/components/glass/GlassButton";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/cn";

const MOODS = ["😞", "😕", "🙂", "😃", "🤩"];
const COMPLIMENTS: { id: string; label: DictionaryKey }[] = [
  { id: "food", label: "complimentFood" },
  { id: "service", label: "complimentService" },
  { id: "ambience", label: "complimentAmbience" },
  { id: "speed", label: "complimentSpeed" },
  { id: "value", label: "complimentValue" },
];

export function FeedbackSheet() {
  const { lang, t } = useLanguage();
  const { sheet, closeSheet } = useUi();
  const tableId = useTable((s) => s.tableId);
  const [rating, setRating] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const toggle = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const submit = async () => {
    if (rating === 0) return;
    setSending(true);
    try {
      await getApi().sendFeedback({
        tableId: tableId ?? undefined,
        rating,
        compliments: picked,
        comment: comment.trim() || undefined,
        locale: lang,
      });
      closeSheet();
      setRating(0);
      setPicked([]);
      setComment("");
      toast.success(t("feedbackThanks"));
    } finally {
      setSending(false);
    }
  };

  return (
    <GlassSheet
      open={sheet === "feedback"}
      onOpenChange={(v) => !v && closeSheet()}
      title={t("feedbackTitle")}
      description={t("feedbackDesc")}
      footer={
        <GlassButton
          variant="accent"
          size="lg"
          className="w-full"
          disabled={rating === 0 || sending}
          onClick={submit}
        >
          {t("feedbackSubmit")}
        </GlassButton>
      }
    >
      <div className="space-y-5 pb-4">
        <div className="flex justify-center gap-2">
          {MOODS.map((mood, i) => {
            const value = i + 1;
            const active = rating === value;
            return (
              <motion.button
                key={mood}
                type="button"
                onClick={() => setRating(value)}
                animate={{ scale: active ? 1.18 : 1, opacity: active || rating === 0 ? 1 : 0.4 }}
                transition={spring.snappy}
                whileTap={{ scale: 0.9 }}
                aria-label={`${t("feedbackRating")} ${value}`}
                aria-pressed={active}
                className="grid size-14 place-items-center rounded-full text-3xl"
              >
                {mood}
              </motion.button>
            );
          })}
        </div>

        <div className="flex justify-center gap-1" role="group" aria-label={t("feedbackRating")}>
          {[1, 2, 3, 4, 5].map((v) => (
            <button key={v} type="button" onClick={() => setRating(v)} aria-label={`${v}`}>
              <Star
                className={cn(
                  "size-6 transition-colors",
                  v <= rating ? "fill-[var(--accent-ink)] text-[var(--accent-ink)]" : "text-[var(--ink-faint)]",
                )}
              />
            </button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {COMPLIMENTS.map(({ id, label }) => {
            const active = picked.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                aria-pressed={active}
                className={cn(
                  "rounded-[var(--radius-pill)] px-3.5 py-2 text-[13px] font-medium transition-all duration-200",
                  active
                    ? "bg-[var(--secondary)] text-[var(--secondary-contrast)]"
                    : "glass text-[var(--ink-muted)] hover:text-[var(--ink)]",
                )}
              >
                {t(label)}
              </button>
            );
          })}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("feedbackComment")}
          rows={3}
          maxLength={500}
          aria-label={t("feedbackComment")}
          className="glass w-full resize-none rounded-[var(--radius-card)] px-3.5 py-3 text-sm outline-none placeholder:text-[var(--ink-faint)]"
        />
      </div>
    </GlassSheet>
  );
}
