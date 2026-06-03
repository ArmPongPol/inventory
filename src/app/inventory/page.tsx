"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api, ApiClientError } from "@/lib/api";
import type {
  CreateInventoryDto,
  Inventory,
  Product,
  UpdateInventoryDto,
} from "@/lib/types";
import { formatDateTime, formatNumber, toNumber } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
} from "@/components/ui";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { SearchIcon, StockIcon } from "@/components/icons";
import {
  PageShell,
  staggerContainer,
  staggerItem,
} from "@/components/page-shell";
import { accents, type AccentKey } from "@/lib/accents";

type Row = {
  product: Product;
  inventory: Inventory | null;
};

const ACCENT = "amber" as const;

export default function InventoryPage() {
  const toast = useToast();
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");

  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState({
    currentStock: "",
    minStock: "",
    maxStock: "",
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [inv, prod] = await Promise.all([
        api.get<Inventory[]>("/inventories"),
        api.get<Product[]>("/products"),
      ]);
      setInventories(inv);
      setProducts(prod);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Unable to load stock.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rows: Row[] = useMemo(() => {
    return products.map((p) => ({
      product: p,
      inventory: inventories.find((i) => i.productId === p.id) ?? null,
    }));
  }, [products, inventories]);

  const filtered = rows.filter((r) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !r.product.name.toLowerCase().includes(q) &&
        !(r.product.sku ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    const stock = toNumber(r.inventory?.currentStock);
    const min = toNumber(r.inventory?.minStock);
    if (filter === "low")
      return r.inventory?.minStock !== null && stock <= min && stock > 0;
    if (filter === "out") return stock <= 0;
    return true;
  });

  const summary = useMemo(() => {
    let inStock = 0;
    let low = 0;
    let out = 0;
    rows.forEach((r) => {
      const stock = toNumber(r.inventory?.currentStock);
      if (stock <= 0) out += 1;
      else if (
        r.inventory?.minStock !== null &&
        r.inventory?.minStock !== undefined &&
        stock <= toNumber(r.inventory.minStock)
      ) {
        low += 1;
      } else {
        inStock += 1;
      }
    });
    return { inStock, low, out };
  }, [rows]);

  const openEdit = (row: Row) => {
    setEditing(row);
    setForm({
      currentStock:
        row.inventory?.currentStock !== undefined
          ? String(row.inventory.currentStock)
          : "",
      minStock:
        row.inventory?.minStock !== null &&
        row.inventory?.minStock !== undefined
          ? String(row.inventory.minStock)
          : "",
      maxStock:
        row.inventory?.maxStock !== null &&
        row.inventory?.maxStock !== undefined
          ? String(row.inventory.maxStock)
          : "",
    });
  };

  const submit = async () => {
    if (!editing) return;
    setSaving(true);
    const dto: CreateInventoryDto | UpdateInventoryDto = {
      ...(form.currentStock !== ""
        ? { currentStock: Number(form.currentStock) }
        : {}),
      ...(form.minStock !== "" ? { minStock: Number(form.minStock) } : {}),
      ...(form.maxStock !== "" ? { maxStock: Number(form.maxStock) } : {}),
    };
    try {
      if (editing.inventory) {
        await api.patch(`/inventories/${editing.inventory.id}`, dto);
      } else {
        await api.post("/inventories", {
          productId: editing.product.id,
          ...dto,
        } satisfies CreateInventoryDto);
      }
      toast.show("Stock updated.");
      setEditing(null);
      await load();
    } catch (err) {
      toast.show(
        err instanceof ApiClientError ? err.message : "Save failed.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        accent={ACCENT}
        eyebrow="stock"
        title="Inventory"
        description="What is on the shelf today, what is running low, and what needs reordering before the weekend."
        actions={
          <>
            <Input
              icon={<SearchIcon size={14} />}
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56"
            />
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="w-40"
            >
              <option value="all">All items</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </Select>
          </>
        }
      />

      {error && (
        <div className="mb-6 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <motion.section
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <motion.div variants={staggerItem}>
          <SummaryTile label="Healthy" value={summary.inStock} accent="emerald" />
        </motion.div>
        <motion.div variants={staggerItem}>
          <SummaryTile label="Low stock" value={summary.low} accent="amber" />
        </motion.div>
        <motion.div variants={staggerItem}>
          <SummaryTile label="Out of stock" value={summary.out} accent="rose" />
        </motion.div>
      </motion.section>

      <Card className="mt-6 overflow-hidden">
        {loading ? (
          <div className="px-6 py-20 text-center text-sm text-muted">
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            accent={ACCENT}
            icon={<StockIcon size={22} />}
            title="Nothing to show"
            description="Add products first, then set their stock here."
          />
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border-soft bg-surface-2/40 text-left text-[10.5px] font-semibold uppercase tracking-[0.16em] text-subtle">
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3 text-right">On hand</th>
                <th className="px-6 py-3">Health</th>
                <th className="px-6 py-3 text-right">Min</th>
                <th className="px-6 py-3 text-right">Max</th>
                <th className="px-6 py-3">Updated</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <motion.tbody
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {filtered.map((row) => {
                const stock = toNumber(row.inventory?.currentStock);
                const min = toNumber(row.inventory?.minStock);
                const max = toNumber(row.inventory?.maxStock);
                const status =
                  stock <= 0
                    ? { label: "out", tone: "rose" as const, color: "#ec4899" }
                    : row.inventory?.minStock !== null &&
                        row.inventory?.minStock !== undefined &&
                        stock <= min
                      ? {
                          label: "low",
                          tone: "amber" as const,
                          color: "#f59e0b",
                        }
                      : {
                          label: "ok",
                          tone: "emerald" as const,
                          color: "#10b981",
                        };

                const pct = max > 0 ? Math.min(100, (stock / max) * 100) : 0;

                return (
                  <motion.tr
                    key={row.product.id}
                    variants={staggerItem}
                    className="group border-b border-border-soft transition-colors last:border-0 hover:bg-surface-2/60"
                  >
                    <td className="px-6 py-3.5 font-medium text-ink">
                      {row.product.name}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-[11.5px] text-muted">
                      {row.product.sku ?? "—"}
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium text-ink">
                      {row.inventory
                        ? `${formatNumber(stock, 2)} ${row.product.unit ?? ""}`
                        : "—"}
                    </td>
                    <td className="px-6 py-3.5">
                      {max > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{
                                duration: 0.6,
                                ease: [0.2, 0.7, 0.2, 1],
                              }}
                              className="h-full rounded-full"
                              style={{ background: status.color }}
                            />
                          </div>
                          <span className="text-[11px] text-subtle">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right text-muted">
                      {row.inventory?.minStock !== null &&
                      row.inventory?.minStock !== undefined
                        ? formatNumber(min, 2)
                        : "—"}
                    </td>
                    <td className="px-6 py-3.5 text-right text-muted">
                      {row.inventory?.maxStock !== null &&
                      row.inventory?.maxStock !== undefined
                        ? formatNumber(max, 2)
                        : "—"}
                    </td>
                    <td className="px-6 py-3.5 text-muted">
                      {row.inventory
                        ? formatDateTime(row.inventory.lastUpdated)
                        : "—"}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge tone={status.tone} dot>
                        {status.label}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="soft"
                        accent={ACCENT}
                        onClick={() => openEdit(row)}
                      >
                        Adjust
                      </Button>
                    </td>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        )}
      </Card>

      <Modal
        open={!!editing}
        onClose={() => (saving ? null : setEditing(null))}
        title={editing ? `Adjust stock — ${editing.product.name}` : ""}
        description="Update on-hand quantity and thresholds. A row will be created for items that don't have one yet."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setEditing(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="accent"
              accent={ACCENT}
              onClick={submit}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-3 gap-4">
          <Field label="On hand">
            <Input
              type="number"
              step="0.01"
              value={form.currentStock}
              onChange={(e) =>
                setForm({ ...form, currentStock: e.target.value })
              }
            />
          </Field>
          <Field label="Min">
            <Input
              type="number"
              step="0.01"
              value={form.minStock}
              onChange={(e) => setForm({ ...form, minStock: e.target.value })}
            />
          </Field>
          <Field label="Max">
            <Input
              type="number"
              step="0.01"
              value={form.maxStock}
              onChange={(e) => setForm({ ...form, maxStock: e.target.value })}
            />
          </Field>
        </div>
      </Modal>
    </PageShell>
  );
}

function SummaryTile({
  label,
  value,
  accent: accentKey,
}: {
  label: string;
  value: number;
  accent: AccentKey;
}) {
  const a = accents[accentKey];
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className="relative overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-sm"
    >
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${a.bgSoft} blur-2xl`} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            <span className={`h-1.5 w-1.5 rounded-full ${a.bg}`} />
            {label}
          </div>
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${a.bgSoft} ${a.text}`}>
            <StockIcon size={13} />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-[28px] font-semibold leading-none tracking-tight text-ink">
            {formatNumber(value)}
          </span>
          <span className="text-[12px] text-subtle">items</span>
        </div>
      </div>
    </motion.div>
  );
}
