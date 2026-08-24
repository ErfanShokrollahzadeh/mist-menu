export type Locale = "tr" | "en";

/** Every customer-visible string carries both languages together. */
export type Localized = Record<Locale, string>;

export type DietaryTag =
  | "vegan"
  | "vegetarian"
  | "spicy"
  | "chefs-choice"
  | "caffeine"
  | "contains-alcohol-free-mixer";

export type ImageSource = "house" | "stock" | "none";

export interface ImageRef {
  /** `house` is MiST's own photography; `stock` is licensed placeholder. */
  source: ImageSource;
  src: string;
  alt: Localized;
  /** Tiny base64 LQIP so cards do not pop in. */
  blurDataURL?: string;
}

export interface ModifierOption {
  slug: string;
  name: Localized;
  /** Signed delta in kuruş against the parent item's price. */
  priceDeltaMinor: number;
  isDefault: boolean;
  isAvailable: boolean;
  sortOrder: number;
}

export interface ModifierGroup {
  slug: string;
  name: Localized;
  selection: "single" | "multiple";
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  options: ModifierOption[];
}

export interface MenuItem {
  slug: string;
  categorySlug: string;
  name: Localized;
  description: Localized;
  /**
   * Price in kuruş (1/100 TRY) as an integer. Never a float: split-bill
   * arithmetic on floats is how rounding bugs reach a customer's receipt.
   */
  priceMinor: number;
  image: ImageRef;
  tags: DietaryTag[];
  /**
   * Absent from the source data and never inferred. Rendering a guessed
   * allergen list for a real restaurant is a food-safety claim, not a UI
   * detail — these stay empty until the cafe supplies them.
   */
  allergens: string[];
  calories?: number;
  modifierGroups: ModifierGroup[];
  isAvailable: boolean;
  sortOrder: number;
  /** Pre-folded haystack so search does not re-normalise on every keystroke. */
  searchBlob: Localized;
}

export interface MenuCategory {
  slug: string;
  groupSlug: string;
  name: Localized;
  /** Moved out of a Turkish-keyed lookup in the component and into the data. */
  icon: string;
  image?: ImageRef;
  sortOrder: number;
  items: MenuItem[];
}

export interface MenuGroup {
  slug: string;
  name: Localized;
  icon: string;
  sortOrder: number;
}

export interface MenuDocument {
  version: string;
  generatedAt: string;
  currency: "TRY";
  /** Explicit so the UI can state it rather than implying completeness. */
  allergenDataAvailable: boolean;
  calorieDataAvailable: boolean;
  groups: MenuGroup[];
  categories: MenuCategory[];
}
