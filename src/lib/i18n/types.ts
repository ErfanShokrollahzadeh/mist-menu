import type tr from "@/dictionaries/tr.json";

/** Turkish is the source of truth; English must supply the same keys. */
export type Dictionary = typeof tr;
export type DictionaryKey = keyof Dictionary;

/** Values interpolated into `{placeholders}` in dictionary strings. */
export type TVars = Record<string, string | number>;
