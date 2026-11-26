"use client";

import { motion } from "framer-motion";

export interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
          <span>{label}</span>
          <span className="font-numeric">{Math.round(clamped)}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10"
      >
        {/* Scales instead of animating width, so the bar moves on the GPU. */}
        <motion.div
          className="h-full w-full origin-left rounded-full bg-brand-primary"
          initial={false}
          animate={{ scaleX: clamped / 100 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
