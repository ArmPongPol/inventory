"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, ApiClientError } from "@/lib/api";
import type {
  Category,
  CreateProductDto,
  Product,
  UpdateProductDto,
} from "@/lib/types";
import { formatCurrency, formatNumber, toNumber } from "@/lib/format";
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
import {
  EditIcon,
  PlusIcon,
  ProductsIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/icons";
import {
  PageShell,
  staggerContainer,
  staggerItem,
} from "@/components/page-shell";
import { accents } from "@/lib/accents";

type Form = {
  name: string;
  sku: string;
  unit: string;
  categoryId: string;
  salePrice: string;
  costPrice: string;
  isActive: boolean;
};

const emptyForm: Form = {
  name: "",
  sku: "",
  unit: "",
  categoryId: "",
  salePrice: "",
  costPrice: "",
  isActive: true,
};

const ACCENT = "violet" as const;

export default function ProductsPage() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState<Product | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        api.get<Product[]>("/products"),
        api.get<Category[]>("/categories"),
      ]);
      setProducts(p);
      setCategories(c);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Unable to load products.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku ?? "",
      unit: p.unit ?? "",
      categoryId: p.categoryId?.toString() ?? "",
      salePrice: String(p.salePrice),
      costPrice: p.costPrice !== null ? String(p.costPrice) : "",
      isActive: p.isActive,
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim() || !form.salePrice) {
      toast.show("Name and sale price are required.", "error");
      return;
    }
    setSaving(true);
    const payload: CreateProductDto | UpdateProductDto = {
      name: form.name.trim(),
      salePrice: Number(form.salePrice),
      ...(form.sku.trim() ? { sku: form.sku.trim() } : {}),
      ...(form.unit.trim() ? { unit: form.unit.trim() } : {}),
      ...(form.categoryId ? { categoryId: Number(form.categoryId) } : {}),
      ...(form.costPrice ? { costPrice: Number(form.costPrice) } : {}),
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await api.patch<Product>(`/products/${editing.id}`, payload);
        toast.show("Product updated.");
      } else {
        await api.post<Product>("/products", payload);
        toast.show("Product created.");
      }
      setOpen(false);
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

  const remove = async (p: Product) => {
    try {
      await api.delete(`/products/${p.id}`);
      toast.show("Product removed.");
      setConfirming(null);
      await load();
    } catch (err) {
      toast.show(
        err instanceof ApiClientError ? err.message : "Delete failed.",
        "error",
      );
    }
  };

  const filtered = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku ?? "").toLowerCase().includes(q) ||
      (p.category?.name ?? "").toLowerCase().includes(q)
    );
  });

  const margin = (p: Product) => {
    const cost = toNumber(p.costPrice);
    const price = toNumber(p.salePrice);
    if (!cost || !price) return null;
    return ((price - cost) / price) * 100;
  };

  const a = accents[ACCENT];

  return (
    <PageShell>
      <PageHeader
        accent={ACCENT}
        eyebrow="catalog"
        title="Products"
        description="Every item the shop carries — its name, code, the price it leaves the door at, and what it costs to bring in."
        actions={
          <>
            <Input
              icon={<SearchIcon size={14} />}
              placeholder="Search by name, SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Button
              variant="accent"
              accent={ACCENT}
              onClick={openCreate}
              icon={<PlusIcon size={14} />}
            >
              New product
            </Button>
          </>
        }
        meta={
          !loading && (
            <div className="flex items-center gap-3 text-[11.5px] text-muted">
              <span>
                {formatNumber(filtered.length)} shown ·{" "}
                {formatNumber(products.length)} total
              </span>
              <span className="h-3 w-px bg-border" />
              <span>
                {formatNumber(products.filter((p) => p.isActive).length)} active
              </span>
            </div>
          )
        }
      />

      {error && (
        <div className="mb-6 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="px-6 py-20 text-center text-sm text-muted">
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            accent={ACCENT}
            icon={<ProductsIcon size={22} />}
            title={search ? "Nothing matched" : "No products yet"}
            description={
              search
                ? "Try a different word."
                : "Add the first item to the catalog."
            }
            action={
              !search && (
                <Button
                  variant="accent"
                  accent={ACCENT}
                  onClick={openCreate}
                  icon={<PlusIcon size={14} />}
                >
                  New product
                </Button>
              )
            }
          />
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border-soft bg-surface-2/40 text-left text-[10.5px] font-semibold uppercase tracking-[0.16em] text-subtle">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Unit</th>
                <th className="px-6 py-3 text-right">Cost</th>
                <th className="px-6 py-3 text-right">Price</th>
                <th className="px-6 py-3 text-right">Margin</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <motion.tbody
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {filtered.map((p) => {
                const m = margin(p);
                return (
                  <motion.tr
                    key={p.id}
                    variants={staggerItem}
                    className="group border-b border-border-soft transition-colors last:border-0 hover:bg-surface-2/60"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.bgSoft} ${a.text}`}
                        >
                          <ProductsIcon size={14} />
                        </div>
                        <div>
                          <div className="font-medium text-ink">{p.name}</div>
                          {p.category?.name && (
                            <div className="text-[11px] text-muted">
                              {p.category.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-[11.5px] text-muted">
                      {p.sku ?? "—"}
                    </td>
                    <td className="px-6 py-3.5 text-muted">
                      {p.category?.name ?? "—"}
                    </td>
                    <td className="px-6 py-3.5 text-muted">{p.unit ?? "—"}</td>
                    <td className="px-6 py-3.5 text-right text-muted">
                      {p.costPrice !== null
                        ? formatCurrency(toNumber(p.costPrice))
                        : "—"}
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium text-ink">
                      {formatCurrency(toNumber(p.salePrice))}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {m !== null ? (
                        <span
                          className={
                            m > 0
                              ? "font-medium text-emerald"
                              : "font-medium text-rose"
                          }
                        >
                          {m.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      {p.isActive ? (
                        <Badge tone="emerald" dot>
                          active
                        </Badge>
                      ) : (
                        <Badge tone="neutral">archived</Badge>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(p)}
                          icon={<EditIcon size={13} />}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirming(p)}
                          className="text-rose hover:bg-rose-soft"
                          icon={<TrashIcon size={13} />}
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => (saving ? null : setOpen(false))}
        title={editing ? "Edit product" : "New product"}
        description={
          editing
            ? "Update the details for this item."
            : "Add a new item to the catalog. Stock can be set on the inventory page."
        }
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
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
              {saving ? "Saving…" : editing ? "Save changes" : "Create"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Cedar pencil case"
              />
            </Field>
          </div>
          <Field label="SKU" hint="optional, must be unique">
            <Input
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              placeholder="PNC-001"
            />
          </Field>
          <Field label="Unit">
            <Input
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="pc, box, kg…"
            />
          </Field>
          <Field label="Category">
            <Select
              value={form.categoryId}
              onChange={(e) =>
                setForm({ ...form, categoryId: e.target.value })
              }
            >
              <option value="">Uncategorised</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select
              value={form.isActive ? "1" : "0"}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.value === "1" })
              }
            >
              <option value="1">Active</option>
              <option value="0">Archived</option>
            </Select>
          </Field>
          <Field label="Sale price">
            <Input
              type="number"
              step="0.01"
              value={form.salePrice}
              onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
              placeholder="0.00"
            />
          </Field>
          <Field label="Cost price" hint="optional">
            <Input
              type="number"
              step="0.01"
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
              placeholder="0.00"
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!confirming}
        onClose={() => setConfirming(null)}
        size="sm"
        title="Remove product"
        description={
          confirming
            ? `Permanently remove “${confirming.name}” from the catalog?`
            : ""
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => confirming && remove(confirming)}
              icon={<TrashIcon size={14} />}
            >
              Remove
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-muted">
          This action cannot be undone. Linked orders will still show the
          product by name.
        </p>
      </Modal>
    </PageShell>
  );
}
