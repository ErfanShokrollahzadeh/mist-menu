/**
 * Business facts that were previously hardcoded across half a dozen JSX files.
 * Shaped to match the CafeSetting entity so the pass-2 admin can drive it from
 * the database without the components changing.
 */
export const cafe = {
  name: "MiST Café & Lounge",
  shortName: "MiST Café",

  wifi: {
    ssid: "MIST_CAFE_WIFI",
    password: "mistcafe2024",
    /** WPA is the near-universal case; matters for the join-QR payload. */
    encryption: "WPA" as const,
    hidden: false,
  },

  contact: {
    phone: "+905323407464",
    phoneDisplay: "0532 340 74 64",
    address: "Yenibağlar, Yılmaz Büyükerşen Blv. No:63, Tepebaşı / Eskişehir",
    mapsQuery: "MiST Cafe Lounge Yılmaz Büyükerşen Bulvarı 63 Tepebaşı Eskişehir",
  },

  hours: { open: "10:00", close: "06:00", note: "Her gün / Daily" },

  social: {
    instagram: "https://www.instagram.com/mistcafelounge",
    whatsapp: "https://wa.me/905323407464",
  },

  /** Tables the customer can pick from when there is no ?table= in the URL. */
  zones: [
    { slug: "indoor", name: { tr: "İç Mekân", en: "Indoor" }, tables: range(1, 14) },
    { slug: "terrace", name: { tr: "Teras", en: "Terrace" }, tables: range(15, 24) },
    { slug: "garden", name: { tr: "Bahçe", en: "Garden" }, tables: range(25, 32) },
  ],
} as const;

function range(from: number, to: number): string[] {
  return Array.from({ length: to - from + 1 }, (_, i) => String(from + i));
}

/** Payload a phone camera understands as "join this network". */
export function wifiQrPayload(): string {
  const esc = (s: string) => s.replace(/([\;,":])/g, "\\$1");
  const { ssid, password, encryption, hidden } = cafe.wifi;
  return `WIFI:T:${encryption};S:${esc(ssid)};P:${esc(password)};H:${hidden};;`;
}
