import "server-only";
import type { Dictionary } from "./types";

const loaders = {
  tr: () => import("@/dictionaries/tr.json").then((m) => m.default as Dictionary),
  en: () => import("@/dictionaries/en.json").then((m) => m.default as Dictionary),
} as const;

export const getDictionary = async (locale: string): Promise<Dictionary> =>
  (loaders[locale as keyof typeof loaders] ?? loaders.tr)();
