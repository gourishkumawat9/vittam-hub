/**
 * The loader's five-second story, drawn on a 2D canvas as a pure function of
 * time, so it loops seamlessly and can be rendered frame by frame for video:
 *
 *   0.0 s   the Startups and Investors pillars rise out of a glossy floor, and
 *           an idea bubble of founders who haven't joined yet inflates over Startups
 *   0.8 s   three founders push Startups toward Investors
 *   1.6 s   a bridge of mentors, community and incubators joins the two, and
 *           with its V the pillars read as the logo's mark
 *   2.2 s   the founders cheer, the bubble pops and its founders drop into Startups
 *   2.45 s  startups travel the bridge to Investors…
 *   3.2 s   …which launches them as unicorns, and a light sweeps the logo
 *   4.4 s   everything sinks back into the floor, ready for the next loop
 *
 * The world is measured in units: the floor is y = 0, up is negative, and the
 * frame is 100 units tall. Landscape and portrait frames share the world and
 * differ only in the camera. The logo and tagline aren't drawn here: they're
 * live HTML over the canvas (see CinematicLoader).
 */
import { CYCLE } from "./constants";

type Ctx = CanvasRenderingContext2D;
type V2 = readonly [number, number];

export interface Overlay {
  /** Progress of the light sweep across the logo, from 0 to 1, or -1 when there's none. */
  glint: number;
}

export interface Scene {
  /** Draws the frame `t` seconds into the loop, or the still used as the poster. */
  draw(t: number | "still"): Overlay;
  /** Switches between the light and dark theme's colours. */
  theme(dark: boolean): void;
}

interface Palette {
  /** The pillars' and bridge's fill, left to right: lit edge to shaded edge. */
  pillar: readonly string[];
  pillarLine: string;
  shine: string;
  /** "R G B" triples, combined with an alpha where they're used. */
  shadow: string;
  glow: string;
  floor: string;
  label: string;
  caption: string;
  nodeFill: string;
  /** Founders, nearest first. */
  ink: readonly string[];
  people: readonly string[];
  rim: readonly string[];
  /** Unicorns are made of the pillars' material: top to bottom of the body, then the wing. */
  unicorn: readonly [string, string];
  wing: readonly [string, string];
  mane: string;
  unicornLine: string;
  gold: readonly [string, string];
  reflection: number;
  /** Glows add light on a dark background, and are painted over on a light one. */
  glowMode: GlobalCompositeOperation;
}

// Brand blues from @vittamhub/tokens, centred on the logo's own #7CB2E3.
const LIGHT: Palette = {
  pillar: ["#C6DDF4", "#8EBCE8", "#76A8DD", "#5A86C2"],
  pillarLine: "rgb(77 113 168 / 0.5)",
  shine: "rgb(255 255 255 / 0.8)",
  shadow: "15 23 42",
  glow: "95 137 200",
  floor: "95 137 200",
  label: "#374151",
  caption: "#6B7280",
  nodeFill: "#FFFFFF",
  ink: ["#334155", "#7A889C", "#B4BFCD"],
  people: ["#4D71A8", "#334155", "#6C97CE", "#475569", "#3D5A85"],
  rim: ["#9CC0E6", "#B9A8F5", "#8ED8CF"],
  unicorn: ["#C6DDF4", "#5F89C8"],
  wing: ["#FFFFFF", "#A3C8EC"],
  mane: "#E7F0F9",
  unicornLine: "rgb(61 90 133 / 0.4)",
  gold: ["#F6D58E", "#D6992C"],
  reflection: 0.2,
  glowMode: "source-over",
};

const DARK: Palette = {
  pillar: ["#B5D4F3", "#86B6E6", "#6C97CE", "#3F6496"],
  pillarLine: "rgb(169 199 230 / 0.55)",
  shine: "rgb(255 255 255 / 0.7)",
  shadow: "0 0 0",
  glow: "126 167 216",
  floor: "126 167 216",
  label: "#E2E8F0",
  caption: "#94A3B8",
  nodeFill: "#0F172A",
  ink: ["#E2E8F0", "#94A3B8", "#56657A"],
  people: ["#A9C7E6", "#E2E8F0", "#7EA7D8", "#CBD5E1", "#CEE0F3"],
  rim: ["#A9C7E6", "#C4B5FD", "#99E2DA"],
  unicorn: ["#FFFFFF", "#7EA7D8"],
  wing: ["#FFFFFF", "#BCD5F0"],
  mane: "#FFFFFF",
  unicornLine: "rgb(206 224 243 / 0.5)",
  gold: ["#F8DC9C", "#E0A63A"],
  reflection: 0.24,
  glowMode: "lighter",
};

// Pillars, after the logo's: a slab and a chamfer at the top and bottom of a shaft.
const PILLAR_H = 34;
const SHAFT = 3.2;
const CAP = 5;
const SLAB = 1.1;
const CHAMFER = 2.6;
const INVESTORS_X = 22;
const STARTUPS_FROM = -44;
const STARTUPS_TO = -22;
const PUSH: V2 = [0.8, 1.7];

// The bridge dips into a V in the middle, like the logo's crossbar.
const BRIDGE_Y = -17;
const BRIDGE: V2[] = [
  [STARTUPS_TO + SHAFT, BRIDGE_Y],
  [-5, BRIDGE_Y],
  [0, BRIDGE_Y + 5],
  [5, BRIDGE_Y],
  [INVESTORS_X - SHAFT, BRIDGE_Y],
];
const BRIDGE_DRAW: V2 = [1.62, 2.2];
const NODES: { text: string; at: V2; label: V2 }[] = [
  { text: "Mentors", at: [-11.5, BRIDGE_Y], label: [-11.5, BRIDGE_Y - 3.7] },
  { text: "Community", at: [0, BRIDGE_Y + 5], label: [0, BRIDGE_Y + 9] },
  { text: "Incubators", at: [11.5, BRIDGE_Y], label: [11.5, BRIDGE_Y - 3.7] },
];

