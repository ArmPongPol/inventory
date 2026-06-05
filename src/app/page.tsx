"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { api, ApiClientError } from "@/lib/api";
import type { Inventory, Product, SaleOrder } from "@/lib/types";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  toNumber,
} from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Badge, Card, EmptyState } from "@/components/ui";
import { Bars, Donut, Sparkline } from "@/components/sparkline";
import {
  ArrowUpRightIcon,
  BoltIcon,
  CustomersIcon,
  PlusIcon,
  ProductsIcon,
  SalesIcon,
  StockIcon,
  TrendDownIcon,
  TrendUpIcon,
} from "@/components/icons";
import {
  PageShell,
  staggerContainer,
  staggerItem,
} from "@/components/page-shell";
import { accents, type AccentKey } from "@/lib/accents";

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [sales, setSales] = useState<SaleOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, i, s] = await Promise.all([
          api.get<Product[]>("/products"),
          api.get<Inventory[]>("/inventories"),
          api.get<SaleOrder[]>("/sale-orders"),
        ]);
        if (cancelled) return;
        setProducts(p);
        setInventory(i);
        setSales(s);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof ApiClientError
            ? err.message
            : "Unable to reach the backend service.";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => {
    const activeProducts = products.filter((p) => p.isActive).length;
    const inventoryValue = inventory.reduce((sum, inv) => {
      const product = products.find((p) => p.id === inv.productId);
      const cost = toNumber(product?.costPrice ?? product?.salePrice ?? 0);
      return sum + cost * toNumber(inv.currentStock);
    }, 0);

    const closedSales = sales.filter(
      (s) => (s.status ?? "").toUpperCase() === "CLOSED",
    );
    const revenue = closedSales.reduce(
      (sum, s) => sum + toNumber(s.totalAmount),
      0,
    );

    const lowStock = inventory.filter((inv) => {
      const min = toNumber(inv.minStock);
      return inv.minStock !== null && toNumber(inv.currentStock) <= min;
    });

    const now = Date.now();
    const days = 14;
    const dayMs = 86_400_000;
    const buckets = Array(days).fill(0);
    const orderBuckets = Array(days).fill(0);
    closedSales.forEach((s) => {
      const t = new Date(s.orderTime).getTime();
      const idx = days - 1 - Math.floor((now - t) / dayMs);
      if (idx >= 0 && idx < days) {
        buckets[idx] += toNumber(s.totalAmount);
        orderBuckets[idx] += 1;
      }
    });

    const halfPoint = Math.floor(days / 2);
    const prevHalf = buckets.slice(0, halfPoint).reduce((s, v) => s + v, 0);
    const recentHalf = buckets.slice(halfPoint).reduce((s, v) => s + v, 0);
    const revenueTrend = prevHalf
      ? ((recentHalf - prevHalf) / prevHalf) * 100
      : 0;

    return {
      activeProducts,
      totalProducts: products.length,
      inventoryValue,
      revenue,
      orderCount: sales.length,
      closedCount: closedSales.length,
      lowStock,
      revenueSeries: buckets,
      orderSeries: orderBuckets,
      revenueTrend,
    };
  }, [products, inventory, sales]);

  const recent = useMemo(
    () =>
      [...sales]
        .sort(
          (a, b) =>
            new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime(),
        )
        .slice(0, 6),
    [sales],
  );

  const topMovers = useMemo(() => {
    const tally = new Map<number, number>();
    sales.forEach((s) => {
      s.items?.forEach((it) => {
        tally.set(
          it.productId,
          (tally.get(it.productId) ?? 0) + toNumber(it.quantity),
        );
      });
    });
    return [...tally.entries()]
      .map(([productId, qty]) => ({
        product: products.find((p) => p.id === productId),
        qty,
      }))
      .filter((r) => r.product)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [sales, products]);

  const stockDonut = useMemo(() => {
    let ok = 0;
    let low = 0;
    let out = 0;
    products.forEach((p) => {
      const inv = inventory.find((i) => i.productId === p.id);
      const stock = toNumber(inv?.currentStock);
      if (!inv || stock <= 0) out += 1;
      else if (
        inv.minStock !== null &&
        inv.minStock !== undefined &&
        stock <= toNumber(inv.minStock)
      )
        low += 1;
      else ok += 1;
    });
    return [
      { value: ok, color: accents.emerald.hex, label: "Healthy" },
      { value: low, color: accents.amber.hex, label: "Low" },
      { value: out, color: accents.rose.hex, label: "Out" },
    ];
  }, [products, inventory]);

  return (
    <PageShell>
      <PageHeader
        eyebrow="overview"
        title="Good afternoon."
        description="A bright summary of the shop today — what's in stock, what moved, and what needs your attention."
        accent="brand"
      />

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {error} · Make sure the backend is running on{" "}
          <code className="font-mono">
            {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}
          </code>
        </motion.div>
      )}

      {/* Metrics */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={staggerItem}>
          <MetricCard
            accent="emerald"
            icon={<SalesIcon size={16} />}
            label="Revenue"
            value={loading ? "—" : formatCurrency(metrics.revenue)}
            trend={metrics.revenueTrend}
            chart={
              <Sparkline
                values={
                  metrics.revenueSeries.some((v) => v > 0)
                    ? metrics.revenueSeries
                    : [0, 0, 0]
                }
                width={120}
                height={36}
                stroke={accents.emerald.hex}
                fill={accents.emerald.hex}
              />
            }
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <MetricCard
            accent="brand"
            icon={<BoltIcon size={16} />}
            label="Orders"
            value={loading ? "—" : formatNumber(metrics.orderCount)}
            hint="last 14 days"
            chart={
              <Bars
                values={
                  metrics.orderSeries.some((v) => v > 0)
                    ? metrics.orderSeries
                    : [0, 0, 0]
                }
                width={120}
                height={36}
                colors={[
                  accents.brand.hex,
                  accents.violet.hex,
                  accents.rose.hex,
                ]}
              />
            }
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <MetricCard
            accent="amber"
            icon={<StockIcon size={16} />}
            label="Inventory value"
            value={loading ? "—" : formatCurrency(metrics.inventoryValue)}
            hint="at cost"
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <MetricCard
            accent="violet"
            icon={<ProductsIcon size={16} />}
            label="Products"
            value={loading ? "—" : formatNumber(metrics.activeProducts)}
            hint={loading ? "" : `of ${metrics.totalProducts} on the shelf`}
          />
        </motion.div>
      </motion.section>

      {/* Main grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="overflow-hidden lg:col-span-3">
          <SectionHeader
            accent="emerald"
            title="Recent sales"
            subtitle="Most recent activity in the till"
            link={{ href: "/sales", label: "Open ledger" }}
          />
          {recent.length === 0 ? (
            <EmptyState
              accent="emerald"
              icon={<SalesIcon size={22} />}
              title="No orders yet"
              description="Open the Sales page to record the first transaction."
            />
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border-soft text-left text-[10.5px] font-semibold uppercase tracking-[0.16em] text-subtle">
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">When</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Total</th>
                </tr>
              </thead>
              <motion.tbody
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                {recent.map((s) => (
                  <motion.tr
                    key={s.id}
                    variants={staggerItem}
                    className="border-b border-border-soft transition-colors last:border-0 hover:bg-surface-2/60"
                  >
                    <td className="px-6 py-3 font-mono text-[12px] text-ink">
                      #{String(s.id).padStart(4, "0")}
                    </td>
                    <td className="px-6 py-3 text-muted">
                      {formatDateTime(s.orderTime)}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-ink">
                      {formatCurrency(s.totalAmount)}
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          )}
        </Card>

        <Card className="overflow-hidden lg:col-span-2">
          <SectionHeader
            accent="amber"
            title="Stock health"
            subtitle="How the warehouse is doing"
            link={{ href: "/inventory", label: "Inventory" }}
          />
          <div className="flex items-center gap-6 px-6 py-6">
            <Donut segments={stockDonut} />
            <ul className="flex flex-1 flex-col gap-3">
              {stockDonut.map((seg) => {
                const total = stockDonut.reduce((s, x) => s + x.value, 0) || 1;
                const pct = (seg.value / total) * 100;
                return (
                  <li key={seg.label} className="text-[13px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{ background: seg.color }}
                        />
                        <span className="text-text">{seg.label}</span>
                      </div>
                      <span className="font-medium text-ink">{seg.value}</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
                        className="h-full rounded-full"
                        style={{ background: seg.color }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <SectionHeader
            accent="rose"
            title="Top movers"
            subtitle="Best-selling items by quantity"
            link={{ href: "/products", label: "Catalog" }}
          />
          {topMovers.length === 0 ? (
            <EmptyState
              accent="rose"
              icon={<TrendUpIcon size={22} />}
              title="Nothing has moved yet"
              description="Once orders are recorded, the best-sellers appear here."
            />
          ) : (
            <motion.ul
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="flex flex-col divide-y divide-border-soft"
            >
              {topMovers.map((m, i) => {
                const rankAccent: AccentKey[] = [
                  "amber",
                  "violet",
                  "sky",
                  "cyan",
                  "rose",
                ];
                const a = accents[rankAccent[i] ?? "brand"];
                return (
                  <motion.li
                    key={m.product!.id}
                    variants={staggerItem}
                    className="flex items-center gap-4 px-6 py-3"
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${a.bgSoft} ${a.text}`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-[13px] text-ink">
                        {m.product!.name}
                      </div>
                      <div className="text-[11.5px] text-muted">
                        {formatCurrency(toNumber(m.product!.salePrice))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] font-medium text-ink">
                        {formatNumber(m.qty, 0)}
                      </div>
                      <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-subtle">
                        sold
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </Card>

        <Card className="overflow-hidden">
          <SectionHeader
            accent="cyan"
            title="Quick actions"
            subtitle="Common workflows"
          />
          <div className="grid grid-cols-2 gap-px bg-border-soft">
            <QuickAction
              href="/sales"
              accent="emerald"
              icon={<SalesIcon size={16} />}
              label="New sale"
              hint="Ring up an order"
            />
            <QuickAction
              href="/products"
              accent="violet"
              icon={<PlusIcon size={16} />}
              label="Add a product"
              hint="Catalog item"
            />
            <QuickAction
              href="/inventory"
              accent="amber"
              icon={<StockIcon size={16} />}
              label="Adjust stock"
              hint="Current quantities"
            />
            <QuickAction
              href="/customers"
              accent="rose"
              icon={<CustomersIcon size={16} />}
              label="Register customer"
              hint="Loyalty programme"
            />
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function MetricCard({
  label,
  value,
  hint,
  chart,
  accent: accentKey,
  icon,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  chart?: React.ReactNode;
  accent: AccentKey;
  icon: React.ReactNode;
  trend?: number;
}) {
  const a = accents[accentKey];
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className="relative overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-sm"
    >
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${a.bgSoft} blur-2xl opacity-70`} />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${a.bgSoft} ${a.text}`}>
            {icon}
          </div>
          {trend !== undefined && trend !== 0 && (
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                trend > 0
                  ? "bg-emerald-soft text-emerald"
                  : "bg-rose-soft text-rose"
              }`}
            >
              {trend > 0 ? (
                <TrendUpIcon size={11} />
              ) : (
                <TrendDownIcon size={11} />
              )}
              {Math.abs(trend).toFixed(0)}%
            </span>
          )}
        </div>
        <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          {label}
        </div>
        <div className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-ink">
          {value}
        </div>
        <div className="mt-3 flex items-end justify-between">
          {hint && <div className="text-[11.5px] text-subtle">{hint}</div>}
          {chart && <div>{chart}</div>}
        </div>
      </div>
    </motion.div>
  );
}

function SectionHeader({
  title,
  subtitle,
  link,
  accent: accentKey,
}: {
  title: string;
  subtitle?: string;
  link?: { href: string; label: string };
  accent?: AccentKey;
}) {
  const a = accentKey ? accents[accentKey] : null;
  return (
    <div className="flex items-center justify-between border-b border-border-soft px-6 py-4">
      <div className="flex items-center gap-3">
        {a && <span className={`h-2 w-2 rounded-full ${a.bg}`} />}
        <div>
          <h2 className="text-[14px] font-semibold tracking-tight text-ink">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-[11.5px] text-muted">{subtitle}</p>
          )}
        </div>
      </div>
      {link && (
        <Link
          href={link.href}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          {link.label}
          <ArrowUpRightIcon size={12} />
        </Link>
      )}
    </div>
  );
}

function QuickAction({
  href,
  label,
  hint,
  accent: accentKey,
  icon,
}: {
  href: string;
  label: string;
  hint: string;
  accent: AccentKey;
  icon: React.ReactNode;
}) {
  const a = accents[accentKey];
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 bg-surface px-5 py-4 transition-colors hover:bg-surface-2/70"
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${a.bgSoft} ${a.text} transition-transform group-hover:scale-105`}
      >
        {icon}
      </span>
      <div className="flex-1">
        <div className="text-[13px] font-medium text-ink">{label}</div>
        <div className="mt-0.5 text-[11.5px] text-muted">{hint}</div>
      </div>
      <span className="text-subtle transition-all group-hover:translate-x-0.5 group-hover:text-ink">
        <ArrowUpRightIcon size={14} />
      </span>
    </Link>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const s = (status ?? "OPEN").toUpperCase();
  const tone =
    s === "CLOSED"
      ? "emerald"
      : s === "OPEN"
        ? "amber"
        : s === "CANCELLED"
          ? "rose"
          : s === "REFUNDED"
            ? "violet"
            : "neutral";
  return (
    <Badge tone={tone as never} dot>
      {s.toLowerCase()}
    </Badge>
  );
}
