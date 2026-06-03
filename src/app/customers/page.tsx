"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, ApiClientError } from "@/lib/api";
import type { Customer, CreateCustomerDto } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/format";
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
  CustomersIcon,
  EditIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/icons";
import {
  PageShell,
  staggerContainer,
  staggerItem,
} from "@/components/page-shell";
import { accents } from "@/lib/accents";

const empty = {
  name: "",
  phone: "",
  email: "",
  points: "0",
  memberSince: "",
  isActive: true,
};

const ACCENT = "rose" as const;
const AVATAR_PALETTE = ["rose", "violet", "amber", "emerald", "sky", "cyan"] as const;

export default function CustomersPage() {
  const toast = useToast();
  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState<Customer | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<Customer[]>("/customers");
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

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };
  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      points: String(c.points ?? 0),
      memberSince: c.memberSince ?? "",
      isActive: c.isActive,
    });
    setOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    const dto: CreateCustomerDto = {
      ...(form.name.trim() ? { name: form.name.trim() } : {}),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      // ...(form.points ? { points: Number(form.points) } : {}),
      ...(form.memberSince ? { memberSince: form.memberSince } : {}),
    };
    try {
      if (editing) {
        await api.patch(`/customers/${editing.id}`, dto);
        toast.show("Customer updated.");
      } else {
        await api.post("/customers", dto);
        toast.show("Customer added.");
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

  const remove = async (c: Customer) => {
    try {
      await api.delete(`/customers/${c.id}`);
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

  const filtered = items.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.name ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.phone ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <PageShell>
      <PageHeader
        accent={ACCENT}
        eyebrow="people"
        title="Customers"
        description="The names behind the orders — points earned, time joined, ways to reach them."
        actions={
          <>
            <Input
              icon={<SearchIcon size={14} />}
              placeholder="Search customers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56"
            />
            <Button
              variant="accent"
              accent={ACCENT}
              onClick={openNew}
              icon={<PlusIcon size={14} />}
            >
              New customer
            </Button>
          </>
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
            icon={<CustomersIcon size={22} />}
            title="No customers yet"
            description="Walk-in shoppers don't need an account — add one when someone joins the programme."
          />
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border-soft bg-surface-2/40 text-left text-[10.5px] font-semibold uppercase tracking-[0.16em] text-subtle">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3 text-right">Points</th>
                <th className="px-6 py-3">Member since</th>
                {/* <th className="px-6 py-3">Status</th> */}
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <motion.tbody
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {filtered.map((c, i) => {
                const paletteKey =
                  AVATAR_PALETTE[i % AVATAR_PALETTE.length];
                return (
                  <motion.tr
                    key={c.id}
                    variants={staggerItem}
                    className="group border-b border-border-soft transition-colors last:border-0 hover:bg-surface-2/60"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={c.name ?? "?"}
                          accent={paletteKey}
                        />
                        <span className="font-medium text-ink">
                          {c.name ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-muted">{c.phone ?? "—"}</td>
                    <td className="px-6 py-3.5 text-muted">{c.email ?? "—"}</td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-soft px-2.5 py-0.5 text-[11.5px] font-medium text-amber">
                        {formatNumber(c.points)} pts
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-muted">
                      {formatDate(c.memberSince)}
                    </td>
                    <td className="px-6 py-3.5">
                      {c.isActive ? (
                        <Badge tone="emerald" dot>
                          active
                        </Badge>
                      ) : (
                        <Badge>inactive</Badge>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(c)}
                          icon={<EditIcon size={13} />}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirming(c)}
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
        title={editing ? "Edit customer" : "New customer"}
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Points">
            <Input
              type="number"
              value={form.points}
              onChange={(e) => setForm({ ...form, points: e.target.value })}
            />
          </Field>
          <Field label="Member since">
            <Input
              type="date"
              value={form.memberSince}
              onChange={(e) =>
                setForm({ ...form, memberSince: e.target.value })
              }
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.isActive ? "1" : "0"}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.value === "1" })
              }
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </Select>
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!confirming}
        onClose={() => setConfirming(null)}
        size="sm"
        title="Remove customer"
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
          Remove{" "}
          <span className="text-ink">{confirming?.name ?? "this customer"}</span>?
          Past orders will be kept.
        </p>
      </Modal>
    </PageShell>
  );
}

function Avatar({
  name,
  accent: accentKey,
}: {
  name: string;
  accent: (typeof AVATAR_PALETTE)[number];
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  const a = accents[accentKey];
  return (
    <span
      className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold ${a.bgSoft} ${a.text}`}
    >
      {initials || "?"}
    </span>
  );
}
