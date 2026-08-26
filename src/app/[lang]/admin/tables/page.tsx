"use client";

import { useEffect, useState } from "react";
import { TableManager } from "@/components/admin/TableManager";

export default function AdminTablesPage() {
  // The printed link must point at whatever host the customer will reach,
  // which is only known in the browser.
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  return origin ? <TableManager origin={origin} /> : null;
}