const BUBBLE_R = 8.5;
const POP = 2.25;
/** Where the bubble's founders float, relative to its centre. */
const CROWD: V2[] = [
  [-3.6, 2.4],
  [0.2, 3.4],
  [3.9, 1.8],
  [-1.9, -2.3],
  [2.3, -2.6],
];

/** Startups crossing the bridge and climbing Investors. */
const FLOW_PATH: V2[] = [...BRIDGE, [INVESTORS_X, BRIDGE_Y], [INVESTORS_X, -PILLAR_H - 0.6]];
const FLOW_COUNT = 7;
const FLOW_START = 2.45;
const FLOW_GAP = 0.07;
const FLOW_TIME = 0.78;

interface Flight {
  launch: number;
  size: number;
  path: readonly [V2, V2, V2, V2];
}
const LAUNCH_Y = -PILLAR_H - 1.5;
const FLIGHT_TIME = 1.0;
const FLIGHTS: Flight[] = [
  {
    launch: 3.2,
    size: 1,
    path: [
      [22, LAUNCH_Y],
      [26, -54],
      [36, -64],
      [58, -90],
    ],
  },
  {
    launch: 3.42,
    size: 0.85,
    path: [
      [21, LAUNCH_Y],
      [12, -52],
      [-4, -58],
      [-34, -80],
    ],
  },
  {
    launch: 3.64,
    size: 0.93,
    path: [
      [23, LAUNCH_Y],
      [36, -44],
      [58, -48],
      [108, -60],
    ],
  },
];
/** The bridge reaches Investors: a light runs down both pillars. */
const DOCK = 2.2;

const GLINT: V2 = [3.95, 4.55];
const SINK: V2 = [4.4, 4.85];

/** The poster: every part of the story at its best moment in one frame. */
const STILL = { base: 3.15, bubble: 1.95, flow: 2.86, unicorn: 3.82 };
type Times = typeof STILL;

// Easing.
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const outCubic = (x: number) => 1 - (1 - x) ** 3;
const inCubic = (x: number) => x ** 3;
const inOutCubic = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
const inOutSine = (x: number) => (1 - Math.cos(Math.PI * x)) / 2;
const outBack = (x: number) => 1 + 2.4 * (x - 1) ** 3 + 1.4 * (x - 1) ** 2;
const TAU = Math.PI * 2;

const startupsX = (t: number) => lerp(STARTUPS_FROM, STARTUPS_TO, inOutSine(seg(t, PUSH[0], PUSH[1])));

/** How far a pillar (and what hangs on it) is below its place: rising at the start, sinking at the end. */
function sunk(t: number, delay: number): number {
  const up = outCubic(seg(t, 0.05 + delay, 0.62 + delay));
  return PILLAR_H * (1 - up) + (PILLAR_H + 2) * inCubic(seg(t, SINK[0], SINK[1]));
}

function camera(t: number, portrait: boolean): { x: number; zoom: number } {
  const push = 0.035 * (inOutSine(seg(t, 0.2, 4.3)) - inOutSine(seg(t, 4.4, 5)));
  if (!portrait) return { x: 0, zoom: 1.08 * (1 + push) };
  // Too narrow for both pillars at the start: follow Startups, then settle between them.
  const x = -26 + 26 * inOutCubic(seg(t, 0.75, 1.95)) - 26 * inOutSine(seg(t, 4.86, 4.99));
  return { x, zoom: 0.72 * (1 + push) };
}

function cubic(p: readonly [V2, V2, V2, V2], u: number): V2 {
  const v = 1 - u;
  const a = v * v * v;
  const b = 3 * v * v * u;
  const c = 3 * v * u * u;
  const d = u * u * u;
  return [a * p[0][0] + b * p[1][0] + c * p[2][0] + d * p[3][0], a * p[0][1] + b * p[1][1] + c * p[2][1] + d * p[3][1]];
}

