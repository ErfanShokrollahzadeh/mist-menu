"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTable } from "@/stores/table";

/**
 * Binds the session to the table encoded in the QR link (`/?table=12`).
 * Must be rendered inside <Suspense>: useSearchParams opts the whole route
 * out of static generation otherwise.
 */
export function TableSync() {
  const params = useSearchParams();
  const setTable = useTable((s) => s.setTable);

  useEffect(() => {
    const raw = params.get("table");
    if (!raw) return;
    const id = raw.trim().slice(0, 8);
    if (id) setTable(id, true);
  }, [params, setTable]);

  return null;
}
