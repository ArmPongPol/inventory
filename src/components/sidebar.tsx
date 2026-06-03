"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  CategoriesIcon,
  CustomersIcon,
  OverviewIcon,
  ProductsIcon,
  SalesIcon,
  StockIcon,
  SuppliersIcon,
  SparkleIcon,
} from "@/components/icons";
import { accents, type AccentKey } from "@/lib/accents";

type Item = {
  href: string;
  label: string;
  icon: ReactNode;
  accent: AccentKey;
};

type Group = {
  title: string | null;
  items: Item[];
};

const groups: Group[] = [
  {
    title: null,
    items: [
      {
        href: "/",
        label: "Overview",
        icon: <OverviewIcon />,
        accent: "brand",
      },
    ],
  },
  {
    title: "Inventory",
    items: [
      {
        href: "/products",
        label: "Products",
        icon: <ProductsIcon />,
        accent: "violet",
      },
      {
        href: "/inventory",
        label: "Stock",
        icon: <StockIcon />,
        accent: "amber",
      },
      {
        href: "/categories",
        label: "Categories",
        icon: <CategoriesIcon />,
        accent: "cyan",
      },
    ],
  },
  {
    title: "Trade",
    items: [
      {
        href: "/sales",
        label: "Sales",
        icon: <SalesIcon />,
        accent: "emerald",
      },
      {
        href: "/customers",
        label: "Customers",
        icon: <CustomersIcon />,
        accent: "rose",
      },
      {
        href: "/suppliers",
        label: "Suppliers",
        icon: <SuppliersIcon />,
        accent: "sky",
      },
    ],
  },
];

function isActive(pathname: string | null, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname?.startsWith(href + "/") || false;
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-border bg-surface/80 px-4 py-6 backdrop-blur-xl">
      {/* Brand */}
      <Link href="/" className="group flex items-center gap-3 px-2 pb-1">
        <motion.span
          initial={{ rotate: -8, scale: 0.9 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
          className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-brand via-violet to-rose text-white shadow-md"
        >
          <SparkleIcon size={18} />
          <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald ring-2 ring-surface" />
        </motion.span>
        <span>
          <span className="block text-[14px] font-semibold tracking-tight text-ink">
            Merchant
          </span>
          <span className="block text-[10.5px] font-medium uppercase tracking-[0.18em] text-muted">
            ERP · Quiet
          </span>
        </span>
      </Link>

      {/* Nav */}
      <nav className="mt-8 flex flex-1 flex-col gap-5">
        {groups.map((g, gi) => (
          <div key={gi} className="flex flex-col gap-0.5">
            {g.title && (
              <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">
                {g.title}
              </div>
            )}
            {g.items.map((item) => {
              const active = isActive(pathname, item.href);
              const a = accents[item.accent];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative block"
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active-pill"
                      className={`absolute inset-0 rounded-lg ${a.bgSoft}`}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 32,
                      }}
                    />
                  )}
                  <span
                    className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                      active
                        ? `${a.text} font-medium`
                        : "text-text hover:bg-surface-2/70 hover:text-ink"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center transition-colors ${
                        active ? a.text : "text-muted"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="tracking-tight">{item.label}</span>
                    {active && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 22,
                        }}
                        className={`ml-auto h-1.5 w-1.5 rounded-full ${a.bg}`}
                      />
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer card — colorful gradient */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-6 overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-sm"
      >
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-linear-to-br from-violet/30 via-rose/20 to-amber/30 blur-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted">
              Connected
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald">
              <motion.span
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="h-1.5 w-1.5 rounded-full bg-emerald"
              />
              live
            </span>
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
            All systems operational. Backend healthy.
          </p>
        </div>
      </motion.div>
    </aside>
  );
}
