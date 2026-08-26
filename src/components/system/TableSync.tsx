"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTable } from "@/stores/table";

const API = process.env.NEXT_PUBLIC_API_URL;

/**
 * Binds the session to the table encoded in the QR link.
 *
 * `?t=<token>` is the current form: an opaque per-table token the API resolves
 * to a number. `?table=<number>` is what codes printed before this change
 * carry — a bare number is forgeable, so anyone could order to another table by
 * editing the URL. It is still accepted so those codes keep working, and should
 * be dropped once every table has been reprinted.
 *
 * Must be rendered inside <Suspense>: useSearchParams opts the route out of
 * static generation otherwise.
 */
export function TableSync() {
  const params = useSearchParams();
  const setTable = useTable((s) => s.setTable);

  useEffect(() => {
    const token = params.get("t");
    const legacy = params.get("table");

    if (token) {
      if (!API) return;                       // cannot resolve without a backend
      const controller = new AbortController();
      fetch(`${API}/api/v1/tables/resolve/${encodeURIComponent(token)}`,
            { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : null))
        .then((table: { number: string } | null) => {
          // An unknown token binds nothing, rather than falling back to a guess.
          if (table?.number) setTable(table.number, true);
        })
        .catch(() => {});
      return () => controller.abort();
    }

    if (legacy) {
      const id = legacy.trim().slice(0, 8);
      if (id) setTable(id, true);
    }
  }, [params, setTable]);

  return null;
}
