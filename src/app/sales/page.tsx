"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api, ApiClientError } from "@/lib/api";
import type {
  Customer,
  Product,
  SaleOrder,
  CreateSaleOrderDto,
  CreateSoItemDto,
} from "@/lib/types";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  toNumber,
} from "@/lib/format";
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
import { PlusIcon, SalesIcon } from "@/components/icons";
import {
  PageShell,
  staggerContainer,
  staggerItem,
} from "@/components/page-shell";

type Cart = { productId: number; quantity: number; unitPrice: number };

const PAYMENT_METHODS = ["CASH", "CARD", "PROMPTPAY", "CREDIT"];
const ACCENT = "emerald" as const;

export default function SalesPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<SaleOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState<SaleOrder | null>(null);

  const [cart, setCart] = useState<Cart[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [discount, setDiscount] = useState<string>("0");
  const [tax, setTax] = useState<string>("0");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [productPick, setProductPick] = useState<string>("");

  const load = async () => {
    setLoading(true);
    try {
      const [o, p, c] = await Promise.all([
        api.get<SaleOrder[]>("/sale-orders"),
        api.get<Product[]>("/products"),
        api.get<Customer[]>("/customers"),
      ]);
      setOrders(o);
      setProducts(p);
      setCustomers(c);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Unable to load sales.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setCart([]);
    setCustomerId("");
    setDiscount("0");
    setTax("0");
    setPaymentMethod("CASH");
    setProductPick("");
  };

  const addToCart = (id: number) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === id);
      if (existing) {
        return prev.map((c) =>
          c.productId === id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [
        ...prev,
        {
          productId: id,
          quantity: 1,
          unitPrice: toNumber(product.salePrice),
        },
      ];
    });
    setProductPick("");
  };

  const cartSubtotal = useMemo(
    () =>
      cart.reduce(
        (sum, c) => sum + toNumber(c.quantity) * toNumber(c.unitPrice),
        0,
      ),
    [cart],
  );
  const cartDiscount = toNumber(discount);
  const cartTax = toNumber(tax);
  const cartTotal = Math.max(0, cartSubtotal - cartDiscount + cartTax);

  const submit = async () => {
    if (cart.length === 0) {
      toast.show("Add at least one item.", "error");
      return;
    }
    setSaving(true);
    try {
      const orderDto: CreateSaleOrderDto = {
        ...(customerId ? { customerId: Number(customerId) } : {}),
        discount: cartDiscount,
        tax: cartTax,
        paymentMethod,
        status: "OPEN",
      };
      const order = await api.post<SaleOrder>("/sale-orders", orderDto);

      for (const line of cart) {
        const item: CreateSoItemDto = {
          orderId: order.id,
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discount: 0,
        };
        await api.post("/so-items", item);
      }

      await api.patch<SaleOrder>(`/sale-orders/${order.id}`, {
        status: "CLOSED",
      });

      toast.show(`Order #${order.id} closed · ${formatCurrency(cartTotal)}`);
      setOpen(false);
      resetForm();
      await load();
    } catch (err) {
      toast.show(
        err instanceof ApiClientError ? err.message : "Could not close order.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const filtered = orders.filter((o) => {
    if (filter === "all") return true;
    return (o.status ?? "").toUpperCase() === filter.toUpperCase();
  });

  const sortedFiltered = useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime(),
      ),
    [filtered],
  );

  const totals = useMemo(() => {
    const closed = orders.filter(
      (o) => (o.status ?? "").toUpperCase() === "CLOSED",
    );
    const revenue = closed.reduce(
      (sum, o) => sum + toNumber(o.totalAmount),
      0,
    );
    const avg = closed.length ? revenue / closed.length : 0;
    return { revenue, avg, closed: closed.length };
  }, [orders]);

  return (
    <PageShell>
      <PageHeader
        accent={ACCENT}
        eyebrow="trade"
        title="Sales"
        description="Each transaction the shop closes — who bought, what they took, and how they paid."
        actions={
          <>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-44"
            >
              <option value="all">All orders</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
            </Select>
            <Button
              variant="accent"
              accent={ACCENT}
              onClick={() => {
                resetForm();
                setOpen(true);
              }}
              icon={<PlusIcon size={14} />}
            >
              New sale
            </Button>
          </>
        }
        meta={
          !loading && (
            <div className="flex items-center gap-4 text-[12px] text-muted">
              <span className="rounded-full bg-emerald-soft px-2.5 py-1 font-medium text-emerald">
                {formatCurrency(totals.revenue)}
              </span>
              <span>
                <span className="font-medium text-ink">{totals.closed}</span>{" "}
                closed
              </span>
              <span className="h-3 w-px bg-border" />
              <span>
                avg{" "}
                <span className="font-medium text-ink">
                  {formatCurrency(totals.avg)}
                </span>
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
        ) : sortedFiltered.length === 0 ? (
          <EmptyState
            accent={ACCENT}
            icon={<SalesIcon size={22} />}
            title="No sales yet"
            description="Press “New sale” to ring up the first order."
            action={
              <Button
                variant="accent"
                accent={ACCENT}
                onClick={() => setOpen(true)}
                icon={<PlusIcon size={14} />}
              >
                New sale
              </Button>
            }
          />
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border-soft bg-surface-2/40 text-left text-[10.5px] font-semibold uppercase tracking-[0.16em] text-subtle">
                <th className="px-6 py-3">Order</th>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3 text-right">Items</th>
                <th className="px-6 py-3">Payment</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Total</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <motion.tbody
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {sortedFiltered.map((o) => (
                <motion.tr
                  key={o.id}
                  variants={staggerItem}
                  className="group border-b border-border-soft transition-colors last:border-0 hover:bg-surface-2/60"
                >
                  <td className="px-6 py-3.5 font-mono text-[12px] text-ink">
                    #{String(o.id).padStart(4, "0")}
                  </td>
                  <td className="px-6 py-3.5 text-muted">
                    {formatDateTime(o.orderTime)}
                  </td>
                  <td className="px-6 py-3.5 text-muted">
                    {o.customer?.name ?? (
                      <span className="text-faint">walk-in</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right text-muted">
                    {o.items?.length ?? 0}
                  </td>
                  <td className="px-6 py-3.5">
                    {o.paymentMethod ? (
                      <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-muted">
                        {o.paymentMethod}
                      </span>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-6 py-3.5 text-right font-medium text-ink">
                    {formatCurrency(o.totalAmount ?? cartTotalFor(o))}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setViewing(o)}
                    >
                      Open
                    </Button>
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
        title="New sale"
        description="Add items, pick a customer if you wish, then close the sale."
        size="lg"
        footer={
          <>
            <div className="mr-auto text-[13px] text-muted">
              Total{" "}
              <span className="ml-2 text-[20px] font-semibold tracking-tight text-ink">
                {formatCurrency(cartTotal)}
              </span>
            </div>
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
              {saving ? "Closing…" : "Close sale"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Field label="Add product">
              <Select
                value={productPick}
                onChange={(e) => {
                  if (e.target.value) addToCart(Number(e.target.value));
                }}
              >
                <option value="">Choose a product…</option>
                {products
                  .filter((p) => p.isActive)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatCurrency(toNumber(p.salePrice))}
                    </option>
                  ))}
              </Select>
            </Field>

            <div className="mt-5 overflow-hidden rounded-lg border border-border bg-surface">
              {cart.length === 0 ? (
                <div className="px-4 py-10 text-center text-[13px] text-muted">
                  Cart is empty.
                </div>
              ) : (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border-soft bg-surface-2/50 text-left text-[10.5px] font-semibold uppercase tracking-[0.16em] text-subtle">
                      <th className="px-4 py-2.5">Item</th>
                      <th className="px-4 py-2.5 text-right">Qty</th>
                      <th className="px-4 py-2.5 text-right">Price</th>
                      <th className="px-4 py-2.5 text-right">Line</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <motion.tbody
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                  >
                    {cart.map((line) => {
                      const product = products.find(
                        (p) => p.id === line.productId,
                      );
                      const subtotal =
                        toNumber(line.quantity) * toNumber(line.unitPrice);
                      return (
                        <motion.tr
                          key={line.productId}
                          variants={staggerItem}
                          className="border-b border-border-soft last:border-0"
                        >
                          <td className="px-4 py-2.5 text-ink">
                            {product?.name ?? `#${line.productId}`}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <Input
                              type="number"
                              step="1"
                              min="0"
                              value={line.quantity}
                              onChange={(e) =>
                                setCart((prev) =>
                                  prev.map((c) =>
                                    c.productId === line.productId
                                      ? {
                                          ...c,
                                          quantity: Math.max(
                                            0,
                                            Number(e.target.value),
                                          ),
                                        }
                                      : c,
                                  ),
                                )
                              }
                              className="w-20 text-right"
                            />
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <Input
                              type="number"
                              step="0.01"
                              value={line.unitPrice}
                              onChange={(e) =>
                                setCart((prev) =>
                                  prev.map((c) =>
                                    c.productId === line.productId
                                      ? {
                                          ...c,
                                          unitPrice: Number(e.target.value),
                                        }
                                      : c,
                                  ),
                                )
                              }
                              className="w-24 text-right"
                            />
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium text-ink">
                            {formatCurrency(subtotal)}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setCart((prev) =>
                                  prev.filter(
                                    (c) => c.productId !== line.productId,
                                  ),
                                )
                              }
                              className="text-[11.5px] text-rose hover:underline"
                            >
                              remove
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </motion.tbody>
                </table>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <Field label="Customer">
              <Select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">Walk-in</option>
                {customers
                  .filter((c) => c.isActive && c.name)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Payment">
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Discount">
              <Input
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </Field>
            <Field label="Tax">
              <Input
                type="number"
                step="0.01"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
              />
            </Field>

            <div className="rounded-lg border border-border bg-surface-2/40 p-4 text-[13px]">
              <Row label="Subtotal" value={formatCurrency(cartSubtotal)} />
              <Row
                label="Discount"
                value={`− ${formatCurrency(cartDiscount)}`}
              />
              <Row label="Tax" value={`+ ${formatCurrency(cartTax)}`} />
              <div className="my-3 border-t border-border" />
              <Row label="Total" value={formatCurrency(cartTotal)} emphasis />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? `Order #${String(viewing.id).padStart(4, "0")}` : ""}
        description={viewing ? formatDateTime(viewing.orderTime) : ""}
        size="md"
      >
        {viewing && (
          <div className="text-[13px]">
            <div className="flex flex-wrap gap-x-8 gap-y-3 border-b border-border pb-4">
              <Meta
                label="Customer"
                value={viewing.customer?.name ?? "Walk-in"}
              />
              <Meta label="Payment" value={viewing.paymentMethod ?? "—"} />
              <Meta
                label="Status"
                value={<StatusBadge status={viewing.status} />}
              />
            </div>
            <div className="mt-4">
              <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-subtle">
                Items
              </div>
              {viewing.items && viewing.items.length > 0 ? (
                <table className="w-full">
                  <tbody>
                    {viewing.items.map((it) => {
                      const product = products.find(
                        (p) => p.id === it.productId,
                      );
                      return (
                        <tr
                          key={it.id}
                          className="border-b border-border-soft last:border-0"
                        >
                          <td className="py-2 text-ink">
                            {product?.name ?? `Product #${it.productId}`}
                          </td>
                          <td className="py-2 text-right text-muted">
                            {formatNumber(it.quantity, 2)} ×{" "}
                            {formatCurrency(toNumber(it.unitPrice))}
                          </td>
                          <td className="py-2 pl-4 text-right text-ink">
                            {formatCurrency(toNumber(it.subtotal))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted">No items recorded.</p>
              )}
            </div>
            <div className="mt-6 border-t border-border pt-4">
              <Row
                label="Subtotal"
                value={formatCurrency(toNumber(viewing.subtotal))}
              />
              <Row
                label="Discount"
                value={`− ${formatCurrency(toNumber(viewing.discount))}`}
              />
              <Row
                label="Tax"
                value={`+ ${formatCurrency(toNumber(viewing.tax))}`}
              />
              <div className="my-2 border-t border-border" />
              <Row
                label="Total"
                value={formatCurrency(viewing.totalAmount)}
                emphasis
              />
            </div>
          </div>
        )}
      </Modal>
    </PageShell>
  );
}

function cartTotalFor(order: SaleOrder) {
  if (!order.items) return 0;
  return order.items.reduce((sum, i) => sum + toNumber(i.subtotal), 0);
}

function Row({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1 text-[13px]">
      <span className="text-muted">{label}</span>
      <span
        className={
          emphasis
            ? "text-[18px] font-semibold tracking-tight text-ink"
            : "text-ink"
        }
      >
        {value}
      </span>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-subtle">
        {label}
      </div>
      <div className="mt-1 text-ink">{value}</div>
    </div>
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
