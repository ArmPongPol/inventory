"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api, ApiClientError } from "@/lib/api";
import type { Category, CreateCategoryDto } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import {
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
  CategoriesIcon,
  EditIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/icons";
import {
  PageShell,
  staggerContainer,
  staggerItem,
} from "@/components/page-shell";
import { accents, type AccentKey } from "@/lib/accents";

const ACCENT = "cyan" as const;
const SUB_PALETTE: AccentKey[] = ["cyan", "sky", "violet", "rose", "amber", "emerald"];

export default function CategoriesPage() {
  const toast = useToast();
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", parentId: "" });
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState<Category | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<Category[]>("/categories");
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const tree = useMemo(() => {
    const byId = new Map<number, Category & { children: Category[] }>();
    items.forEach((c) => byId.set(c.id, { ...c, children: [] as Category[] }));
    const roots: (Category & { children: Category[] })[] = [];
    byId.forEach((node) => {
      if (node.parentId && byId.has(node.parentId)) {
        byId.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }, [items]);

  const submit = async () => {
    if (!form.name.trim()) {
      toast.show("Name is required.", "error");
      return;
    }
    setSaving(true);
    const dto: CreateCategoryDto = {
      name: form.name.trim(),
      ...(form.parentId ? { parentId: Number(form.parentId) } : {}),
    };
    try {
      if (editing) {
        await api.patch(`/categories/${editing.id}`, dto);
        toast.show("Category updated.");
      } else {
        await api.post("/categories", dto);
        toast.show("Category added.");
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

  const remove = async (c: Category) => {
    try {
      await api.delete(`/categories/${c.id}`);
      toast.show("Removed.");
      setConfirming(null);
      await load();
    } catch (err) {
      toast.show(
        err instanceof ApiClientError ? err.message : "Delete failed.",
        "error",
      );
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", parentId: "" });
    setOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, parentId: c.parentId?.toString() ?? "" });
    setOpen(true);
  };

  return (
    <PageShell>
      <PageHeader
        accent={ACCENT}
        eyebrow="catalog"
        title="Categories"
        description="How the shop is organised — broad shelves and the smaller boxes inside them."
        actions={
          <Button
            variant="accent"
            accent={ACCENT}
            onClick={openNew}
            icon={<PlusIcon size={14} />}
          >
            New category
          </Button>
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
        ) : tree.length === 0 ? (
          <EmptyState
            accent={ACCENT}
            icon={<CategoriesIcon size={22} />}
            title="No categories yet"
            description="Start with a broad heading like “Stationery” or “Kitchen”."
          />
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="divide-y divide-border-soft"
          >
            {tree.map((root, i) => (
              <motion.div key={root.id} variants={staggerItem}>
                <CategoryRow
                  node={root}
                  depth={0}
                  accent={SUB_PALETTE[i % SUB_PALETTE.length]}
                  onEdit={openEdit}
                  onRemove={(c) => setConfirming(c)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => (saving ? null : setOpen(false))}
        size="sm"
        title={editing ? "Edit category" : "New category"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
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
        <div className="flex flex-col gap-5">
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Kitchen"
            />
          </Field>
          <Field label="Parent">
            <Select
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
            >
              <option value="">— No parent —</option>
              {items
                .filter((c) => c.id !== editing?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!confirming}
        onClose={() => setConfirming(null)}
        size="sm"
        title="Remove category"
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
          Remove <span className="text-ink">{confirming?.name}</span>? Products
          using this category will become uncategorised.
        </p>
      </Modal>
    </PageShell>
  );
}

function CategoryRow({
  node,
  depth,
  accent: accentKey,
  onEdit,
  onRemove,
}: {
  node: Category & { children: Category[] };
  depth: number;
  accent: AccentKey;
  onEdit: (c: Category) => void;
  onRemove: (c: Category) => void;
}) {
  const a = accents[accentKey];
  return (
    <div>
      <div
        className="group flex items-center justify-between gap-4 px-6 py-3 transition-colors hover:bg-surface-2/60"
        style={{ paddingLeft: `${1.5 + depth * 1.5}rem` }}
      >
        <div className="flex items-center gap-3">
          {depth > 0 && (
            <span className="flex h-4 w-4 items-center justify-center text-faint">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M6 4v10a4 4 0 0 0 4 4h8" />
              </svg>
            </span>
          )}
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${a.bgSoft} ${a.text}`}
          >
            <CategoriesIcon size={13} />
          </div>
          <span className="text-[13px] font-medium text-ink">{node.name}</span>
          {node.children.length > 0 && (
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-subtle">
              {node.children.length} sub
            </span>
          )}
        </div>
        <div className="flex gap-1 opacity-60 transition-opacity group-hover:opacity-100">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(node)}
            icon={<EditIcon size={13} />}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(node)}
            className="text-rose hover:bg-rose-soft"
            icon={<TrashIcon size={13} />}
          >
            Remove
          </Button>
        </div>
      </div>
      {node.children.map((child, idx) => (
        <CategoryRow
          key={child.id}
          node={child as Category & { children: Category[] }}
          depth={depth + 1}
          accent={SUB_PALETTE[(idx + 1) % SUB_PALETTE.length]}
          onEdit={onEdit}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
