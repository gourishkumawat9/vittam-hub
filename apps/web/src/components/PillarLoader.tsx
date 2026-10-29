import Image from "next/image";
import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

import styles from "./PillarLoader.module.css";

/** Shown under the logo at the end of each loop. The site-wide tagline is still "Visibility for Tomorrow's Unicorns". */
const LOADER_TAGLINE = "Nurturing Future Unicorns";

/** One pillar, centered on x=0 with its top at y=0. Same flared I-beam profile as the pillars in the sketches. */
const PILLAR =
  "M-33 0H33V7C22 8 15 12 15 22V110C15 120 22 124 33 125V132H-33V125C-22 124 -15 120 -15 110V22C-15 12 -22 8 -33 7Z";
const SPARKLE = "M0 -5L1.3 -1.3L5 0L1.3 1.3L0 5L-1.3 1.3L-5 0L-1.3 -1.3Z";
const BRIDGE = [
  { label: "Mentors", d: "M181 186H241", x: 211, y: 174 },
  { label: "Community", d: "M241 186L271 199L301 186", x: 271, y: 217 },
  { label: "Incubators", d: "M301 186H361", x: 331, y: 174 },
];
/** Three founders in a chain, each pushing the one in front; the first pushes the Startup pillar. */
const FOUNDERS = [125, 101.5, 78];
const BULBS = [
  { x: 166, y: 58, fall: undefined },
  { x: 190, y: 54, fall: styles.bulbX24 },
  { x: 214, y: 58, fall: styles.bulbX48 },
];
const PILLAR_SPARKLES = [
  [-8, 20],
  [10, 40],
  [-12, 62],
  [6, 80],
  [-4, 100],
  [14, 112],
  [-20, 6],
  [20, 8],
];
const UNICORNS = [
  { x: 366, y: 168, scale: 0.92 },
  { x: 394, y: 206, scale: 0.76 },
  { x: 350, y: 232, scale: 0.64 },
];

/**
 * Animations on one shared 10s cycle can be staggered without writing new
 * keyframes: a delay of (lag − cycle) starts the element mid-cycle, so it runs
 * `lag` seconds behind its siblings from the very first frame.
 */
function lag(seconds: number): CSSProperties {
  return { animationDelay: `${(seconds - 10).toFixed(2)}s` };
}

function Founder({ x, index }: { x: number; index: number }) {
  const offset = lag(index * 0.12);
  return (
    <g transform={`translate(${x} 252)`}>
      <g className={styles.hop} style={offset}>
        <g transform="translate(-3 -24)">
          <line className={styles.legA} style={offset} x1="0" y1="0" x2="0" y2="24" />
          <line className={styles.legB} style={offset} x1="0" y1="0" x2="0" y2="24" />
        </g>
        <g className={styles.standUp} style={offset}>
          <path d="M-3 -24L7 -43" />
          <circle className={styles.head} cx="11" cy="-50" r="6.5" />
          <g transform="translate(7 -42)">
            <path className={styles.cheer} style={offset} d="M0 0L10 4L19 2" />
          </g>
        </g>
      </g>
    </g>
  );
}

function Bulb() {
  return (
    <>
      <circle className={styles.bulbGlow} r="15" fill="url(#vh-pl-glow)" />
      <path className={styles.bulbGlass} d="M-6 3A7.5 7.5 0 1 1 6 3C4.6 4.8 4 6 4 8H-4C-4 6 -4.6 4.8 -6 3Z" />
      <rect className={styles.bulbBase} x="-3.6" y="8.6" width="7.2" height="4" rx="1.4" />
      <path className={styles.bulbShine} d="M-3.6 -1.8A4.2 4.2 0 0 1 -1 -4.6" />
    </>
  );
}

/** White legs with the same outline as the body: a wide outline stroke under a narrower white one. */
function Legs({ d }: { d: string }) {
  return (
    <>
      <path className={styles.legOutline} d={d} />
      <path className={styles.legFill} d={d} />
    </>
  );
}

