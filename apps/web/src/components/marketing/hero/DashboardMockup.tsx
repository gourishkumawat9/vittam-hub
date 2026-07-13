"use client";

import { motion } from "framer-motion";
import { BadgeCheck, TrendingUp, Users, Wallet } from "lucide-react";

const TIMELINE = ["Idea", "MVP", "Revenue", "Funding", "Scale"];
const ACTIVE_STAGE_INDEX = 2;
const TRUST_SCORE = 92;
const INVESTOR_BARS = [28, 44, 38, 60, 52, 74, 68, 88];

const RING_RADIUS = 34;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * A static-but-alive "product screenshot" — not a real dashboard, but built
 * from real design tokens so it reads as an authentic preview rather than a
 * stock illustration. Trust ring and bars animate in once, on first view.
 */
export function DashboardMockup() {
  return (
    <div className="w-full max-w-md rounded-card border border-border bg-surface shadow-xl">
      {/* Fake window chrome */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-danger-500" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning-500" />
        <span className="h-2.5 w-2.5 rounded-full bg-success-500" />
        <span className="ml-3 truncate rounded-full bg-background-secondary px-3 py-1 text-xs text-text-secondary">
          vittamhub.com/nimbus-health
        </span>
      </div>

      <div className="flex flex-col gap-5 p-5">
        {/* Profile header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 font-heading text-sm font-bold text-brand-700">
            NH
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-heading text-sm font-semibold text-text-primary">Nimbus Health</h3>
              <BadgeCheck className="h-4 w-4 shrink-0 text-info-500" aria-hidden="true" />
            </div>
            <p className="truncate text-xs text-text-secondary">AI-assisted diagnostics for rural clinics</p>
          </div>
        </div>

        <div className="grid grid-cols-5 items-center gap-3">
          {/* Trust score ring */}
          <div className="col-span-2 flex flex-col items-center gap-1.5 rounded-card bg-background-secondary p-3">
            <svg viewBox="0 0 80 80" className="h-16 w-16 -rotate-90">
              <circle cx="40" cy="40" r={RING_RADIUS} fill="none" stroke="rgb(var(--color-border))" strokeWidth="7" />
              <motion.circle
                cx="40"
                cy="40"
                r={RING_RADIUS}
                fill="none"
                stroke="rgb(var(--color-brand-primary))"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
                whileInView={{ strokeDashoffset: RING_CIRCUMFERENCE * (1 - TRUST_SCORE / 100) }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
              />
            </svg>
            <span className="-mt-11 font-numeric text-lg font-bold text-text-primary">{TRUST_SCORE}</span>
            <span className="mt-6 text-[11px] font-medium uppercase tracking-wide text-text-secondary">Trust score</span>
          </div>

          {/* Investor interest mini-chart */}
          <div className="col-span-3 flex flex-col gap-2 rounded-card bg-background-secondary p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wide text-text-secondary">Investor interest</span>
              <span className="flex items-center gap-0.5 text-xs font-semibold text-success-600">
                <TrendingUp className="h-3 w-3" aria-hidden="true" />
                +18%
              </span>
            </div>
            <div className="flex h-12 items-end gap-1">
              {INVESTOR_BARS.map((height, index) => (
                <motion.span
                  key={index}
                  initial={{ height: 0 }}
                  whileInView={{ height: `${height}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
                  className="flex-1 rounded-sm bg-brand-primary/70"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Mini timeline */}
        <div className="flex items-center justify-between rounded-card bg-background-secondary p-3">
          {TIMELINE.map((stage, index) => (
            <div key={stage} className="flex flex-1 flex-col items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${index <= ACTIVE_STAGE_INDEX ? "bg-brand-primary" : "bg-border"}`}
              />
              <span
                className={`text-[10px] font-medium ${index === ACTIVE_STAGE_INDEX ? "text-text-primary" : "text-text-secondary"}`}
              >
                {stage}
              </span>
            </div>
          ))}
        </div>

        {/* Stat chips */}
        <div className="grid grid-cols-3 gap-3">
          <StatChip icon={Users} label="Followers" value="1.8k" />
          <StatChip icon={BadgeCheck} label="Verified" value="Yes" />
          <StatChip icon={Wallet} label="Passport" value="100%" />
        </div>
      </div>
    </div>
  );
}

function StatChip({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-card border border-border py-2.5">
      <Icon className="h-4 w-4 text-brand-primary" aria-hidden="true" />
      <span className="font-numeric text-sm font-bold text-text-primary">{value}</span>
      <span className="text-[10px] text-text-secondary">{label}</span>
    </div>
  );
}
