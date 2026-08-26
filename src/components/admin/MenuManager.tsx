"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext, PointerSensor, useSensor, useSensors, closestCenter, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, arrayMove, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Plus, EyeOff, Eye } from "lucide-react";
import { toast } from "sonner";
import type { MenuCategory, MenuItem } from "@/types/menu";
import { adminApi, AdminApiError } from "@/lib/admin/client";
import { formatPrice } from "@/lib/menu";
import { GlassSurface } from "@/components/glass/GlassSurface";
import { GlassButton } from "@/components/glass/GlassButton";
import { ItemEditor } from "./ItemEditor";
import { cn } from "@/lib/cn";

interface Row {
  slug: string;
  categorySlug: string;
  nameTr: string;
  priceMinor: number;
  isAvailable: boolean;
}

function SortableRow({
  row, onToggle, onEdit, onDelete,
}: {
  row: Row;
  onToggle: (row: Row) => void;
  onEdit: (row: Row) => void;
  onDelete: (row: Row) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.slug });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "glass flex items-center gap-2 rounded-[var(--radius-card)] p-2",
        isDragging && "z-10 opacity-90 shadow-xl",
        !row.isAvailable && "opacity-60",
      )}
    >
      <button
        {...listeners}
        {...attributes}
        aria-label={`${row.nameTr} sırasını değiştir`}
        className="cursor-grab touch-none px-1 text-[var(--ink-faint)] active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>

      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {row.nameTr}
        {!row.isAvailable && (
          <span className="ml-2 rounded-[var(--radius-pill)] bg-[var(--hairline)] px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">
            Tükendi
          </span>
        )}
      </span>

      <span className="shrink-0 text-sm font-semibold tabular-nums">
        {formatPrice(row.priceMinor, "tr")}
      </span>

      <GlassButton
        variant="ghost" size="icon" onClick={() => onToggle(row)}
        aria-label={row.isAvailable ? `${row.nameTr} tükendi olarak işaretle` : `${row.nameTr} stoğa al`}
      >
        {row.isAvailable ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      </GlassButton>
      <GlassButton variant="ghost" size="icon" onClick={() => onEdit(row)} aria-label={`${row.nameTr} düzenle`}>
        <Pencil className="size-4" />
      </GlassButton>
      <GlassButton variant="ghost" size="icon" onClick={() => onDelete(row)} aria-label={`${row.nameTr} sil`}>
        <Trash2 className="size-4" />
      </GlassButton>
    </li>
  );
}

export function MenuManager({ categories }: { categories: MenuCategory[] }) {
  const [active, setActive] = useState(categories[0]?.slug ?? "");
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<{ row: Row | null } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const category = useMemo(
    () => categories.find((c) => c.slug === active),
    [categories, active],
  );

  const hydrate = useCallback((items: MenuItem[], categorySlug: string) => {
    setRows(items.map((i) => ({
      slug: i.slug, categorySlug,
      nameTr: i.name.tr, priceMinor: i.priceMinor, isAvailable: i.isAvailable,
    })));
  }, []);

  useEffect(() => {
    if (category) hydrate(category.items, category.slug);
  }, [category, hydrate]);

  const toggle = async (row: Row) => {
    const next = !row.isAvailable;
    setRows((prev) => prev.map((r) => (r.slug === row.slug ? { ...r, isAvailable: next } : r)));
    try {
      await adminApi.setAvailability(row.categorySlug, row.slug, next);
      toast.success(next ? `${row.nameTr} stoğa alındı` : `${row.nameTr} tükendi`);
    } catch {
      setRows((prev) => prev.map((r) => (r.slug === row.slug ? { ...r, isAvailable: !next } : r)));
      toast.error("Değiştirilemedi");
    }
  };

  const remove = async (row: Row) => {
    try {
      await adminApi.deleteItem(row.categorySlug, row.slug);
      setRows((prev) => prev.filter((r) => r.slug !== row.slug));
      toast.success(`${row.nameTr} silindi`);
    } catch (err) {
      // The API refuses to delete an item that appears on past orders; that
      // reason is worth showing verbatim rather than a generic failure.
      toast.error(err instanceof AdminApiError ? err.message : "Silinemedi");
    }
  };

  const onDragEnd = async ({ active: a, over }: DragEndEvent) => {
    if (!over || a.id === over.id) return;
    const from = rows.findIndex((r) => r.slug === a.id);
    const to = rows.findIndex((r) => r.slug === over.id);
    const previous = rows;
    const next = arrayMove(rows, from, to);
    setRows(next);
    try {
      await adminApi.reorder(next[0]!.categorySlug, next.map((r) => r.slug));
    } catch {
      setRows(previous);
      toast.error("Sıralama kaydedilemedi");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">Menü Yönetimi</h1>
        <GlassButton variant="accent" size="sm" className="gap-1.5" onClick={() => setEditing({ row: null })}>
          <Plus className="size-4" /> Yeni Ürün
        </GlassButton>
      </div>

      <div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => setActive(c.slug)}
            aria-pressed={c.slug === active}
            className={cn(
              "shrink-0 rounded-[var(--radius-pill)] px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors",
              c.slug === active
                ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                : "glass text-[var(--ink-muted)] hover:text-[var(--ink)]",
            )}
          >
            {c.icon} {c.name.tr}
            <span className="ml-1.5 text-[10px] tabular-nums opacity-70">{c.items.length}</span>
          </button>
        ))}
      </div>

      <GlassSurface className="p-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={rows.map((r) => r.slug)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-1.5">
              {rows.map((row) => (
                <SortableRow
                  key={row.slug} row={row}
                  onToggle={toggle}
                  onEdit={(r) => setEditing({ row: r })}
                  onDelete={remove}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </GlassSurface>

      {editing && category && (
        <ItemEditor
          categorySlug={category.slug}
          existing={editing.row ? category.items.find((i) => i.slug === editing.row!.slug) ?? null : null}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
