"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface TableState {
  /** Set from the QR link's ?table= param, or chosen by hand. */
  tableId: string | null;
  /** True when it came from the URL, so the UI can skip asking. */
  fromQr: boolean;
  setTable: (id: string | null, fromQr?: boolean) => void;
}

export const useTable = create<TableState>()(
  persist(
    (set) => ({
      tableId: null,
      fromQr: false,
      setTable: (tableId, fromQr = false) => set({ tableId, fromQr }),
    }),
    {
      name: "mist.table.v1",
      // A table binding should not outlive the visit.
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? (undefined as never) : window.sessionStorage,
      ),
    },
  ),
);
