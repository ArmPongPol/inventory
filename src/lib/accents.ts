export type AccentKey =
  | "brand"
  | "violet"
  | "amber"
  | "emerald"
  | "rose"
  | "sky"
  | "cyan"
  | "coral";

export type AccentTokens = {
  bg: string;
  bgSoft: string;
  text: string;
  textOn: string;
  border: string;
  ring: string;
  gradient: string;
  hex: string;
};

export const accents: Record<AccentKey, AccentTokens> = {
  brand: {
    bg: "bg-brand",
    bgSoft: "bg-brand-soft",
    text: "text-brand",
    textOn: "text-white",
    border: "border-brand/30",
    ring: "ring-brand/20",
    gradient: "from-brand to-violet",
    hex: "#6157eb",
  },
  violet: {
    bg: "bg-violet",
    bgSoft: "bg-violet-soft",
    text: "text-violet",
    textOn: "text-white",
    border: "border-violet/30",
    ring: "ring-violet/20",
    gradient: "from-violet to-rose",
    hex: "#8b5cf6",
  },
  amber: {
    bg: "bg-amber",
    bgSoft: "bg-amber-soft",
    text: "text-amber",
    textOn: "text-white",
    border: "border-amber/30",
    ring: "ring-amber/20",
    gradient: "from-amber to-coral",
    hex: "#f59e0b",
  },
  emerald: {
    bg: "bg-emerald",
    bgSoft: "bg-emerald-soft",
    text: "text-emerald",
    textOn: "text-white",
    border: "border-emerald/30",
    ring: "ring-emerald/20",
    gradient: "from-emerald to-cyan",
    hex: "#10b981",
  },
  rose: {
    bg: "bg-rose",
    bgSoft: "bg-rose-soft",
    text: "text-rose",
    textOn: "text-white",
    border: "border-rose/30",
    ring: "ring-rose/20",
    gradient: "from-rose to-coral",
    hex: "#ec4899",
  },
  sky: {
    bg: "bg-sky",
    bgSoft: "bg-sky-soft",
    text: "text-sky",
    textOn: "text-white",
    border: "border-sky/30",
    ring: "ring-sky/20",
    gradient: "from-sky to-cyan",
    hex: "#3b82f6",
  },
  cyan: {
    bg: "bg-cyan",
    bgSoft: "bg-cyan-soft",
    text: "text-cyan",
    textOn: "text-white",
    border: "border-cyan/30",
    ring: "ring-cyan/20",
    gradient: "from-cyan to-emerald",
    hex: "#06b6d4",
  },
  coral: {
    bg: "bg-coral",
    bgSoft: "bg-coral-soft",
    text: "text-coral",
    textOn: "text-white",
    border: "border-coral/30",
    ring: "ring-coral/20",
    gradient: "from-coral to-rose",
    hex: "#f97316",
  },
};

export const moduleAccent: Record<string, AccentKey> = {
  overview: "brand",
  products: "violet",
  inventory: "amber",
  categories: "cyan",
  sales: "emerald",
  customers: "rose",
  suppliers: "sky",
};
