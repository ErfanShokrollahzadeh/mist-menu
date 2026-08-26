import type { Order, OrderStatus } from "@/lib/api/contracts";
import type { AnalyticsDto } from "./analytics";

export interface AuthTokens {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  displayName: string;
  role: "Staff" | "Admin";
}

/** Columns on the board. Cancelled is an action, not a destination. */
export const BOARD_COLUMNS = ["received", "preparing", "ready", "served", "paid"] as const;
export type BoardColumn = (typeof BOARD_COLUMNS)[number];

export interface AdminApi {
  login(email: string, password: string): Promise<AuthTokens>;
  refresh(refreshToken: string): Promise<AuthTokens>;
  logout(refreshToken: string): Promise<void>;
  kitchenBoard(): Promise<Order[]>;
  analytics(from: string, to: string): Promise<AnalyticsDto>;
  setAvailability(categorySlug: string, slug: string, isAvailable: boolean): Promise<void>;
  upsertItem(input: UpsertItemInput): Promise<void>;
  deleteItem(categorySlug: string, slug: string): Promise<void>;
  reorder(categorySlug: string, slugs: string[]): Promise<void>;
  changeStatus(orderId: string, status: OrderStatus): Promise<Order>;
}

export interface UpsertItemInput {
  slug: string | null;          // null creates
  categorySlug: string;
  name: { tr: string; en: string };
  description: { tr: string; en: string };
  priceMinor: number;
  imageUrl: string | null;
  tags: string[];
  allergens: string[];
  calories: number | null;
  isAvailable: boolean;
}