function Unicorn() {
  return (
    <g className={styles.unicorn}>
      <path className={styles.trail} d={SPARKLE} transform="translate(-40 6) scale(.7)" />
      <path
        className={styles.trail}
        d={SPARKLE}
        transform="translate(-50 -2) scale(.5)"
        style={{ animationDelay: "-0.4s" }}
      />
      <Legs d="M-9 5L-16 9L-23 8M-5 6L-11 12L-18 14" />
      <path className={styles.mane} d="M-15 -4C-24 -9 -30 -4 -33 4C-29 0 -27 2 -26 6C-24 0 -20 -2 -15 1Z" />
      <path d="M-16 -2C-16 -10 -6 -12 4 -11C12 -10 17 -7 17 -1C17 5 12 8 4 8H-8C-14 8 -16 4 -16 -2Z" />
      <Legs d="M10 5L15 10L21 9M6 6L9 13L15 14" />
      <path d="M8 -9C11 -16 15 -22 19 -26L26 -22C22 -16 19 -9 17 -3Z" />
      <path d="M17 -27C20 -31 26 -31 29 -27L35 -19C36.5 -17 35 -14.5 32.5 -15L25 -17C21 -18 17 -21 17 -27Z" />
      <path className={styles.mane} d="M18 -28C13 -27 9 -21 7 -12C10 -15 11 -14 10 -9C13 -15 15 -19 19 -22Z" />
      <path d="M20 -29L20.5 -34L23.5 -30Z" />
      <path className={styles.horn} d="M23 -30L31 -42L26 -29.2Z" />
      <circle className={styles.eye} cx="26.5" cy="-24" r="1.1" />
      <path
        className={styles.wing}
        d="M2 -9C-2 -22 -10 -31 -22 -34C-18 -30 -17 -28 -19 -25C-14 -25 -12 -23 -14 -19C-9 -19 -6 -16 -7 -12C-3 -12 0 -10 2 -9Z"
      />
    </g>
  );
}

export interface PillarLoaderProps {
  className?: string;
  /** Line under the logo once the story ends. */
  tagline?: string;
}

/**
 * VittamHub's loading animation, drawn as inline SVG and animated with CSS
 * only, so it starts with the first HTML byte, before any JavaScript runs.
 *
 * Step 1: founders push the Startup pillar toward the Investors pillar while a
 * bridge of mentors, community and incubators forms between them. Step 2: once
 * they connect, the idea bubble bursts into the Startup pillar and the
 * Investors pillar turns into flying unicorns. Then the official logo and
 * tagline appear, and the story loops for as long as loading lasts.
 *
 * Decorative only (aria-hidden): whatever screen uses it says what is loading.
 * With reduced motion it shows just the logo and tagline, still.
 */
