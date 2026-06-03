"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { motion } from "framer-motion";
import { BellIcon, ChevronRightIcon, SearchIcon } from "@/components/icons";

const labels: Record<string, string> = {
  "": "Overview",
  products: "Products",
  inventory: "Stock",
  categories: "Categories",
  sales: "Sales",
  customers: "Customers",
  suppliers: "Suppliers",
};

export function TopBar() {
  const pathname = usePathname() ?? "/";
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = [
    { href: "/", label: "Merchant" },
    ...segments.map((seg, i) => ({
      href: "/" + segments.slice(0, i + 1).join("/"),
      label: labels[seg] ?? seg,
    })),
  ];

  const now = new Date();
  const day = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  }).format(now);

  return (
    <motion.div
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
      className="sticky top-0 z-30 flex items-center justify-between gap-6 border-b border-border bg-surface/70 px-8 py-3 backdrop-blur-xl"
    >
      <nav className="flex items-center gap-1.5 text-[12.5px] text-muted">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <Fragment key={c.href}>
              {i > 0 && (
                <span className="text-faint">
                  <ChevronRightIcon size={13} />
                </span>
              )}
              {last ? (
                <span className="font-medium text-ink">{c.label}</span>
              ) : (
                <Link
                  href={c.href}
                  className="transition-colors hover:text-ink"
                >
                  {c.label}
                </Link>
              )}
            </Fragment>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-lg border border-border bg-surface-2/60 px-3 py-1.5 text-[12px] text-muted lg:flex">
          <SearchIcon size={13} />
          <span>Search…</span>
          <span className="ml-3 font-mono text-[10.5px] text-subtle">⌘K</span>
        </div>
        <span className="hidden text-[11.5px] text-muted xl:inline">{day}</span>
        <button
          type="button"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          aria-label="Notifications"
        >
          <BellIcon size={15} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-brand via-violet to-rose text-[12px] font-semibold text-white shadow-sm">
          PJ
        </div>
      </div>
    </motion.div>
  );
}
