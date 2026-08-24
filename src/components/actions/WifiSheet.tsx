"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, Wifi } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useUi } from "@/stores/ui";
import { cafe, wifiQrPayload } from "@/config/cafe";
import { GlassSheet } from "@/components/glass/GlassSheet";
import { cn } from "@/lib/cn";

function CopyRow({ label, value }: { label: string; value: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the value is on screen to type by hand */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="glass flex w-full items-center gap-3 rounded-[var(--radius-card)] px-4 py-3 text-left transition-colors hover:bg-[var(--glass-bg-strong)]"
      aria-label={`${t("copy")} ${label}`}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold tracking-wider text-[var(--ink-faint)] uppercase">
          {label}
        </span>
        <span className="block truncate font-mono text-[15px] font-semibold">{value}</span>
      </span>
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full transition-colors",
          copied ? "bg-emerald-500/15 text-emerald-500" : "text-[var(--ink-faint)]",
        )}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </span>
    </button>
  );
}

export function WifiSheet() {
  const { t } = useLanguage();
  const { sheet, closeSheet } = useUi();
  const [qr, setQr] = useState<string | null>(null);
  const open = sheet === "wifi";

  useEffect(() => {
    if (!open || qr) return;
    QRCode.toString(wifiQrPayload(), {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setQr)
      .catch(() => setQr(null));
  }, [open, qr]);

  return (
    <GlassSheet
      open={open}
      onOpenChange={(v) => !v && closeSheet()}
      title={t("wifiTitle")}
      description={t("wifiDesc")}
    >
      <div className="space-y-4 pb-6">
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-[var(--radius-card)] bg-white p-3 shadow-[var(--glass-shadow)]">
            {qr ? (
              <div
                className="size-44 [&>svg]:size-full"
                // Generated locally from cafe config; no external input.
                dangerouslySetInnerHTML={{ __html: qr }}
              />
            ) : (
              <div className="grid size-44 place-items-center text-black/30">
                <Wifi className="size-10" />
              </div>
            )}
          </div>
          <p className="text-xs font-medium text-[var(--ink-faint)]">{t("wifiScan")}</p>
        </div>

        <div className="space-y-2">
          <CopyRow label={t("wifiSSID")} value={cafe.wifi.ssid} />
          <CopyRow label={t("wifiPass")} value={cafe.wifi.password} />
        </div>
      </div>
    </GlassSheet>
  );
}
