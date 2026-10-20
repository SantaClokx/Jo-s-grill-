"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";

import type { Order, OrderStatus } from "@/types";
import { allowedNextStatuses, ORDER_STATUSES } from "@/lib/orders/status";

const statusLabels: Record<OrderStatus, string> = {
  received: "Received",
  confirmed: "Confirmed",
  preparing: "Preparing",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusStyles: Record<OrderStatus, string> = {
  received: "bg-orange/15 text-brand-dark",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-amber-100 text-amber-900",
  delivered: "bg-green/15 text-green-dark",
  cancelled: "bg-slate-100 text-slate-600",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function AdminOrderDashboard() {
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [query, setQuery] = useState("");
  const [updating, setUpdating] = useState("");
  const [actionError, setActionError] = useState("");
  const endpoint = `/api/admin/orders?limit=200${filter === "all" ? "" : `&status=${filter}`}`;
  const fetcher = async (url: string) => {
    const response = await fetch(url, { cache: "no-store" });
    const payload = (await response.json()) as { orders?: Order[]; error?: string };
    if (!response.ok) throw new Error(payload.error ?? "Could not load orders.");
    return payload.orders ?? [];
  };
  const { data: orders = [], error, isLoading: loading, mutate } = useSWR<Order[]>(endpoint, fetcher, { revalidateOnFocus: false });

  async function loadOrders() {
    await mutate();
  }

  async function updateStatus(reference: string, status: OrderStatus) {
    setUpdating(reference);
    setActionError("");
    try {
      const response = await fetch("/api/admin/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference, status }) });
      const payload = (await response.json()) as { order?: Order; error?: string };
      if (!response.ok || !payload.order) throw new Error(payload.error ?? "Could not update order.");
      await mutate((current) => current?.map((order) => order.reference === reference ? payload.order! : order), { revalidate: false });
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Could not update order.");
    } finally {
      setUpdating("");
    }
  }

  const visibleOrders = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return orders;
    return orders.filter((order) => [order.reference, order.customer.fullName, order.customer.phone].some((value) => value.toLowerCase().includes(needle)));
  }, [orders, query]);

  const counts = useMemo(() => ORDER_STATUSES.reduce((result, status) => ({ ...result, [status]: orders.filter((order) => order.status === status).length }), {} as Record<OrderStatus, number>), [orders]);

  return (
    <section className="flex flex-col gap-6" aria-labelledby="orders-heading">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-muted">Operations</p><h2 id="orders-heading" className="mt-1 text-3xl font-extrabold text-ink">Orders</h2><p className="mt-1 text-sm text-ink/65">Review incoming orders and move them through the kitchen.</p></div>
        <button type="button" onClick={() => void loadOrders()} className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-ink hover:bg-cream">Refresh orders</button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <button type="button" onClick={() => setFilter("all")} className={`rounded-2xl border p-4 text-left transition ${filter === "all" ? "border-brand bg-white shadow-card" : "border-line bg-white/60"}`}><span className="block text-xs font-bold uppercase tracking-wide text-muted">All</span><strong className="mt-2 block text-2xl">{orders.length}</strong></button>
        {ORDER_STATUSES.map((status) => <button key={status} type="button" onClick={() => setFilter(status)} className={`rounded-2xl border p-4 text-left transition ${filter === status ? "border-brand bg-white shadow-card" : "border-line bg-white/60"}`}><span className="block text-xs font-bold uppercase tracking-wide text-muted">{statusLabels[status]}</span><strong className="mt-2 block text-2xl">{counts[status]}</strong></button>)}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="order-search">Search orders</label><input id="order-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reference, name, or phone" className="min-h-11 flex-1 rounded-xl border border-line bg-white px-4 text-sm outline-none placeholder:text-muted focus:border-brand" /></div>
      {error || actionError ? <div role="alert" className="rounded-xl border border-brand/30 bg-brand/5 px-4 py-3 text-sm font-semibold text-brand-dark">{actionError || (error instanceof Error ? error.message : "Could not load orders.")}</div> : null}
      {loading ? <div className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-muted">Loading orders…</div> : visibleOrders.length === 0 ? <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center"><p className="font-bold text-ink">No orders found</p><p className="mt-1 text-sm text-muted">Orders will appear here once they are stored in the database.</p></div> : <div className="grid gap-4">{visibleOrders.map((order) => <article key={order.reference} className="rounded-2xl border border-line bg-white p-5 shadow-card"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-extrabold text-ink">{order.reference}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[order.status]}`}>{statusLabels[order.status]}</span></div><p className="mt-1 text-sm text-muted">{formatDate(order.createdAt)} · {order.customer.fullName} · {order.customer.phone}</p></div><strong className="text-lg text-brand-dark">{formatCurrency(order.pricing.total)}</strong></div><div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-[1fr_auto] sm:items-end"><ul className="grid gap-1 text-sm text-ink/75">{order.lines.map((line) => <li key={line.itemId}>{line.quantity}× {line.name}</li>)}</ul><div className="flex flex-wrap gap-2 sm:justify-end">{allowedNextStatuses(order.status).map((next) => <button key={next} type="button" disabled={updating === order.reference} onClick={() => void updateStatus(order.reference, next)} className="rounded-lg border border-line px-3 py-2 text-xs font-bold text-ink hover:border-brand hover:text-brand-dark disabled:opacity-50">Move to {statusLabels[next]}</button>)}</div></div></article>)}</div>}
    </section>
  );
}