export function PillarLoader({ className, tagline = LOADER_TAGLINE }: PillarLoaderProps) {
  return (
    <div className={cn(styles.root, className)} aria-hidden="true">
      <svg className={styles.svg} viewBox="0 0 460 280" fill="none">
        <defs>
          <linearGradient id="vh-pl-startup" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7EA7D8" />
            <stop offset="1" stopColor="#5F89C8" />
          </linearGradient>
          <linearGradient id="vh-pl-investor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5F89C8" />
            <stop offset="1" stopColor="#3D5A85" />
          </linearGradient>
          <linearGradient id="vh-pl-sweep" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="0.6" stopColor="#FEF3C7" stopOpacity="0.75" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="vh-pl-halo">
            <stop offset="0" stopColor="#FCD34D" stopOpacity="0.5" />
            <stop offset="0.6" stopColor="#FCD34D" stopOpacity="0.16" />
            <stop offset="1" stopColor="#FCD34D" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="vh-pl-mane" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7EA7D8" />
            <stop offset="0.5" stopColor="#A78BFA" />
            <stop offset="1" stopColor="#F472B6" />
          </linearGradient>
          <radialGradient id="vh-pl-glow">
            <stop offset="0" stopColor="#FCD34D" stopOpacity="0.7" />
            <stop offset="1" stopColor="#FCD34D" stopOpacity="0" />
          </radialGradient>
          <clipPath id="vh-pl-clip">
            <path d={PILLAR} />
          </clipPath>
        </defs>

        <g className={styles.scene}>
          <path className={styles.ground} d="M12 252H448" />

          {/* Investors: their pillar, and the bridge that grows out of it toward the founders. */}
          <g className={styles.investorMove}>
            {BRIDGE.map((segment, i) => (
              <g key={segment.label}>
                <path className={styles.segment} style={lag((2 - i) * 0.6)} d={segment.d} />
                <text className={styles.label} style={lag((2 - i) * 0.6)} x={segment.x} y={segment.y}>
                  {segment.label}
                </text>
              </g>
            ))}
            <path className={styles.pulse} d="M181 186H241L271 199L301 186H361" pathLength={1} />
            <g transform="translate(376 120)">
              <ellipse className={styles.investorHalo} cx="0" cy="60" rx="70" ry="96" fill="url(#vh-pl-halo)" />
              <g className={styles.investorPillar}>
                <ellipse className={styles.shadow} cx="0" cy="133" rx="40" ry="4" />
                <path d={PILLAR} fill="url(#vh-pl-investor)" />
                <text className={styles.pillarText} transform="translate(0 66) rotate(-90)">
                  INVESTORS
                </text>
                <path className={styles.investorFlash} d={PILLAR} />
              </g>
              {PILLAR_SPARKLES.map(([sx, sy], i) => (
                <g key={i} transform={`translate(${sx} ${sy})`}>
                  <path className={styles.rise} style={lag(i * 0.07)} d={SPARKLE} />
                </g>
              ))}
            </g>
          </g>

          {/* Startups: their pillar, the founders pushing it, and the idea bubble above it. */}
          <g className={styles.startupMove}>
            <ellipse className={styles.shadow} cx="166" cy="253" rx="40" ry="4" />
            <g transform="translate(166 120)">
              <ellipse className={styles.startupHalo} cx="0" cy="60" rx="70" ry="96" fill="url(#vh-pl-halo)" />
              <path d={PILLAR} fill="url(#vh-pl-startup)" />
              <g clipPath="url(#vh-pl-clip)">
                <rect className={styles.sweep} x="-33" y="-48" width="66" height="48" fill="url(#vh-pl-sweep)" />
              </g>
              <text className={styles.pillarText} transform="translate(0 66) rotate(-90)">
                STARTUPS
              </text>
              <ellipse className={styles.capFlash} cx="0" cy="2" rx="30" ry="5" />
              {[-11, 11].map((sx, i) => (
                <g key={sx} transform={`translate(${sx} 0)`}>
                  <g className={styles.newStartup} style={lag(i * 0.15)}>
                    <path d="M0 -12V-4M-3 0L0 -4L3 0M-4 -16L0 -10L4 -16" />
                    <circle className={styles.head} cx="0" cy="-16.5" r="3" />
                  </g>
                </g>
              ))}
            </g>
            <circle className={styles.dockFlash} cx="181" cy="186" r="6" />
            <g className={styles.founders}>
              {FOUNDERS.map((x, i) => (
                <Founder key={x} x={x} index={i} />
              ))}
            </g>

            <g className={styles.float}>
              <g transform="translate(190 62)">
                <g className={styles.bubble}>
                  <path
                    className={styles.cloud}
                    d="M-44 18A17 17 0 0 1 -47 -10A22 22 0 0 1 -14 -27A26 26 0 0 1 24 -26A20 20 0 0 1 50 -2A16 16 0 0 1 40 22A90 60 0 0 1 -44 18Z"
                  />
                </g>
                <g className={styles.sparks}>
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                    <path key={angle} d="M0 -40V-50" transform={`scale(1.15 .8) rotate(${angle})`} />
                  ))}
                </g>
              </g>
              <g className={styles.dots}>
                <circle cx="171" cy="102" r="4.5" />
                <circle cx="164" cy="113" r="2.8" />
              </g>
              {BULBS.map((bulb, i) => (
                <g key={bulb.x} transform={`translate(${bulb.x} ${bulb.y})`}>
                  <g className={bulb.fall} style={lag(i * 0.1)}>
                    <g className={styles.bulbY} style={lag(i * 0.1)}>
                      <Bulb />
                    </g>
                  </g>
                </g>
              ))}
            </g>
          </g>

          {UNICORNS.map((u, i) => (
            <g key={u.x} transform={`translate(${u.x} ${u.y})`}>
              <g className={styles.fly} style={lag(i * 0.15)}>
                <g transform={`scale(${u.scale})`}>
                  <Unicorn />
                </g>
              </g>
            </g>
          ))}
        </g>
      </svg>

      <div className={styles.brand}>
        {/* Unoptimized so it's the same cached file the offline page uses, with no trip through the image optimizer. */}
        <Image src="/brand/vittamhub-logo.png" alt="" width={836} height={172} unoptimized className={styles.logo} />
        <p className={styles.tagline}>{tagline}</p>
      </div>
    </div>
  );
}
