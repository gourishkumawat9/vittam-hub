"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PlayCircle, X } from "lucide-react";
import { useEffect } from "react";

export function DemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-modal flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-lg rounded-modal border border-border bg-surface p-8 text-center shadow-xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-background-secondary hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100">
              <PlayCircle className="h-7 w-7 text-brand-700" aria-hidden="true" />
            </div>
            <h3 id="demo-modal-title" className="mt-4 font-heading text-xl font-semibold text-text-primary">
              Demo video coming soon
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              We&apos;re polishing a full product walkthrough. In the meantime, explore the live platform yourself.
            </p>
            <a
              href="/register"
              className="mt-6 inline-flex items-center justify-center rounded-button bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Get started free
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
