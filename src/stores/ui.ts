"use client";

import { create } from "zustand";

export type SheetName = "tray" | "waiter" | "bill" | "wifi" | "feedback" | null;

interface UiState {
  sheet: SheetName;
  openSheet: (name: NonNullable<SheetName>) => void;
  closeSheet: () => void;
}

/** One sheet at a time — stacked glass sheets read as a mistake, not a feature. */
export const useUi = create<UiState>((set) => ({
  sheet: null,
  openSheet: (sheet) => set({ sheet }),
  closeSheet: () => set({ sheet: null }),
}));
