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
  changeStatus(orderId: string, status: OrderStatus): Promise<Order>;
}
