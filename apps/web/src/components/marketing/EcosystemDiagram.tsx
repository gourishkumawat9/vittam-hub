"use client";

import { motion } from "framer-motion";

import { LogoMark } from "@/components/Logo";
import { ECOSYSTEM_NODES } from "@/data/ecosystem";

import { SectionHeading } from "./SectionHeading";

const RADIUS = 220;

export function EcosystemDiagram() {
  return (
    <section id="ecosystem" className="border-t border-border bg-background-secondary">
      <div className="mx-auto max-w-content px-6 py-24">
        <SectionHeading
          eyebrow="The ecosystem"
          title="Every part of the startup world, connected"
          description="VittamHub is the hub that links founders to everyone they need to grow."
        />

        {/* Orbit diagram — desktop/tablet only, needs room to breathe */}
        <div className="relative mx-auto mt-20 hidden h-[540px] w-[540px] items-center justify-center md:flex">
          <svg aria-hidden="true" className="absolute inset-0 h-full w-full text-border" viewBox="-270 -270 540 540">
            {ECOSYSTEM_NODES.map((node, index) => {
              const angle = (index / ECOSYSTEM_NODES.length) * 2 * Math.PI - Math.PI / 2;
              const nodeX = Math.cos(angle) * RADIUS;
              const nodeY = Math.sin(angle) * RADIUS;
              return (
                <motion.line
                  key={node.id}
                  x1={0}
                  y1={0}
                  x2={nodeX}
                  y2={nodeY}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="3 6"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.05 }}
                />
              );
            })}
          </svg>

          <div className="z-10 flex h-24 w-24 items-center justify-center rounded-full border border-border bg-surface shadow-lg">
            <LogoMark className="h-11 w-11" />
          </div>

          {ECOSYSTEM_NODES.map((node, index) => {
            const angle = (index / ECOSYSTEM_NODES.length) * 2 * Math.PI - Math.PI / 2;
            const nodeX = Math.cos(angle) * RADIUS;
            const nodeY = Math.sin(angle) * RADIUS;
            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
                whileHover={{ scale: 1.08 }}
                className="absolute flex flex-col items-center gap-2"
                style={{ left: `calc(50% + ${nodeX}px)`, top: `calc(50% + ${nodeY}px)`, transform: "translate(-50%, -50%)" }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface shadow-sm">
                  <node.icon className="h-5 w-5 text-brand-primary" aria-hidden="true" />
                </div>
                <span className="whitespace-nowrap text-xs font-medium text-text-secondary">{node.label}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Simple grid fallback — mobile */}
        <div className="mt-12 grid grid-cols-3 gap-4 sm:grid-cols-4 md:hidden">
          {ECOSYSTEM_NODES.map((node) => (
            <div key={node.id} className="flex flex-col items-center gap-2 rounded-card border border-border bg-surface p-3 text-center">
              <node.icon className="h-5 w-5 text-brand-primary" aria-hidden="true" />
              <span className="text-xs font-medium text-text-secondary">{node.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
