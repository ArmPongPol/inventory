"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { accents, type AccentKey } from "@/lib/accents";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  accent?: AccentKey;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  accent = "brand",
}: Props) {
  const a = accents[accent];
  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
      className="flex flex-wrap items-end justify-between gap-6 pb-8"
    >
      <div className="max-w-2xl">
        {eyebrow && (
          <div
            className={`mb-3 inline-flex items-center gap-2 rounded-full ${a.bgSoft} px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] ${a.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${a.bg}`} />
            {eyebrow}
          </div>
        )}
        <h1 className="text-[36px] font-semibold leading-[1.05] tracking-tight text-ink">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-[14px] leading-relaxed text-muted">
            {description}
          </p>
        )}
        {meta && <div className="mt-4">{meta}</div>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </motion.header>
  );
}
