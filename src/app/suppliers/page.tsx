"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, ApiClientError } from "@/lib/api";
import type { Supplier, CreateSupplierDto } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import {
  EditIcon,
  PlusIcon,
  SuppliersIcon,
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
  contactName: "",
  phone: "",
  address: "",
  paymentTerms: "",
  isActive: true,
};

const ACCENT = "sky" as const;

export default function SuppliersPage() {
  const toast = useToast();
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState<Supplier | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<Supplier[]>("/suppliers");
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

  const submit = async () => {
    if (!form.name.trim()) {
      toast.show("Name is required.", "error");
      return;
    }
    setSaving(true);
    const dto: CreateSupplierDto = {
      name: form.name.trim(),
      ...(form.contactName.trim()
        ? { contactName: form.contactName.trim() }
        : {}),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      ...(form.address.trim() ? { address: form.address.trim() } : {}),
      ...(form.paymentTerms.trim()
        ? { paymentTerms: form.paymentTerms.trim() }
        : {}),
    };
    try {
      if (editing) {
        await api.patch(`/suppliers/${editing.id}`, dto);
        toast.show("Supplier updated.");
      } else {
        await api.post("/suppliers", dto);
        toast.show("Supplier added.");
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

  const remove = async (s: Supplier) => {
    try {
      await api.delete(`/suppliers/${s.id}`);
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

  const a = accents[ACCENT];

  return (
    <PageShell>
      <PageHeader
        accent={ACCENT}
        eyebrow="people"
        title="Suppliers"
        description="The makers and traders that keep the shelves full."
        actions={
          <Button
            variant="accent"
            accent={ACCENT}
            onClick={() => {
              setEditing(null);
              setForm(empty);
              setOpen(true);
            }}
            icon={<PlusIcon size={14} />}
          >
            New supplier
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
        ) : items.length === 0 ? (
          <EmptyState
            accent={ACCENT}
            icon={<SuppliersIcon size={22} />}
            title="No suppliers yet"
          />
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border-soft bg-surface-2/40 text-left text-[10.5px] font-semibold uppercase tracking-[0.16em] text-subtle">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Terms</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <motion.tbody
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {items.map((s) => (
                <motion.tr
                  key={s.id}
                  variants={staggerItem}
                  className="group border-b border-border-soft transition-colors last:border-0 hover:bg-surface-2/60"
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.bgSoft} ${a.text}`}
                      >
                        <SuppliersIcon size={14} />
                      </div>
                      <span className="font-medium text-ink">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-muted">
                    {s.contactName ?? "—"}
                  </td>
                  <td className="px-6 py-3.5 text-muted">{s.phone ?? "—"}</td>
                  <td className="px-6 py-3.5">
                    {s.paymentTerms ? (
                      <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-muted">
                        {s.paymentTerms}
                      </span>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    {s.isActive ? (
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
                        onClick={() => {
                          setEditing(s);
                          setForm({
                            name: s.name,
                            contactName: s.contactName ?? "",
                            phone: s.phone ?? "",
                            address: s.address ?? "",
                            paymentTerms: s.paymentTerms ?? "",
                            isActive: s.isActive,
                          });
                          setOpen(true);
                        }}
                        icon={<EditIcon size={13} />}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirming(s)}
                        className="text-rose hover:bg-rose-soft"
                        icon={<TrashIcon size={13} />}
                      >
                        Remove
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => (saving ? null : setOpen(false))}
        title={editing ? "Edit supplier" : "New supplier"}
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
          <div className="sm:col-span-2">
            <Field label="Name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Contact person">
            <Input
              value={form.contactName}
              onChange={(e) =>
                setForm({ ...form, contactName: e.target.value })
              }
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="Payment terms">
            <Input
              value={form.paymentTerms}
              onChange={(e) =>
                setForm({ ...form, paymentTerms: e.target.value })
              }
              placeholder="NET30, COD…"
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
          <div className="sm:col-span-2">
            <Field label="Address">
              <Textarea
                rows={3}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Field>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!confirming}
        onClose={() => setConfirming(null)}
        size="sm"
        title="Remove supplier"
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
          Remove <span className="text-ink">{confirming?.name}</span>? Past
          purchase orders will be kept.
        </p>
      </Modal>
    </PageShell>
  );
}
