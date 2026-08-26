"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
         useDroppable, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Volume2, VolumeX, RefreshCw } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/api/contracts";
import { adminApi } from "@/lib/admin/client";
import { BOARD_COLUMNS, type BoardColumn } from "@/lib/admin/contracts";
import { useAuth } from "@/stores/auth";
import { useNewOrderChime } from "@/lib/admin/useNewOrderChime";
import { GlassButton } from "@/components/glass/GlassButton";
import { OrderCard } from "./OrderCard";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/cn";

const COLUMN_LABEL: Record<BoardColumn, string> = {
  received: "Yeni", preparing: "Hazırlanıyor", ready: "Hazır", served: "Servis Edildi", paid: "Ödendi",
};

function Column({ id, orders }: { id: BoardColumn; orders: Order[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[50dvh] flex-col gap-2 rounded-[var(--radius-card)] p-2 transition-colors",
        isOver ? "bg-[var(--accent)]/10 ring-2 ring-[var(--accent)]/40" : "bg-[var(--hairline)]/40",
      )}
    >
      <header className="flex items-center justify-between px-1.5 py-1">
        <h2 className="text-[11px] font-bold tracking-wider uppercase">{COLUMN_LABEL[id]}</h2>
        <span className="text-xs font-bold tabular-nums text-[var(--ink-faint)]">{orders.length}</span>
      </header>
      <AnimatePresence mode="popLayout">
        {orders.map((o) => (
          <motion.div key={o.id} layout initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                      transition={spring.snappy}>
            <OrderCard order={o} />
          </motion.div>
        ))}
      </AnimatePresence>
    </section>
  );
}

export function KitchenBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [dragging, setDragging] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { armed, arm, play } = useNewOrderChime();
  const tokens = useAuth((s) => s.tokens);
  const knownIds = useRef<Set<string>>(new Set());
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const load = useCallback(async () => {
    try {
      const board = await adminApi.kitchenBoard();
      setOrders(board);
      knownIds.current = new Set(board.map((o) => o.id));
    } catch {
      toast.error("Pano yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Live feed. Falls back to the initial load if the socket never opens, so a
  // blocked WebSocket degrades to a stale board rather than an empty one.
  useEffect(() => {
    if (!tokens?.accessToken) return;
    let disposed = false;
    let stop: (() => Promise<void>) | null = null;

    (async () => {
      const signalR = await import("@microsoft/signalr");
      const conn = new signalR.HubConnectionBuilder()
        .withUrl(`${process.env.NEXT_PUBLIC_API_URL}/hubs/orders`,
                 { accessTokenFactory: () => tokens.accessToken })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      conn.on("OrderCreated", (order: Order) => {
        setOrders((prev) => (prev.some((o) => o.id === order.id) ? prev : [...prev, order]));
        if (!knownIds.current.has(order.id)) {
          knownIds.current.add(order.id);
          play();
          toast.success(`Yeni sipariş · Masa ${order.tableId}`);
        }
      });
      conn.on("OrderStatusChanged", () => void load());

      try {
        await conn.start();
        await conn.invoke("JoinStaff");
        if (disposed) await conn.stop();
        else stop = () => conn.stop();
      } catch {
        toast.error("Canlı bağlantı kurulamadı");
      }
    })();

    return () => { disposed = true; void stop?.(); };
  }, [tokens?.accessToken, play, load]);

  const byColumn = useMemo(() => {
    const map = Object.fromEntries(BOARD_COLUMNS.map((c) => [c, [] as Order[]])) as
      Record<BoardColumn, Order[]>;
    for (const o of orders) if (o.status in map) map[o.status as BoardColumn].push(o);
    return map;
  }, [orders]);

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    setDragging(null);
    if (!over) return;
    const target = over.id as BoardColumn;
    const order = orders.find((o) => o.id === active.id);
    if (!order || order.status === target) return;

    const previous = orders;
    // Optimistic: the SignalR echo reconciles, and a rejection restores.
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: target } : o)));
    try {
      await adminApi.changeStatus(order.id, target as OrderStatus);
    } catch (err) {
      setOrders(previous);
      toast.error(err instanceof Error ? err.message : "Durum değiştirilemedi");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">Mutfak Panosu</h1>
        <div className="flex items-center gap-2">
          {/* Autoplay is blocked until a gesture, so the armed state is shown
              rather than assumed — a kitchen that thinks it has sound and does
              not is worse than one that knows it is silent. */}
          <GlassButton
            variant={armed ? "glass" : "accent"}
            size="sm"
            onClick={arm}
            className="gap-1.5"
            aria-pressed={armed}
          >
            {armed ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            {armed ? "Ses açık" : "Sesi aç"}
          </GlassButton>
          <GlassButton variant="ghost" size="icon" onClick={() => void load()} aria-label="Yenile">
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </GlassButton>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={({ active }: DragStartEvent) =>
          setDragging(orders.find((o) => o.id === active.id) ?? null)}
        onDragEnd={onDragEnd}
      >
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
          {BOARD_COLUMNS.map((c) => <Column key={c} id={c} orders={byColumn[c]} />)}
        </div>
        <DragOverlay>{dragging && <OrderCard order={dragging} />}</DragOverlay>
      </DndContext>
    </div>
  );
}
