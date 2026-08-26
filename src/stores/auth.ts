"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthTokens } from "@/lib/admin/contracts";

interface AuthState {
  tokens: AuthTokens | null;
  setTokens: (tokens: AuthTokens | null) => void;
  /** True when an access token exists and has not expired. */
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      tokens: null,
      setTokens: (tokens) => set({ tokens }),
      isAuthenticated: () => {
        const t = get().tokens;
        return Boolean(t) && new Date(t!.accessTokenExpiresAt) > new Date();
      },
      isAdmin: () => get().tokens?.role === "Admin",
    }),
    { name: "mist.staff-auth.v1" },
  ),
);
