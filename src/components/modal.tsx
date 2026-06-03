"use client";

import { ReactNode, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CloseIcon } from "@/components/icons";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-6 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full ${widths[size]} overflow-hidden rounded-2xl border border-border bg-surface shadow-lg`}
          >
            {/* Decorative gradient stripe */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-brand via-violet to-rose" />

            <div className="flex items-start justify-between gap-6 border-b border-border-soft px-7 pt-6 pb-5">
              <div>
                <h2 className="text-[19px] font-semibold leading-tight tracking-tight text-ink">
                  {title}
                </h2>
                {description && (
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-subtle transition-colors hover:bg-surface-2 hover:text-ink"
                aria-label="Close"
              >
                <CloseIcon size={16} />
              </button>
            </div>
            <div className="px-7 py-6">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-border-soft bg-surface-2/50 px-7 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
