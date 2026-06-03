"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon, CloseIcon } from "@/components/icons";

type Toast = { id: number; message: string; tone: "info" | "error" | "success" };

type ToastCtx = {
  show: (message: string, tone?: Toast["tone"]) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3500);
  }, []);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => {
            const accent =
              t.tone === "error"
                ? { ring: "border-danger/30", icon: "bg-danger", dot: "text-danger" }
                : t.tone === "info"
                  ? { ring: "border-sky/30", icon: "bg-sky", dot: "text-sky" }
                  : { ring: "border-emerald/30", icon: "bg-emerald", dot: "text-emerald" };
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 16, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.96 }}
                transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
                className={`pointer-events-auto flex min-w-65 items-center gap-3 rounded-xl border bg-surface px-3 py-3 text-[13px] text-ink shadow-md ${accent.ring}`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${accent.icon} text-white`}
                >
                  {t.tone === "error" ? (
                    <CloseIcon size={12} />
                  ) : (
                    <CheckIcon size={12} />
                  )}
                </span>
                <span className="flex-1">{t.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const v = useContext(Ctx);
  if (!v) throw new Error("ToastProvider missing");
  return v;
}