function lengths(path: readonly V2[]): number[] {
  const out = [0];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    out.push(out[i - 1]! + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  return out;
}
const BRIDGE_LEN = lengths(BRIDGE);
const FLOW_LEN = lengths(FLOW_PATH);

/** The point `d` units along a polyline. */
function along(path: readonly V2[], lens: readonly number[], d: number): V2 {
  for (let i = 1; i < path.length; i++) {
    if (d <= lens[i]! || i === path.length - 1) {
      const a = path[i - 1]!;
      const b = path[i]!;
      const k = clamp01((d - lens[i - 1]!) / (lens[i]! - lens[i - 1]! || 1));
      return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
    }
  }
  return path[0]!;
}

/** Distance along the bridge to the point nearest each node, for lighting them as startups pass. */
const NODE_AT = NODES.map(({ at }) => {
  let best = 0;
  let bestD = Infinity;
  for (let d = 0; d <= FLOW_LEN[FLOW_LEN.length - 1]!; d += 0.1) {
    const p = along(FLOW_PATH, FLOW_LEN, d);
    const dist = Math.hypot(p[0] - at[0], p[1] - at[1]);
    if (dist < bestD) [best, bestD] = [d, dist];
  }
  return best;
});

const flowEase = (u: number) => 0.45 * u + 0.55 * inOutSine(u);

/** Distance each startup has travelled along FLOW_PATH, or -1 if it isn't on it. */
function flowAt(t: number, i: number): number {
  const u = seg(t, FLOW_START + i * FLOW_GAP, FLOW_START + i * FLOW_GAP + FLOW_TIME);
  return u <= 0 || u >= 1 ? -1 : flowEase(u) * FLOW_LEN[FLOW_LEN.length - 1]!;
}

/** Light gathered on Investors' capital from arriving startups and launching unicorns. */
function charge(t: number): number {
  let c = 0;
  for (let i = 0; i < FLOW_COUNT; i++) {
    const dt = t - (FLOW_START + i * FLOW_GAP + FLOW_TIME);
    if (dt > 0) c += 0.35 * Math.exp(-dt * 5);
  }
  for (const f of FLIGHTS) {
    const dt = t - f.launch;
    if (dt > 0) c += Math.exp(-dt * 7);
  }
  return Math.min(c, 1.4);
}

function ik(a: V2, b: V2, l1: number, l2: number, prefer: (p: V2) => number): V2 {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = Math.max(1e-3, Math.min(Math.hypot(dx, dy), l1 + l2 - 1e-3));
  const base = Math.atan2(dy, dx);
  const bend = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const p: V2 = [a[0] + l1 * Math.cos(base + bend), a[1] + l1 * Math.sin(base + bend)];
  const q: V2 = [a[0] + l1 * Math.cos(base - bend), a[1] + l1 * Math.sin(base - bend)];
  return prefer(p) >= prefer(q) ? p : q;
}

// A winged unicorn in a flying gallop, facing right, in its own 100-unit box.
const UNICORN_BODY =
  "M68 34C69 26 70 20 72 14C77 15 83 17 90 20C93 20 95 18 94 15C92 10 84 2 79 -3L76 -11L73 -4" +
  "C68 4 62 13 56 20C48 23 36 22 28 22C22 23 18 28 20 34C22 39 26 41 30 42C40 45 54 45 62 42C66 41 68 38 68 34Z";
const UNICORN_HORN = "M77.5 -3L80.5 -5.5L91 -23Z";
const UNICORN_WING = "M57 20C55 2 44 -16 22 -31L28 -21L18 -18L30 -11L20 -7L33 -2L25 3L38 7L33 12L45 14L42 19L52 21Z";
const UNICORN_LEGS: V2[][] = [
  [
    [64, 39],
    [75, 46],
    [86, 43],
    [91, 46],
  ],
  [
    [60, 40],
    [67, 50],
    [74, 56],
    [77, 59],
  ],
  [
    [29, 38],
    [18, 47],
    [7, 49],
    [2, 53],
  ],
  [
    [34, 40],
    [27, 51],
    [17, 57],
    [13, 61],
  ],
];
const UNICORN_HAIR = [
  "M74 -3C68 -9 60 -8 52 -4",
  "M70 3C63 -1 56 2 48 6",
  "M65 10C58 8 51 12 44 15",
  "M21 26C12 20 4 25 -6 20",
  "M20 29C11 29 4 35 -7 32",
  "M21 32C13 36 7 43 -2 43",
];

/** Draws onto `canvas`. Returns null without a 2D context. */
export function createScene(canvas: HTMLCanvasElement, font = "system-ui, sans-serif"): Scene | null {
  const context = canvas.getContext("2d");
  const mirror = document.createElement("canvas");
  const mirrorContext = mirror.getContext("2d");
  if (!context || !mirrorContext) return null;
  const c = context;
  const m = mirrorContext;
  let p = LIGHT;
  const unicorn = {
    body: new Path2D(UNICORN_BODY),
    horn: new Path2D(UNICORN_HORN),
    wing: new Path2D(UNICORN_WING),
    hair: UNICORN_HAIR.map((d) => new Path2D(d)),
  };

  const rgba = (rgb: string, a: number) => `rgb(${rgb} / ${a.toFixed(3)})`;

  function glowDot(x: CanvasRenderingContext2D, cx: number, cy: number, r: number, a: number, rgb = p.glow) {
    if (a <= 0.003 || r <= 0) return;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, rgba(rgb, a));
    g.addColorStop(0.4, rgba(rgb, a * 0.35));
    g.addColorStop(1, rgba(rgb, 0));
    x.fillStyle = g;
    x.fillRect(cx - r, cy - r, r * 2, r * 2);
  }

  /** Text drawn in screen pixels at a world position, so it stays crisp at any zoom. */
  function text(
    x: Ctx,
    str: string,
    at: V2,
    size: number,
    color: string,
    alpha: number,
    opts: { weight?: number; tracking?: number } = {},
  ) {
    if (alpha <= 0.003) return;
    const mt = x.getTransform();
    const sx = mt.a * at[0] + mt.c * at[1] + mt.e;
    const sy = mt.b * at[0] + mt.d * at[1] + mt.f;
    const px = size * Math.abs(mt.a);
    x.save();
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalAlpha = alpha;
    x.fillStyle = color;
    x.font = `${opts.weight ?? 600} ${px.toFixed(2)}px ${font}`;
    x.textBaseline = "middle";
    const track = (opts.tracking ?? 0) * px;
    if (!track) {
      x.textAlign = "center";
      x.fillText(str, sx, sy);
    } else {
      x.textAlign = "left";
      const widths = [...str].map((ch) => x.measureText(ch).width);
      let cx = sx - (widths.reduce((s, w) => s + w, 0) + track * (str.length - 1)) / 2;
      [...str].forEach((ch, i) => {
        x.fillText(ch, cx, sy);
        cx += widths[i]! + track;
      });
    }
    x.restore();
  }

  function pillarPath(x: Ctx, cx: number, drop: number) {
    const top = -PILLAR_H + drop;
    const bottom = drop;
    x.beginPath();
    x.moveTo(cx - CAP, top);
    x.lineTo(cx + CAP, top);
    x.lineTo(cx + CAP, top + SLAB);
    x.lineTo(cx + SHAFT, top + SLAB + CHAMFER);
    x.lineTo(cx + SHAFT, bottom - SLAB - CHAMFER);
    x.lineTo(cx + CAP, bottom - SLAB);
    x.lineTo(cx + CAP, bottom);
    x.lineTo(cx - CAP, bottom);
    x.lineTo(cx - CAP, bottom - SLAB);
    x.lineTo(cx - SHAFT, bottom - SLAB - CHAMFER);
    x.lineTo(cx - SHAFT, top + SLAB + CHAMFER);
    x.lineTo(cx - CAP, top + SLAB);
    x.closePath();
  }

  function pillar(x: Ctx, cx: number, drop: number, lit: number, sweep: number) {
    if (drop >= PILLAR_H) return;
    pillarPath(x, cx, drop);
    const g = x.createLinearGradient(cx - CAP, 0, cx + CAP, 0);
    p.pillar.forEach((col, i) => g.addColorStop(i / (p.pillar.length - 1), col));
    x.fillStyle = g;
    x.fill();
    x.lineWidth = 0.16;
    x.strokeStyle = p.pillarLine;
    x.stroke();
    // A soft highlight down the lit side of the shaft and along the capital.
    const top = -PILLAR_H + drop;
    x.lineCap = "round";
    x.strokeStyle = p.shine;
    x.lineWidth = 0.34;
    x.beginPath();
    x.moveTo(cx - SHAFT + 0.85, top + SLAB + CHAMFER + 1);
    x.lineTo(cx - SHAFT + 0.85, drop - SLAB - CHAMFER - 1);
    x.moveTo(cx - CAP + 0.5, top + 0.35);
    x.lineTo(cx + CAP - 0.8, top + 0.35);
    x.stroke();
    if (lit > 0.01 || (sweep > 0 && sweep < 1)) {
      x.save();
      pillarPath(x, cx, drop);
      x.clip();
      if (lit > 0.01) {
        // Light running down from the capital when something lands on it.
        const l = x.createLinearGradient(0, top, 0, top + 14);
        l.addColorStop(0, `rgb(255 255 255 / ${(0.75 * Math.min(1, lit)).toFixed(3)})`);
        l.addColorStop(1, "rgb(255 255 255 / 0)");
        x.fillStyle = l;
        x.fillRect(cx - CAP, top, CAP * 2, 14);
      }
      if (sweep > 0 && sweep < 1) {
        // A band of light down the whole pillar.
        const y = top - 5 + (PILLAR_H + 10) * inOutSine(sweep);
        const b = x.createLinearGradient(0, y - 5, 0, y + 5);
        b.addColorStop(0, "rgb(255 255 255 / 0)");
        b.addColorStop(0.5, `rgb(255 255 255 / ${(0.7 * Math.sin(Math.PI * sweep)).toFixed(3)})`);
        b.addColorStop(1, "rgb(255 255 255 / 0)");
        x.fillStyle = b;
        x.fillRect(cx - CAP, y - 5, CAP * 2, 10);
      }
      x.restore();
    }
  }

  function bridge(x: Ctx, t: number, drop: number) {
    const k = inOutCubic(seg(t, BRIDGE_DRAW[0], BRIDGE_DRAW[1]));
    if (k <= 0) return;
    const total = BRIDGE_LEN[BRIDGE_LEN.length - 1]! * k;
    x.save();
    x.translate(0, drop);
    x.beginPath();
    x.moveTo(BRIDGE[0]![0], BRIDGE[0]![1]);
    for (let i = 1; i < BRIDGE.length; i++) {
      if (BRIDGE_LEN[i]! <= total) x.lineTo(BRIDGE[i]![0], BRIDGE[i]![1]);
      else {
        const tip = along(BRIDGE, BRIDGE_LEN, total);
        x.lineTo(tip[0], tip[1]);
        break;
      }
    }
    x.lineJoin = "miter";
    x.lineCap = "butt";
    x.strokeStyle = p.pillarLine;
    x.lineWidth = 1.75;
    x.stroke();
    const g = x.createLinearGradient(0, BRIDGE_Y - 0.8, 0, BRIDGE_Y + 0.8);
    g.addColorStop(0, p.pillar[0]!);
    g.addColorStop(0.5, p.pillar[1]!);
    g.addColorStop(1, p.pillar[3]!);
    x.strokeStyle = g;
    x.lineWidth = 1.45;
    x.stroke();
    if (k < 1) {
      // The welding light at the tip while the bridge extends.
      const tip = along(BRIDGE, BRIDGE_LEN, total);
      x.globalCompositeOperation = p.glowMode;
      glowDot(x, tip[0], tip[1], 3.2, 0.85);
      x.globalCompositeOperation = "source-over";
      x.fillStyle = "#FFFFFF";
      x.beginPath();
      x.arc(tip[0], tip[1], 0.45, 0, TAU);
      x.fill();
    }
    x.restore();
  }

  /** How brightly each node is lit by passing startups. */
  function nodeLight(t: number, n: number): number {
    let s = 0;
    for (let i = 0; i < FLOW_COUNT; i++) {
      const d = flowAt(t, i);
      if (d >= 0) s += Math.exp(-(((d - NODE_AT[n]!) / 2.4) ** 2));
    }
    return Math.min(1, s);
  }

  function nodes(x: Ctx, t: number, drop: number, labels: boolean) {
    const reach = BRIDGE_LEN[BRIDGE_LEN.length - 1]! * inOutCubic(seg(t, BRIDGE_DRAW[0], BRIDGE_DRAW[1]));
    const fade = 1 - seg(t, 4.2, 4.42);
    NODES.forEach((node, n) => {
      // Each node appears as the bridge reaches it.
      const passed = reach - NODE_AT[n]!;
      if (passed <= 0) return;
      const s = outBack(clamp01(passed / 7));
      const light = nodeLight(t, n);
      const [nx, ny] = [node.at[0], node.at[1] + drop];
      x.globalCompositeOperation = p.glowMode;
      glowDot(x, nx, ny, 4.2 * s, 0.25 + 0.55 * light);
      x.globalCompositeOperation = "source-over";
      x.fillStyle = p.nodeFill;
      x.strokeStyle = p.pillar[3]!;
      x.lineWidth = 0.42;
      x.beginPath();
      x.arc(nx, ny, 1.55 * s * (1 + 0.18 * light), 0, TAU);
      x.fill();
      x.stroke();
      x.fillStyle = light > 0.05 ? `rgb(${p.glow} / 1)` : p.pillar[3]!;
      x.beginPath();
      x.arc(nx, ny, 0.6 * s * (1 + 0.5 * light), 0, TAU);
      x.fill();
      if (labels) {
        const a = clamp01((passed - 2) / 6) * fade;
        const lift = 0.8 * (1 - clamp01((passed - 2) / 6));
        text(x, node.text, [node.label[0], node.label[1] + lift + drop], 2.5, p.caption, a);
      }
    });
  }

  /** The three founders, nearest first: walk in, push, then straighten up. */
  function founders(x: Ctx, t: number) {
    const alpha = seg(t, 0.3, 0.55) * (1 - seg(t, 4.2, 4.45));
    if (alpha <= 0) return;
    const face = startupsX(t) - SHAFT;
    const moving = t < PUSH[1] + 0.05;
    // How far into the pushing stance they are: lean in before the push, straighten up after it.
    const brace = seg(t, 0.66, 0.86) * (1 - inOutSine(seg(t, 1.72, 2.1)));
    const lean = 0.08 + 0.55 * brace;
    const approach = 9 * (1 - outCubic(seg(t, 0.3, 0.82)));
    const stepBack = 1.6 * inOutSine(seg(t, 1.72, 2.1));
    x.save();
    x.globalAlpha = alpha;
    x.lineCap = "round";
    x.lineJoin = "round";
    for (let i = 2; i >= 0; i--) {
      const k = 1.12 * [1, 0.93, 0.86][i]!;
      const floor = -0.5 * i;
      const dir: V2 = [Math.sin(lean), -Math.cos(lean)];
      const torso = 2.9 * k;
      const hipY = floor - (3.2 - 0.25 * brace) * k;
      // Head down just short of the pillar, so their arms bend as they push.
      const cheer = Math.sin(Math.PI * seg(t, 2.25 + i * 0.07, 2.95 + i * 0.07));
      const shoulderX = face - 0.2 - 1.15 * k - 1.65 * k * dir[0] - lerp(2.7, 1.7, brace) * i - approach - stepBack;
      const hip: V2 = [shoulderX - torso * dir[0], hipY - 0.5 * k * cheer];
      const shoulder: V2 = [shoulderX, hipY + torso * dir[1]];
      const phase = TAU * 2.3 * t + i * 2.1;
      const back = -1.3 * k * brace;
      const feet = [0, 1].map((j): V2 => {
        const swing = Math.sin(phase + j * Math.PI);
        const stance = (j === 0 ? -0.9 : 0.5) * k * (1 - brace) + (j === 0 ? -1.2 : 0.2) * k * brace;
        return [
          hip[0] + (moving ? 1.1 * k * swing + back : stance),
          floor - (moving ? Math.max(0, Math.cos(phase + j * Math.PI)) * 0.75 * k : 0),
        ];
      });
      // Hands on the pillar while pushing; down at their sides, or up in the air when the bridge connects.
      const hands = [0, 1].map((j): V2 => {
        if (brace > 0.5) return [face - 0.1, shoulder[1] + (0.15 + j * 0.65) * k];
        const down: V2 = [shoulder[0] + (0.45 - j * 0.9) * k + 0.3 * brace, shoulder[1] + 2.75 * k];
        const up: V2 = [shoulder[0] + (j ? -2 : 2.1) * k, shoulder[1] - 1.95 * k];
        return [lerp(down[0], up[0], cheer), lerp(down[1], up[1], cheer)];
      });
      x.strokeStyle = p.ink[i]!;
      x.fillStyle = p.ink[i]!;
      x.lineWidth = 1.05 * k;
      x.beginPath();
      for (const foot of feet) {
        const knee = ik(hip, foot, 1.75 * k, 1.7 * k, (q) => q[0]);
        x.moveTo(hip[0], hip[1]);
        x.lineTo(knee[0], knee[1]);
        x.lineTo(foot[0], foot[1]);
      }
      for (const hand of hands) {
        const elbow = ik(shoulder, hand, 1.5 * k, 1.45 * k, (q) => q[1]);
        x.moveTo(shoulder[0], shoulder[1]);
        x.lineTo(elbow[0], elbow[1]);
        x.lineTo(hand[0], hand[1]);
      }
      x.stroke();
      x.lineWidth = 1.55 * k;
      x.beginPath();
      x.moveTo(hip[0], hip[1]);
      x.lineTo(shoulder[0], shoulder[1]);
      x.stroke();
      x.beginPath();
      x.arc(shoulder[0] + dir[0] * 1.65 * k, shoulder[1] + dir[1] * 1.65 * k, 1.15 * k, 0, TAU);
      x.fill();
    }
    x.restore();
  }

  /** Everything standing on the floor, which the floor reflects. */
  function grounded(x: Ctx, t: number, labels: boolean) {
    const sx = startupsX(t);
    const sDrop = sunk(t, 0.1);
    const iDrop = sunk(t, 0);
    let landed = 0;
    for (let i = 0; i < CROWD.length; i++) {
      const dt = t - (POP + i * 0.035 + 0.42);
      if (dt > 0) landed += Math.exp(-dt * 6);
    }
    const sweep = seg(t, DOCK, DOCK + 0.6);
    founders(x, t);
    pillar(x, sx, sDrop, landed, sweep);
    pillar(x, INVESTORS_X, iDrop, charge(t), sweep);
    bridge(x, t, iDrop);
    nodes(x, t, iDrop, labels);
    // The bridge locks into both pillars.
    const lock = seg(t, DOCK - 0.02, DOCK + 0.4);
    if (lock > 0 && lock < 1) {
      for (const jx of [STARTUPS_TO + SHAFT, INVESTORS_X - SHAFT]) {
        x.strokeStyle = rgba(p.glow, 0.75 * (1 - lock));
        x.lineWidth = 0.3;
        x.beginPath();
        x.arc(jx, BRIDGE_Y + iDrop, 0.8 + 3.2 * outCubic(lock), 0, TAU);
        x.stroke();
      }
    }
  }

  function person(x: Ctx, at: V2, s: number, color: string, rot: number) {
    x.save();
    x.translate(at[0], at[1]);
    x.rotate(rot);
    x.scale(s, s);
    x.fillStyle = color;
    x.beginPath();
    x.arc(0, -2.75, 0.95, 0, TAU);
    x.moveTo(-1.35, 0.9);
    x.lineTo(-1.35, -0.7);
    x.quadraticCurveTo(-1.35, -1.6, -0.45, -1.6);
    x.lineTo(0.45, -1.6);
    x.quadraticCurveTo(1.35, -1.6, 1.35, -0.7);
    x.lineTo(1.35, 0.9);
    x.closePath();
    x.fill();
    x.restore();
  }

  function bubbleCentre(t: number): V2 {
    return [
      startupsX(t - 0.12) + 0.4 * Math.sin(t * 2.1),
      -(PILLAR_H + 3.4 + BUBBLE_R) + sunk(t, 0.1) + 0.55 * Math.sin(t * 2.7),
    ];
  }

  function crowdAt(t: number, i: number, centre: V2, s: number): V2 {
    const [ox, oy] = CROWD[i]!;
    return [centre[0] + ox * s, centre[1] + oy * s + 0.35 * Math.sin(t * 3.1 + i * 1.7)];
  }

  function bubble(x: Ctx, t: number) {
    const s = outBack(seg(t, 0.5, 0.95));
    const centre = bubbleCentre(Math.min(t, POP));
    if (t < POP && s > 0) {
      const tension = seg(t, 1.95, POP);
      const wob = (0.018 + 0.05 * tension) * Math.sin(t * (9 + 16 * tension));
      const r = BUBBLE_R * s;
      x.save();
      x.translate(centre[0], centre[1]);
      x.scale(1 + wob, 1 - wob);
      CROWD.forEach((_, i) => {
        const appear = outBack(seg(t, 0.7 + i * 0.07, 0.98 + i * 0.07));
        if (appear <= 0) return;
        const at = crowdAt(t, i, [0, 0], s);
        person(x, at, 0.82 * appear, p.people[i]!, 0.12 * Math.sin(t * 2 + i));
      });
      const fill = x.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
      fill.addColorStop(0, rgba(p.glow, 0));
      fill.addColorStop(0.7, rgba(p.glow, 0.05));
      fill.addColorStop(1, rgba(p.glow, 0.2));
      x.fillStyle = fill;
      x.beginPath();
      x.arc(0, 0, r, 0, TAU);
      x.fill();
      const rim = x.createLinearGradient(-r, -r, r, r);
      p.rim.forEach((col, i) => rim.addColorStop(i / (p.rim.length - 1), col));
      x.strokeStyle = rim;
      x.lineWidth = 0.34;
      x.stroke();
      x.lineCap = "round";
      x.strokeStyle = p.shine;
      x.lineWidth = 0.6;
      x.beginPath();
      x.arc(0, 0, r * 0.8, Math.PI * 1.08, Math.PI * 1.36);
      x.stroke();
      x.fillStyle = p.shine;
      x.beginPath();
      x.arc(Math.cos(Math.PI * 1.46) * r * 0.8, Math.sin(Math.PI * 1.46) * r * 0.8, 0.32, 0, TAU);
      x.fill();
      // The idea's spark, twinkling at the top of the bubble.
      const tw = 0.6 + 0.4 * Math.sin(t * 7);
      star(x, [r * 0.55, -r * 0.62], 1.3 * s * tw, p.gold[1], s);
      x.restore();
      return;
    }
    const since = t - POP;
    if (since < 0) return;
    // The pop: a ring of film and a spray of droplets.
    const k = clamp01(since / 0.32);
    if (k < 1) {
      x.strokeStyle = rgba(p.glow, 0.7 * (1 - k));
      x.lineWidth = 0.3 * (1 - k) + 0.05;
      x.beginPath();
      x.arc(centre[0], centre[1], BUBBLE_R * (1 + 0.45 * outCubic(k)), 0, TAU);
      x.stroke();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + 0.2;
        const d = BUBBLE_R * (1 + 0.6 * outCubic(k));
        x.fillStyle = p.rim[i % p.rim.length]!;
        x.globalAlpha = 1 - k;
        x.beginPath();
        x.arc(centre[0] + Math.cos(a) * d, centre[1] + Math.sin(a) * d + 6 * since * since, 0.4 * (1 - k), 0, TAU);
        x.fill();
      }
      x.globalAlpha = 1;
    }
    // Its founders drop into the Startups pillar.
    CROWD.forEach((_, i) => {
      const start = POP + i * 0.035;
      const u = seg(t, start, start + 0.42);
      if (u >= 1) return;
      const from = crowdAt(POP, i, centre, 1);
      const to: V2 = [STARTUPS_TO + (i - 2) * 0.8, -PILLAR_H + 0.4];
      const at: V2 = [lerp(from[0], to[0], inOutSine(u)), from[1] + (to[1] - from[1]) * u * u - 2.2 * u * (1 - u)];
      x.globalAlpha = 1 - seg(u, 0.8, 1);
      person(x, at, lerp(0.82, 0.62, u), p.people[i]!, (i % 2 ? 0.4 : -0.4) * Math.sin(Math.PI * u));
      x.globalAlpha = 1;
    });
    // A ripple on the capital where each one lands.
    CROWD.forEach((_, i) => {
      const dt = t - (POP + i * 0.035 + 0.42);
      if (dt < 0 || dt > 0.4) return;
      const k2 = dt / 0.4;
      x.strokeStyle = rgba(p.glow, 0.6 * (1 - k2));
      x.lineWidth = 0.22;
      x.beginPath();
      x.ellipse(STARTUPS_TO + (i - 2) * 0.8, -PILLAR_H, 1 + 4 * outCubic(k2), 0.35 + 1.1 * outCubic(k2), 0, 0, TAU);
      x.stroke();
    });
  }

  function star(x: Ctx, at: V2, r: number, color: string, alpha: number) {
    if (r <= 0.01 || alpha <= 0.01) return;
    x.save();
    x.globalAlpha *= alpha;
    x.fillStyle = color;
    x.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU - Math.PI / 2;
      const d = i % 2 ? r * 0.28 : r;
      x.lineTo(at[0] + Math.cos(a) * d, at[1] + Math.sin(a) * d);
    }
    x.closePath();
    x.fill();
    x.restore();
  }

  function flow(x: Ctx, t: number) {
    const end = FLOW_LEN[FLOW_LEN.length - 1]!;
    for (let i = 0; i < FLOW_COUNT; i++) {
      const start = FLOW_START + i * FLOW_GAP;
      const u = seg(t, start, start + FLOW_TIME);
      if (u <= 0 || u >= 1) continue;
      const head = along(FLOW_PATH, FLOW_LEN, flowEase(u) * end);
      x.globalCompositeOperation = p.glowMode;
      for (let j = 6; j >= 1; j--) {
        const back = along(FLOW_PATH, FLOW_LEN, flowEase(Math.max(0, u - j * 0.022)) * end);
        glowDot(x, back[0], back[1], 1.6 * (1 - j / 7), 0.5 * (1 - j / 7));
      }
      glowDot(x, head[0], head[1], 3, 0.9);
      x.globalCompositeOperation = "source-over";
      x.fillStyle = "#FFFFFF";
      x.beginPath();
      x.arc(head[0], head[1], 0.55, 0, TAU);
      x.fill();
    }
    const ch = charge(t);
    if (ch > 0.01) {
      x.globalCompositeOperation = p.glowMode;
      glowDot(x, INVESTORS_X, -PILLAR_H, 6 + 4 * ch, 0.55 * Math.min(1, ch));
      x.globalCompositeOperation = "source-over";
    }
  }

  /** Where a unicorn is `dt` seconds after launch, and how big. */
  function flight(f: Flight, dt: number): { at: V2; s: number; u: number } {
    const u = clamp01(dt / FLIGHT_TIME);
    const move = 0.55 * u + 0.45 * u * u;
    return { at: cubic(f.path, move), s: f.size * (0.35 + 0.65 * outCubic(seg(u, 0, 0.22)) + 0.15 * u), u };
  }

  function drawUnicorn(x: Ctx, at: V2, angle: number, flip: number, s: number, t: number, alpha: number) {
    const flap = Math.sin(t * TAU * 3.2);
    x.save();
    x.globalAlpha = alpha;
    x.translate(at[0], at[1]);
    x.rotate(angle);
    x.scale(0.14 * s * flip, 0.14 * s);
    x.translate(-50, -18);
    x.lineJoin = "round";
    x.lineCap = "round";
    const body = x.createLinearGradient(0, -10, 0, 58);
    body.addColorStop(0, p.unicorn[0]);
    body.addColorStop(1, p.unicorn[1]);
    // Legs, galloping.
    x.strokeStyle = body;
    x.lineWidth = 4.6;
    x.beginPath();
    for (const leg of UNICORN_LEGS) {
      const kick = 0.2 * Math.sin(t * TAU * 1.6 + leg[0]![0]);
      const [ox, oy] = leg[0]!;
      leg.forEach(([lx, ly], j) => {
        const cs = Math.cos(kick * j);
        const sn = Math.sin(kick * j);
        const px = ox + (lx - ox) * cs - (ly - oy) * sn;
        const py = oy + (lx - ox) * sn + (ly - oy) * cs;
        if (j === 0) x.moveTo(px, py);
        else x.lineTo(px, py);
      });
    }
    x.stroke();
    x.fillStyle = body;
    x.fill(unicorn.body);
    x.strokeStyle = p.unicornLine;
    x.lineWidth = 1.2;
    x.stroke(unicorn.body);
    // Mane and tail.
    x.strokeStyle = p.mane;
    x.lineWidth = 3.2;
    unicorn.hair.forEach((h) => x.stroke(h));
    // The wing beats around its root.
    x.save();
    x.translate(54, 20);
    x.rotate(0.32 * flap);
    x.scale(1, 0.82 + 0.18 * flap);
    x.translate(-54, -20);
    const wing = x.createLinearGradient(20, -30, 55, 20);
    wing.addColorStop(0, p.wing[0]);
    wing.addColorStop(1, p.wing[1]);
    x.fillStyle = wing;
    x.fill(unicorn.wing);
    x.lineWidth = 1;
    x.stroke(unicorn.wing);
    x.restore();
    const horn = x.createLinearGradient(78, -3, 91, -23);
    horn.addColorStop(0, p.gold[1]);
    horn.addColorStop(1, p.gold[0]);
    x.fillStyle = horn;
    x.fill(unicorn.horn);
    x.restore();
  }

  function unicorns(x: Ctx, t: number) {
    FLIGHTS.forEach((f, n) => {
      const dt = t - f.launch;
      if (dt <= 0 || dt >= FLIGHT_TIME) return;
      const now = flight(f, dt);
      const next = flight(f, dt + 0.02);
      const dx = next.at[0] - now.at[0];
      const dy = next.at[1] - now.at[1];
      const flip = dx < 0 ? -1 : 1;
      const angle = Math.max(-0.75, Math.min(0.35, Math.atan2(dy, Math.abs(dx) || 1e-3))) * flip;
      const alpha = seg(now.u, 0, 0.12);
      // A ribbon of light behind it, widest at the unicorn.
      const pts: V2[] = [];
      for (let j = 0; j <= 22; j++) {
        const back = dt - j * 0.02;
        if (back < 0) break;
        pts.push(flight(f, back).at);
      }
      if (pts.length > 2) {
        const left: V2[] = [];
        const right: V2[] = [];
        pts.forEach((pt, j) => {
          const q = pts[Math.min(j + 1, pts.length - 1)]!;
          const r = pts[Math.max(j - 1, 0)]!;
          const tx = r[0] - q[0];
          const ty = r[1] - q[1];
          const len = Math.hypot(tx, ty) || 1;
          const w = 0.75 * now.s * (1 - j / pts.length) ** 0.7;
          left.push([pt[0] - (ty / len) * w, pt[1] + (tx / len) * w]);
          right.push([pt[0] + (ty / len) * w, pt[1] - (tx / len) * w]);
        });
        const tail = pts[pts.length - 1]!;
        const g = x.createLinearGradient(now.at[0], now.at[1], tail[0], tail[1]);
        g.addColorStop(0, rgba(p.glow, 0.7 * alpha));
        g.addColorStop(1, rgba(p.glow, 0));
        x.globalCompositeOperation = p.glowMode;
        x.fillStyle = g;
        x.beginPath();
        left.forEach((pt, j) => (j ? x.lineTo(pt[0], pt[1]) : x.moveTo(pt[0], pt[1])));
        right.reverse().forEach((pt) => x.lineTo(pt[0], pt[1]));
        x.closePath();
        x.fill();
        glowDot(x, now.at[0], now.at[1], 7 * now.s, 0.3 * alpha);
        x.globalCompositeOperation = "source-over";
      }
      // Sparks shed along the way.
      for (let m = 1; m <= 9; m++) {
        const te = m * 0.085;
        const age = dt - te;
        if (age < 0 || age > 0.5) continue;
        const e = flight(f, te).at;
        const jx = Math.sin(m * 12.9898 + n * 78.233) * 1.6;
        const jy = Math.cos(m * 4.1414 + n * 9.17) * 1.2;
        star(x, [e[0] + jx, e[1] + jy + 2.2 * age], 0.9 * (1 - age / 0.5), m % 2 ? p.gold[0] : "#FFFFFF", 1);
      }
      drawUnicorn(x, now.at, angle, flip, now.s, t + n * 0.37, alpha);
    });
  }

  function floor(x: Ctx, w: number, floorY: number, unit: number) {
    // A soft pool on the floor under the stage.
    x.save();
    x.beginPath();
    x.rect(0, floorY, w, 30 * unit);
    x.clip();
    x.translate(w / 2, floorY);
    x.scale(1, 0.2);
    glowDot(x, 0, 0, Math.max(w * 0.5, 60 * unit), 0.16, p.floor);
    x.restore();
    const line = x.createLinearGradient(0, 0, w, 0);
    line.addColorStop(0, rgba(p.floor, 0));
    line.addColorStop(0.5, rgba(p.floor, 0.4));
    line.addColorStop(1, rgba(p.floor, 0));
    x.fillStyle = line;
    x.fillRect(0, floorY - 0.06 * unit, w, Math.max(1, 0.12 * unit));
  }

  /** Slow motes of light, periodic in the loop so it stays seamless. */
  function motes(x: Ctx, t: number, w: number, h: number, unit: number) {
    x.globalCompositeOperation = p.glowMode;
    for (let i = 0; i < 16; i++) {
      const seed = Math.sin(i * 91.7) * 43758.5453;
      const r = seed - Math.floor(seed);
      const y = (1 - ((r * 7.3 + t / CYCLE) % 1)) * 0.62;
      const px = (((i + 0.5) / 16 + 0.04 * Math.sin(TAU * (t / CYCLE + r))) % 1) * w;
      const a = Math.sin(Math.PI * (y / 0.62)) * (0.12 + 0.18 * r);
      glowDot(x, px, y * h, (0.5 + 0.7 * r) * unit, a);
    }
    x.globalCompositeOperation = "source-over";
  }

  function draw(time: number | "still"): Overlay {
    const still = time === "still";
    const T: Times = still ? STILL : { base: time, bubble: time, flow: time, unicorn: time };
    const t = T.base;
    const w = canvas.width;
    const h = canvas.height;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, w, h);
    if (w < 2 || h < 2) return { glint: -1 };
    const unit = h / 100;
    const portrait = h > w;
    const floorY = h * (portrait ? 0.66 : 0.62);
    const cam = still ? { x: 0, zoom: portrait ? 0.74 : 1.1 } : camera(t, portrait);
    const k = unit * cam.zoom;
    const PIVOT = -20;
    const e = w / 2 - cam.x * k;
    const f = floorY + PIVOT * unit - PIVOT * k;

    floor(c, w, f, unit);
    motes(c, time === "still" ? 1.2 : time, w, h, unit);

    // The floor's reflection: the scene mirrored, fading with depth.
    if (mirror.width !== w || mirror.height !== h) {
      mirror.width = w;
      mirror.height = h;
    }
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.globalCompositeOperation = "source-over";
    m.clearRect(0, 0, w, h);
    m.setTransform(k, 0, 0, -k, e, f);
    m.save();
    m.beginPath();
    m.rect(-500, -200, 1000, 200);
    m.clip();
    grounded(m, t, false);
    m.restore();
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.globalCompositeOperation = "destination-in";
    const fade = m.createLinearGradient(0, f, 0, f + 13 * k);
    fade.addColorStop(0, "rgb(0 0 0 / 1)");
    fade.addColorStop(1, "rgb(0 0 0 / 0)");
    m.fillStyle = fade;
    m.fillRect(0, f, w, h - f);
    c.globalAlpha = p.reflection;
    c.drawImage(mirror, 0, 0);
    c.globalAlpha = 1;

    c.setTransform(k, 0, 0, k, e, f);
    // Contact shadows.
    for (const [px, drop] of [
      [startupsX(t), sunk(t, 0.1)],
      [INVESTORS_X, sunk(t, 0)],
    ] as const) {
      const a = 1 - drop / PILLAR_H;
      if (a <= 0) continue;
      c.save();
      c.translate(px, 0);
      c.scale(1, 0.16);
      glowDot(c, 0, 0, 9, 0.22 * a, p.shadow);
      c.restore();
    }
    c.save();
    c.beginPath();
    c.rect(-500, -200, 1000, 200);
    c.clip();
    grounded(c, t, true);
    c.restore();

    const labels = seg(t, 0.38, 0.8) * (1 - seg(t, 4.2, 4.42));
    const rise = 0.6 * (1 - outCubic(seg(t, 0.38, 0.8)));
    text(c, "STARTUPS", [startupsX(t), 4.4 + rise], 2.1, p.label, labels * 0.85, { weight: 700, tracking: 0.22 });
    text(c, "INVESTORS", [INVESTORS_X, 4.4 + rise], 2.1, p.label, labels * 0.85, { weight: 700, tracking: 0.22 });

    flow(c, T.flow);
    bubble(c, T.bubble);
    unicorns(c, T.unicorn);
    c.setTransform(1, 0, 0, 1, 0, 0);
    const g = seg(t, GLINT[0], GLINT[1]);
    return { glint: still || g <= 0 || g >= 1 ? -1 : g };
  }

  return {
    draw,
    theme(dark) {
      p = dark ? DARK : LIGHT;
    },
  };
}
