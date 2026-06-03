"use client";

import {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  forwardRef,
} from "react";
import { motion } from "framer-motion";
import { accents, type AccentKey } from "@/lib/accents";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "soft" | "accent";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  iconRight?: ReactNode;
  accent?: AccentKey;
};

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  iconRight,
  className = "",
  accent: accentKey = "brand",
  children,
  ...rest
}: ButtonProps) {
  const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
    sm: "h-7 px-2.5 text-[12px] gap-1.5 rounded-md",
    md: "h-9 px-3.5 text-[13px] gap-2 rounded-lg",
    lg: "h-11 px-5 text-[14px] gap-2 rounded-lg",
  };
  const a = accents[accentKey];
  const styles: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
      "bg-ink text-white shadow-sm hover:bg-text disabled:bg-subtle disabled:cursor-not-allowed",
    accent: `${a.bg} ${a.textOn} shadow-sm hover:opacity-92 disabled:opacity-60`,
    secondary:
      "border border-border bg-surface text-text shadow-xs hover:border-faint hover:bg-surface-2",
    soft: `${a.bgSoft} ${a.text} hover:opacity-90`,
    ghost: "text-muted hover:bg-surface-2 hover:text-ink",
    danger:
      "border border-danger/30 bg-surface text-danger shadow-xs hover:bg-danger hover:text-white",
  };
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12 }}
      {...(rest as React.ComponentProps<typeof motion.button>)}
      className={`inline-flex items-center justify-center font-medium tracking-tight transition-colors ${sizes[size]} ${styles[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
      {iconRight && <span className="shrink-0">{iconRight}</span>}
    </motion.button>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ className = "", icon, ...rest }, ref) {
    return (
      <div className="relative w-full">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-subtle">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          {...rest}
          className={`h-9 w-full rounded-lg border border-border bg-surface text-[13px] text-ink placeholder:text-subtle transition-all hover:border-faint focus:border-brand focus:bg-white focus:shadow-[0_0_0_3px_rgba(97,87,235,0.12)] focus:outline-none ${
            icon ? "pl-9 pr-3" : "px-3"
          } ${className}`}
        />
      </div>
    );
  },
);

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className = "", children, ...rest }, ref) {
  return (
    <div className="relative w-full">
      <select
        ref={ref}
        {...rest}
        className={`h-9 w-full appearance-none rounded-lg border border-border bg-surface px-3 pr-9 text-[13px] text-ink transition-all hover:border-faint focus:border-brand focus:shadow-[0_0_0_3px_rgba(97,87,235,0.12)] focus:outline-none ${className}`}
      >
        {children}
      </select>
      <svg
        aria-hidden
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-subtle"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = "", ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      {...rest}
      className={`w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-ink placeholder:text-subtle transition-all hover:border-faint focus:border-brand focus:shadow-[0_0_0_3px_rgba(97,87,235,0.12)] focus:outline-none ${className}`}
    />
  );
});

export function Label({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted"
    >
      {children}
    </label>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-[11.5px] text-subtle">{hint}</p>}
    </div>
  );
}

export function Card({
  children,
  className = "",
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface shadow-sm ${
        interactive ? "transition-shadow hover:shadow-md" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  accent: accentKey = "brand",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  accent?: AccentKey;
}) {
  const a = accents[accentKey];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-3 py-20 text-center"
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${a.bgSoft} ${a.text}`}
      >
        {icon ?? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </div>
      <h3 className="mt-1 text-[15px] font-medium tracking-tight text-ink">
        {title}
      </h3>
      {description && (
        <p className="max-w-sm text-[13px] leading-relaxed text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  );
}

type BadgeTone =
  | "neutral"
  | "brand"
  | "violet"
  | "amber"
  | "emerald"
  | "rose"
  | "sky"
  | "cyan"
  | "coral"
  | "danger";

export function Badge({
  children,
  tone = "neutral",
  dot = false,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
}) {
  const tones: Record<BadgeTone, { bg: string; text: string; dot: string }> = {
    neutral: { bg: "bg-surface-2", text: "text-muted", dot: "bg-subtle" },
    brand: { bg: "bg-brand-soft", text: "text-brand", dot: "bg-brand" },
    violet: { bg: "bg-violet-soft", text: "text-violet", dot: "bg-violet" },
    amber: { bg: "bg-amber-soft", text: "text-amber", dot: "bg-amber" },
    emerald: { bg: "bg-emerald-soft", text: "text-emerald", dot: "bg-emerald" },
    rose: { bg: "bg-rose-soft", text: "text-rose", dot: "bg-rose" },
    sky: { bg: "bg-sky-soft", text: "text-sky", dot: "bg-sky" },
    cyan: { bg: "bg-cyan-soft", text: "text-cyan", dot: "bg-cyan" },
    coral: { bg: "bg-coral-soft", text: "text-coral", dot: "bg-coral" },
    danger: { bg: "bg-danger-soft", text: "text-danger", dot: "bg-danger" },
  };
  const t = tones[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${t.bg} ${t.text}`}
    >
      {dot && <span className={`h-1 w-1 rounded-full ${t.dot}`} />}
      {children}
    </span>
  );
}

export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="border-border" />;
  return (
    <div className="flex items-center gap-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-subtle">
      <span className="h-px flex-1 bg-border" />
      <span>{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 items-center rounded border border-border bg-surface px-1.5 font-mono text-[10.5px] text-muted shadow-xs">
      {children}
    </kbd>
  );
}
