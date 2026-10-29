/**
 * VittamHub's cinematic loading scene, drawn on a 2D canvas.
 *
 * Step 1: founders push the Startup pillar toward the Investors pillar while a
 * bridge of mentors, community and incubators forms out of light between them.
 * Step 2: once they connect, the glass idea bubble bursts, its little people
 * fall onto the Startup pillar and light it up, and the Investors pillar
 * implodes into three unicorns of light that fly up and become the logo.
 *
 * Every frame is a pure function of time, so the browser plays it live and the
 * same code renders frames for a video export. World units match a 960×540
 * frame at zoom 1; the camera pans and zooms over them.
 */

export const CYCLE = 12;
/** A frame with no motion in it (the logo over the night sky), for reduced motion. */
export const STILL_TIME = 10.8;

/** What the HTML layer on top of the canvas (the official logo and tagline) should show. */
export interface Overlay {
  logo: number;
  logoScale: number;
  /** Position of the light sweep across the logo, 0 → 1; outside that range it's off the logo. */
  glint: number;
  tagline: number;
}

type Ctx = CanvasRenderingContext2D;
type Sprite = HTMLCanvasElement;
type Point = { x: number; y: number };

const VIEW_W = 960;
const VIEW_H = 540;
const FLOOR_Y = 400;
const PILLAR_SCALE = 1.7;
const PILLAR_D =
  "M-33 0H33V7C22 8 15 12 15 22V110C15 120 22 124 33 125V132H-33V125C-22 124 -15 120 -15 110V22C-15 12 -22 8 -33 7Z";
const PILLAR_H = 132 * PILLAR_SCALE;
const PILLAR_TOP = FLOOR_Y - PILLAR_H;
const SHAFT_HALF = 15 * PILLAR_SCALE;
const DECK_Y = PILLAR_TOP + 66 * PILLAR_SCALE;
const STARTUP_X = 340;
const INVESTOR_X = 640;
const BUBBLE = { x: 364, y: 84, r: 62 };
const LOGO_AT = { x: 515, y: -95 };

const GOLD = "255,206,120";
const WARM = "255,238,210";
const BLUE = "126,167,216";
const CYAN = "150,214,255";
const PINK = "249,168,212";
const VIOLET = "182,160,255";
const MINT = "150,236,190";
const WHITE = "255,255,255";

const TAU = Math.PI * 2;
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** Progress of t through [a, b], clamped to 0..1. */
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const inOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
const out = (k: number) => 1 - (1 - k) ** 3;
const easeIn = (k: number) => k * k * k;
const sine = (k: number) => (1 - Math.cos(Math.PI * k)) / 2;
const outBack = (k: number) => 1 + 2.70158 * (k - 1) ** 3 + 1.70158 * (k - 1) ** 2;
/** A bump that rises over [a, b] and falls over [b, c]. */
const pulse = (t: number, a: number, b: number, c: number) => (t < b ? out(seg(t, a, b)) : 1 - seg(t, b, c));
/** Deterministic noise in [0, 1), so every frame at time t looks the same. */
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/* ---------------------------------------------------------------- assets */

interface Assets {
  font: string;
  glow: Record<string, Sprite>;
  skyline: Sprite;
  grain: Sprite;
  reflection: Sprite;
  pillar: Path2D;
  unicorn: Record<keyof typeof UNICORN_D, Path2D>;
}

function canvas(w: number, h: number): Sprite {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

function context(c: Sprite): Ctx {
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2D canvas is not available");
  return ctx;
}

function glowSprite(rgb: string): Sprite {
  const c = canvas(128, 128);
  const g = context(c);
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(0.2, `rgba(${rgb},0.5)`);
  grad.addColorStop(0.55, `rgba(${rgb},0.12)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return c;
}

/** Distant city skyline: the startup ecosystem on the horizon, with a few lit windows. */
function skylineSprite(): Sprite {
  const c = canvas(2400, 200);
  const g = context(c);
  let x = 0;
  let i = 0;
  while (x < 2400) {
    const w = 26 + hash(i) * 56;
    const h = 28 + hash(i + 0.37) ** 1.6 * 150;
    const grad = g.createLinearGradient(0, 200 - h, 0, 200);
    grad.addColorStop(0, "#0d1b3a");
    grad.addColorStop(1, "#060d20");
    g.fillStyle = grad;
    g.fillRect(x, 200 - h, w - 3, h);
    for (let wy = 200 - h + 8; wy < 194; wy += 9) {
      for (let wx = x + 5; wx < x + w - 9; wx += 8) {
        const r = hash(wx * 0.37 + wy * 1.91);
        if (r > 0.78) {
          g.fillStyle = r > 0.93 ? "rgba(255,206,140,0.55)" : "rgba(150,190,255,0.35)";
          g.fillRect(wx, wy, 3, 4);
        }
      }
    }
    if (hash(i + 0.71) > 0.8) {
      g.fillStyle = "rgba(255,120,120,0.7)";
      g.fillRect(x + w / 2 - 1.5, 200 - h - 6, 3, 3);
    }
    x += w;
    i += 1;
  }
  return c;
}

function grainSprite(): Sprite {
  const c = canvas(192, 192);
  const g = context(c);
  const img = g.createImageData(192, 192);
  for (let p = 0; p < img.data.length; p += 4) {
    const v = hash(p * 0.013) * 255;
    img.data[p] = v;
    img.data[p + 1] = v;
    img.data[p + 2] = v;
    img.data[p + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

const UNICORN_D = {
  tailA: "M-15 -4C-24 -9 -30 -4 -33 4C-29 0 -27 2 -26 6C-24 0 -20 -2 -15 1Z",
  tailB: "M-15 -2C-22 -2 -27 3 -28 10C-25 6 -23 6 -21 8C-21 4 -18 1 -15 0Z",
  legsBack: "M-9 5L-16 9L-23 8M-5 6L-11 12L-18 14",
  body: "M-16 -2C-16 -10 -6 -12 4 -11C12 -10 17 -7 17 -1C17 5 12 8 4 8H-8C-14 8 -16 4 -16 -2Z",
  legsFront: "M10 5L15 10L21 9M6 6L9 13L15 14",
  neck: "M8 -9C11 -16 15 -22 19 -26L26 -22C22 -16 19 -9 17 -3Z",
  head: "M17 -27C20 -31 26 -31 29 -27L35 -19C36.5 -17 35 -14.5 32.5 -15L25 -17C21 -18 17 -21 17 -27Z",
  maneB: "M19 -27C15 -29 10 -25 8 -18C11 -21 13 -21 14 -18C15 -22 17 -24 20 -24Z",
  maneA: "M18 -28C13 -27 9 -21 7 -12C10 -15 11 -14 10 -9C13 -15 15 -19 19 -22Z",
  ear: "M20 -29L20.5 -34L23.5 -30Z",
  horn: "M23 -30L31 -42L26 -29.2Z",
  wing: "M2 -9C-2 -22 -10 -31 -22 -34C-18 -30 -17 -28 -19 -25C-14 -25 -12 -23 -14 -19C-9 -19 -6 -16 -7 -12C-3 -12 0 -10 2 -9Z",
  feathers: "M-3 -15L-13 -25M-1 -12L-10 -18",
};

function createAssets(font: string): Assets {
  const glow: Record<string, Sprite> = {};
  for (const rgb of [GOLD, WARM, BLUE, CYAN, PINK, VIOLET, MINT, WHITE]) glow[rgb] = glowSprite(rgb);
  const unicorn = Object.fromEntries(
    Object.entries(UNICORN_D).map(([name, d]) => [name, new Path2D(d)]),
  ) as Assets["unicorn"];
  return {
    font,
    glow,
    skyline: skylineSprite(),
    grain: grainSprite(),
    reflection: canvas(1, 1),
    pillar: new Path2D(PILLAR_D),
    unicorn,
  };
}

function sprite(ctx: Ctx, a: Assets, rgb: string, x: number, y: number, r: number, alpha: number, sx = 1, sy = 1) {
  const s = a.glow[rgb];
  if (!s || alpha <= 0.002 || r <= 0) return;
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.drawImage(s, x - r * sx, y - r * sy, 2 * r * sx, 2 * r * sy);
  ctx.globalAlpha = 1;
}

/* ---------------------------------------------------------------- camera */

interface Cam {
  x: number;
  y: number;
  z: number;
}

const CAM_KEYS: [number, Cam][] = [
  [0, { x: 300, y: 232, z: 1.32 }],
  [0.7, { x: 306, y: 232, z: 1.3 }],
  [3.6, { x: 470, y: 250, z: 1.0 }],
  [4.0, { x: 465, y: 244, z: 1.03 }],
  [4.6, { x: 372, y: 142, z: 1.42 }],
  [5.5, { x: 352, y: 214, z: 1.26 }],
  [6.3, { x: 598, y: 250, z: 1.24 }],
  [6.9, { x: 632, y: 268, z: 1.46 }],
  [8.0, { x: 600, y: 70, z: 1.0 }],
  [9.0, { x: LOGO_AT.x, y: LOGO_AT.y, z: 0.95 }],
  [12, { x: 500, y: -165, z: 0.9 }],
];

/** Cubic Hermite through the keys, so the camera never stops dead between story beats. */
function camera(t: number): Cam {
  const n = CAM_KEYS.length;
  let i = 0;
  while (i < n - 2 && t > (CAM_KEYS[i + 1]?.[0] ?? 0)) i += 1;
  const [t0, p0] = CAM_KEYS[i] ?? CAM_KEYS[0]!;
  const [t1, p1] = CAM_KEYS[i + 1] ?? CAM_KEYS[n - 1]!;
  const prev = CAM_KEYS[i - 1];
  const next = CAM_KEYS[i + 2];
  const k = seg(t, t0, t1);
  const h = t1 - t0;
  const slope = (key: keyof Cam, a?: [number, Cam], b?: [number, Cam]) =>
    a && b ? (b[1][key] - a[1][key]) / (b[0] - a[0]) : 0;
  const k2 = k * k;
  const k3 = k2 * k;
  const herm = (key: keyof Cam) =>
    (2 * k3 - 3 * k2 + 1) * p0[key] +
    (k3 - 2 * k2 + k) * h * slope(key, prev, [t1, p1]) +
    (-2 * k3 + 3 * k2) * p1[key] +
    (k3 - k2) * h * slope(key, [t0, p0], next);
  const cam = { x: herm("x"), y: herm("y"), z: herm("z") };
  // A hand-held drift, plus a jolt when the pillars lock together and when the investors' pillar bursts.
  const jolt = (at: number, amp: number) => {
    const d = t - at;
    return d > 0 && d < 0.6 ? amp * (1 - d / 0.6) ** 2 * Math.sin(d * 55) : 0;
  };
  cam.x += 2.2 * Math.sin(t * 0.7) + 1.1 * Math.sin(t * 1.9) + jolt(3.6, 4);
  cam.y += 1.6 * Math.sin(t * 0.9 + 1) + jolt(3.62, 3) + jolt(6.95, 6);
  return cam;
}

/* --------------------------------------------------------- story timing */

const pushK = (t: number) => inOut(seg(t, 0.7, 3.6));
const startupDx = (t: number) => lerp(-80, 0, pushK(t));
const investorDx = (t: number) => lerp(36, 0, pushK(t));
const walking = (t: number) => Math.min(seg(t, 0.7, 1.0), 1 - seg(t, 3.4, 3.6));
const cheer = (t: number) => out(seg(t, 3.65, 4.0));

const IDEA_PEOPLE = [
  { x: -28, y: 18, rgb: GOLD, slot: 0 },
  { x: -10, y: -4, rgb: PINK, slot: 1 },
  { x: 10, y: 20, rgb: CYAN, slot: 3 },
  { x: 28, y: 0, rgb: VIOLET, slot: 4 },
  { x: 0, y: -26, rgb: MINT, slot: 2 },
];
const LAND_X = [-40, -20, 0, 20, 40];
const BURST = 4.6;

/** Three unicorns fan out (right, up the middle, left) and meet again where the logo appears. */
const UNICORNS = [
  { from: { x: 6, y: -12 }, c1: { x: 920, y: 140 }, c2: { x: 900, y: -330 }, delay: 0, scale: 1.5 },
  { from: { x: -8, y: 4 }, c1: { x: 690, y: -60 }, c2: { x: 380, y: -330 }, delay: 0.18, scale: 1.28 },
  { from: { x: -18, y: 18 }, c1: { x: 400, y: 250 }, c2: { x: 230, y: -170 }, delay: 0.32, scale: 1.12 },
];

function bezier(p0: Point, p1: Point, p2: Point, p3: Point, k: number): Point {
  const m = 1 - k;
  return {
    x: m * m * m * p0.x + 3 * m * m * k * p1.x + 3 * m * k * k * p2.x + k * k * k * p3.x,
    y: m * m * m * p0.y + 3 * m * m * k * p1.y + 3 * m * k * k * p2.y + k * k * k * p3.y,
  };
}

function unicornAt(i: number, t: number): Point {
  const u = UNICORNS[i] ?? UNICORNS[0]!;
  const start = { x: INVESTOR_X + u.from.x, y: DECK_Y + u.from.y };
  return bezier(start, u.c1, u.c2, LOGO_AT, sine(seg(t, 7.0 + u.delay, 9.0)));
}

/* --------------------------------------------------------------- layers */

function drawSky(ctx: Ctx, a: Assets, t: number, horizon: number, s: number, W: number, H: number) {
  const dawn = sine(seg(t, 7.2, 9.6));
  const sky = ctx.createLinearGradient(0, horizon - 900 * s, 0, horizon);
  sky.addColorStop(0, "#02040c");
  sky.addColorStop(0.45, dawn > 0 ? mix("#050c22", "#0c1238", dawn) : "#050c22");
  sky.addColorStop(0.8, mix("#0b1a3c", "#2a2466", dawn));
  sky.addColorStop(1, mix("#16295a", "#7a4f7a", dawn));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // Warm light on the horizon as dawn comes.
  ctx.globalCompositeOperation = "lighter";
  sprite(ctx, a, GOLD, W * 0.55, horizon, 520 * s, 0.1 + 0.32 * dawn, 1.6, 0.45);
  sprite(ctx, a, BLUE, W * 0.45, horizon, 420 * s, 0.22, 1.8, 0.4);
  ctx.globalCompositeOperation = "source-over";
}

function mix(c1: string, c2: string, k: number): string {
  const p = (c: string, i: number) => parseInt(c.slice(1 + i * 2, 3 + i * 2), 16);
  const ch = (i: number) => Math.round(lerp(p(c1, i), p(c2, i), k));
  return `rgb(${ch(0)},${ch(1)},${ch(2)})`;
}

/** Sets a transform for a layer at parallax depth p (0 = infinitely far, 1 = the world plane). */
function layer(ctx: Ctx, cam: Cam, base: number, p: number, W: number, H: number) {
  const z = base * (1 + (cam.z - 1) * p);
  ctx.setTransform(z, 0, 0, z, W / 2 - (cam.x * p + 480 * (1 - p)) * z, H / 2 - (cam.y * p + 270 * (1 - p)) * z);
}

function drawStars(ctx: Ctx, a: Assets, t: number, cam: Cam, base: number, W: number, H: number) {
  layer(ctx, cam, base, 0.12, W, H);
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 150; i += 1) {
    const x = hash(i) * 1500 - 270;
    const y = hash(i + 0.5) * 520 - 120;
    const tw = 0.55 + 0.45 * Math.sin(t * (1 + hash(i + 0.2) * 3) + i);
    const big = hash(i + 0.9) > 0.92;
    const alpha = (0.25 + 0.75 * hash(i + 0.7)) * tw * clamp((400 - y) / 220);
    if (big) sprite(ctx, a, hash(i + 0.3) > 0.5 ? WHITE : CYAN, x, y, 6, alpha * 0.7);
    ctx.fillStyle = `rgba(230,240,255,${alpha.toFixed(3)})`;
    ctx.fillRect(x, y, big ? 1.6 : 1, big ? 1.6 : 1);
  }
  ctx.globalCompositeOperation = "source-over";
}

/** Returns the far horizon's screen y, where the floor begins. */
function drawSkyline(ctx: Ctx, a: Assets, cam: Cam, base: number, W: number, H: number): number {
  const p = 0.45;
  layer(ctx, cam, base, p, W, H);
  // The far horizon lines up with the floor line when the camera is at rest.
  const bottom = FLOOR_Y;
  ctx.globalAlpha = 0.95;
  ctx.drawImage(a.skyline, -720, bottom - 200);
  ctx.globalAlpha = 1;
  // Haze over the skyline so it sits far back.
  const haze = ctx.createLinearGradient(0, bottom - 200, 0, bottom);
  haze.addColorStop(0, "rgba(22,41,90,0)");
  haze.addColorStop(1, "rgba(40,70,130,0.55)");
  ctx.fillStyle = haze;
  ctx.fillRect(-720, bottom - 200, 2400, 200);
  return ctx.getTransform().d * bottom + ctx.getTransform().f;
}

function drawRays(ctx: Ctx, t: number, W: number, H: number) {
  const dawn = sine(seg(t, 7.2, 9.6));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 4; i += 1) {
    const sway = Math.sin(t * 0.25 + i * 1.7) * 0.06;
    const cx = W * (0.18 + i * 0.22);
    const angle = -0.32 + sway + i * 0.05;
    ctx.save();
    ctx.translate(cx, -H * 0.1);
    ctx.rotate(angle);
    const w = W * (0.06 + 0.03 * hash(i));
    const g = ctx.createLinearGradient(0, 0, 0, H * 1.2);
    const alpha = (0.035 + 0.025 * Math.sin(t * 0.5 + i)) * (1 + dawn * 1.4);
    g.addColorStop(0, `rgba(${dawn > 0.3 ? WARM : CYAN},${alpha.toFixed(3)})`);
    g.addColorStop(1, `rgba(${CYAN},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-w * 0.3, 0);
    ctx.lineTo(w * 0.3, 0);
    ctx.lineTo(w, H * 1.2);
    ctx.lineTo(-w, H * 1.2);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalCompositeOperation = "source-over";
}

/* ---------------------------------------------------------------- world */

function drawFloor(ctx: Ctx, a: Assets, t: number, farY: number, W: number, H: number) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const floor = ctx.createLinearGradient(0, farY, 0, H);
  floor.addColorStop(0, "#0d1d42");
  floor.addColorStop(0.25, "#081430");
  floor.addColorStop(1, "#02050d");
  ctx.fillStyle = floor;
  ctx.fillRect(0, farY, W, Math.max(0, H - farY));
  // The horizon line glows faintly.
  ctx.globalCompositeOperation = "lighter";
  sprite(ctx, a, BLUE, W / 2, farY, W * 0.7, 0.35, 1, 0.025);
  ctx.globalCompositeOperation = "source-over";
}

function deckPoints(t: number): Point[] {
  const dx = investorDx(t);
  return [
    { x: STARTUP_X + SHAFT_HALF + dx, y: DECK_Y },
    { x: 448.5 + dx, y: DECK_Y },
    { x: 490 + dx, y: DECK_Y + 28 },
    { x: 531.5 + dx, y: DECK_Y },
    { x: INVESTOR_X - SHAFT_HALF + dx, y: DECK_Y },
  ];
}

/** The part of a polyline that has grown `k` of its length, starting from its last point. */
function grown(points: Point[], k: number): Point[] {
  const rev = [...points].reverse();
  let total = 0;
  for (let i = 1; i < rev.length; i += 1) total += dist(rev[i - 1]!, rev[i]!);
  let left = total * k;
  const outPts: Point[] = [rev[0]!];
  for (let i = 1; i < rev.length && left > 0; i += 1) {
    const p = rev[i - 1]!;
    const q = rev[i]!;
    const d = dist(p, q);
    const f = Math.min(1, left / d);
    outPts.push({ x: lerp(p.x, q.x, f), y: lerp(p.y, q.y, f) });
    left -= d;
  }
  return outPts;
}

const dist = (p: Point, q: Point) => Math.hypot(q.x - p.x, q.y - p.y);

function stroke(ctx: Ctx, pts: Point[]) {
  if (pts.length < 2) return;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();
}

const SEGMENTS = [
  { label: "Mentors", from: 0, to: 1, grow: [2.9, 3.5], node: { x: 407, y: DECK_Y }, labelY: -30, icon: "mentor" },
  {
    label: "Community",
    from: 1,
    to: 3,
    grow: [2.2, 2.8],
    node: { x: 490, y: DECK_Y + 28 },
    labelY: 42,
    icon: "community",
  },
  {
    label: "Incubators",
    from: 3,
    to: 4,
    grow: [1.5, 2.1],
    node: { x: 573, y: DECK_Y },
    labelY: -30,
    icon: "incubator",
  },
] as const;

function drawBridge(ctx: Ctx, a: Assets, t: number) {
  const pts = deckPoints(t);
  const dx = investorDx(t);
  const lit = 1 + 0.8 * pulse(t, 3.6, 3.75, 4.6);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const s of SEGMENTS) {
    const k = out(seg(t, s.grow[0], s.grow[1]));
    if (k <= 0) continue;
    const part = grown(pts.slice(s.from, s.to + 1), k);
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(${BLUE},${(0.1 * lit).toFixed(3)})`;
    ctx.lineWidth = 26;
    stroke(ctx, part);
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "#5f89c8";
    ctx.lineWidth = 10;
    stroke(ctx, part);
    ctx.strokeStyle = "#a9c7e6";
    ctx.lineWidth = 5;
    stroke(ctx, part);
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(${WHITE},${(0.45 * lit).toFixed(3)})`;
    ctx.lineWidth = 1.6;
    stroke(ctx, part);
    // The growing tip is a spark of light.
    const tip = part[part.length - 1];
    if (tip && k < 1) {
      sprite(ctx, a, CYAN, tip.x, tip.y, 26, 0.9);
      sprite(ctx, a, WHITE, tip.x, tip.y, 8, 1);
    }
    ctx.globalCompositeOperation = "source-over";
  }
  // Light runs across the bridge from the founders to the investors once they connect.
  const run = seg(t, 3.6, 4.3);
  if (run > 0 && run < 1) {
    const all = grown([...pts].reverse(), run);
    const head = all[all.length - 1];
    if (head) {
      ctx.globalCompositeOperation = "lighter";
      for (let j = 1; j < 8; j += 1) {
        const back = grown([...pts].reverse(), Math.max(0, run - j * 0.025));
        const p = back[back.length - 1];
        if (p) sprite(ctx, a, GOLD, p.x, p.y, 18 - j * 1.6, 0.6 - j * 0.07);
      }
      sprite(ctx, a, WHITE, head.x, head.y, 16, 1);
      ctx.globalCompositeOperation = "source-over";
    }
  }
  for (const s of SEGMENTS) {
    const pop = seg(t, s.grow[1] - 0.05, s.grow[1] + 0.3);
    if (pop <= 0) continue;
    const scale = outBack(pop);
    const passed =
      run > 0 ? pulse(t, 3.6 + 0.7 * ((s.node.x - 365) / 250) - 0.05, 3.6 + 0.7 * ((s.node.x - 365) / 250), 4.5) : 0;
    const x = s.node.x + dx;
    const y = s.node.y;
    ctx.globalCompositeOperation = "lighter";
    sprite(ctx, a, passed > 0.01 ? GOLD : BLUE, x, y, 40, 0.45 + passed * 0.6);
    ctx.globalCompositeOperation = "source-over";
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#0a1631";
    ctx.strokeStyle = passed > 0.01 ? "#ffd99a" : "#a9c7e6";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, TAU);
    ctx.fill();
    ctx.stroke();
    drawIcon(ctx, s.icon);
    ctx.restore();
    const show = out(seg(t, s.grow[1] + 0.05, s.grow[1] + 0.45));
    if (show > 0) {
      ctx.save();
      ctx.globalAlpha = show;
      ctx.font = `600 15px ${a.font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(226,236,250,0.92)";
      ctx.fillText(s.label, x, y + s.labelY + (1 - show) * 6);
      ctx.restore();
    }
  }
}

function drawIcon(ctx: Ctx, icon: string) {
  ctx.strokeStyle = "#e4eefb";
  ctx.fillStyle = "#e4eefb";
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (icon === "mentor") {
    ctx.beginPath();
    ctx.moveTo(-8, -2);
    ctx.lineTo(0, -6);
    ctx.lineTo(8, -2);
    ctx.lineTo(0, 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-4.5, 0);
    ctx.lineTo(-4.5, 4);
    ctx.quadraticCurveTo(0, 7, 4.5, 4);
    ctx.lineTo(4.5, 0);
    ctx.moveTo(8, -2);
    ctx.lineTo(8, 3.5);
    ctx.stroke();
  } else if (icon === "community") {
    for (const [cx, r] of [
      [-5, 2.6],
      [5, 2.6],
      [0, 3.2],
    ] as const) {
      ctx.beginPath();
      ctx.arc(cx, -3.5 + (r > 3 ? -0.5 : 1), r, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, 6 + (r > 3 ? 0 : 1), r * 1.7, Math.PI, TAU);
      ctx.fill();
    }
  } else {
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(0, -1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(0, -5, -4, -7.5, -8, -7.5);
    ctx.bezierCurveTo(-8, -3.5, -5, 0, 0, 0);
    ctx.moveTo(0, -1.5);
    ctx.bezierCurveTo(0, -6.5, 4, -9, 8, -9);
    ctx.bezierCurveTo(8, -5, 5, -1.5, 0, -1.5);
    ctx.fill();
  }
}

interface PillarLook {
  label: string;
  stops: [number, string][];
  energy: number;
  charge: number;
  white: number;
  sx: number;
  sy: number;
}

function drawPillar(ctx: Ctx, a: Assets, x: number, look: PillarLook) {
  ctx.save();
  ctx.translate(x, PILLAR_TOP + PILLAR_H / 2);
  ctx.scale(look.sx, look.sy);
  ctx.translate(0, -PILLAR_H / 2);
  ctx.scale(PILLAR_SCALE, PILLAR_SCALE);
  const body = ctx.createLinearGradient(-33, 0, 33, 0);
  for (const [o, c] of look.stops) body.addColorStop(o, c);
  ctx.fillStyle = body;
  ctx.fill(a.pillar);
  const shade = ctx.createLinearGradient(0, 0, 0, 132);
  shade.addColorStop(0, "rgba(255,255,255,0.08)");
  shade.addColorStop(0.2, "rgba(255,255,255,0)");
  shade.addColorStop(0.85, "rgba(0,0,0,0.18)");
  shade.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = shade;
  ctx.fill(a.pillar);
  ctx.save();
  ctx.clip(a.pillar);
  ctx.globalCompositeOperation = "lighter";
  // Glossy specular streak and the light veins inside the stone.
  const spec = ctx.createLinearGradient(-12, 0, -7, 0);
  spec.addColorStop(0, "rgba(255,255,255,0)");
  spec.addColorStop(0.5, "rgba(255,255,255,0.22)");
  spec.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = spec;
  ctx.fillRect(-12, 0, 5, 132);
  const glow = Math.max(look.energy, look.charge);
  if (look.energy > 0) {
    const fill = ctx.createLinearGradient(0, 0, 0, 132);
    fill.addColorStop(0, `rgba(${GOLD},${(0.38 * look.energy).toFixed(3)})`);
    fill.addColorStop(0.6, `rgba(${GOLD},${(0.1 * look.energy).toFixed(3)})`);
    fill.addColorStop(1, `rgba(${GOLD},0)`);
    ctx.fillStyle = fill;
    ctx.fillRect(-33, 0, 66, 132 * Math.min(1, look.energy * 1.2));
  }
  if (glow > 0) {
    ctx.strokeStyle = `rgba(${look.charge > look.energy ? CYAN : GOLD},${(0.75 * glow).toFixed(3)})`;
    ctx.lineWidth = 0.9;
    for (const vx of [-9, 9]) {
      ctx.beginPath();
      ctx.moveTo(vx, 24);
      for (let y = 24; y <= 108; y += 6) ctx.lineTo(vx + Math.sin(y * 0.4 + vx) * 1.4, y);
      ctx.stroke();
    }
  }
  if (look.white > 0) {
    ctx.fillStyle = `rgba(215,238,255,${look.white.toFixed(3)})`;
    ctx.fillRect(-33, 0, 66, 132);
  }
  ctx.restore();
  // Rim light down the right edge, and a bright edge along the capital.
  const rim = ctx.createLinearGradient(-33, 0, 33, 0);
  rim.addColorStop(0.55, `rgba(${CYAN},0)`);
  rim.addColorStop(1, `rgba(${CYAN},0.85)`);
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = rim;
  ctx.lineWidth = 0.9;
  ctx.stroke(a.pillar);
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.moveTo(-32, 0.7);
  ctx.lineTo(32, 0.7);
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
  ctx.save();
  ctx.translate(0, 66);
  ctx.rotate(-Math.PI / 2);
  ctx.font = `700 7.4px ${a.font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = "1.6px";
  if (glow > 0) {
    ctx.shadowColor = `rgba(${look.charge > look.energy ? CYAN : GOLD},${glow.toFixed(3)})`;
    ctx.shadowBlur = 8;
  }
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillText(look.label, 0, 0);
  ctx.restore();
  ctx.restore();
}

/** A founder in silhouette with a rim of blue light, pushing (or cheering). Feet at the origin. */
function drawFounder(ctx: Ctx, a: Assets, x: number, t: number, i: number) {
  const walk = walking(t);
  const phase = TAU * 1.55 * Math.max(0, Math.min(t, 3.6) - 0.7) + i * 1.9;
  const c = cheer(t);
  const lean = lerp(0.52, 0.08, c);
  const hip = { x: -6, y: -42 };
  const leg = (swing: number) => {
    const thigh = 0.28 + swing;
    const knee = { x: hip.x - Math.sin(thigh) * 22, y: hip.y + Math.cos(thigh) * 22 };
    const shin = thigh - 0.25 - Math.max(0, -swing) * 0.9;
    return [hip, knee, { x: knee.x - Math.sin(shin) * 21, y: knee.y + Math.cos(shin) * 21 }];
  };
  const swing = 0.38 * Math.sin(phase) * walk;
  const legs = [leg(swing - 0.05 * (1 - walk)), leg(-swing - 0.4 * (1 - walk) * (1 - c))];
  const shoulder = { x: hip.x + Math.sin(lean) * 34, y: hip.y - Math.cos(lean) * 34 };
  const head = { x: shoulder.x + Math.sin(lean) * 16, y: shoulder.y - Math.cos(lean) * 16 };
  const armAngle = lerp(0.12, -1.25, c) + (c > 0 ? Math.sin(t * 9 + i) * 0.12 * c : 0);
  const elbow = { x: shoulder.x + Math.cos(armAngle + 0.25) * 16, y: shoulder.y + Math.sin(armAngle + 0.25) * 16 };
  const hand = { x: elbow.x + Math.cos(armAngle) * 16, y: elbow.y + Math.sin(armAngle) * 16 };
  const hop = c > 0 && c < 1 ? -Math.sin(c * Math.PI) * 10 : 0;

  ctx.save();
  ctx.translate(x, FLOOR_Y + hop);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const body = (color: string, dx: number, dy: number) => {
    ctx.save();
    ctx.translate(dx, dy);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 9;
    for (const l of legs) stroke(ctx, l);
    ctx.lineWidth = 17;
    stroke(ctx, [hip, shoulder]);
    ctx.lineWidth = 7;
    stroke(ctx, [shoulder, elbow, hand]);
    ctx.beginPath();
    ctx.arc(head.x, head.y, 10.5, 0, TAU);
    ctx.fill();
    ctx.restore();
  };
  body(`rgba(${CYAN},0.9)`, 1.8, -1.4);
  body("#050a17", 0, 0);
  if (i === 0 && walk > 0) {
    ctx.globalCompositeOperation = "lighter";
    sprite(ctx, a, CYAN, hand.x + 3, hand.y, 18, 0.5 * walk);
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.restore();

  // Dust kicked up by their steps.
  if (t > 0.7 && t < 4.2) {
    ctx.globalCompositeOperation = "lighter";
    for (let k = 0; k < 6; k += 1) {
      const born = 0.75 + k * 0.48 + i * 0.16;
      const age = (t - born) / 0.9;
      if (age < 0 || age > 1) continue;
      sprite(ctx, a, BLUE, x - 20 - age * 26, FLOOR_Y - 6 - age * 10, 10 + age * 22, 0.16 * (1 - age));
    }
    ctx.globalCompositeOperation = "source-over";
  }
}

/** A small person made of light: one of the ideas. Feet at the origin. */
function drawIdeaPerson(
  ctx: Ctx,
  a: Assets,
  x: number,
  y: number,
  rgb: string,
  armsUp: number,
  alpha: number,
  scale = 1,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalCompositeOperation = "lighter";
  sprite(ctx, a, rgb, 0, -12, 26, 0.7 * alpha);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "rgb(255,246,230)";
  ctx.fillStyle = "rgb(255,246,230)";
  ctx.lineCap = "round";
  ctx.lineWidth = 3;
  stroke(ctx, [
    { x: -1.6, y: -8 },
    { x: -3.2, y: 0 },
  ]);
  stroke(ctx, [
    { x: 1.6, y: -8 },
    { x: 3.2, y: 0 },
  ]);
  ctx.lineWidth = 6.4;
  stroke(ctx, [
    { x: 0, y: -8 },
    { x: 0, y: -15 },
  ]);
  ctx.lineWidth = 2.6;
  const ay = lerp(-12, -23, armsUp);
  const ax = lerp(8, 6, armsUp);
  stroke(ctx, [
    { x: -ax, y: ay },
    { x: 0, y: -15 },
    { x: ax, y: ay },
  ]);
  ctx.beginPath();
  ctx.arc(0, -20.5, 4.4, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function bubbleCenter(t: number): Point {
  return { x: BUBBLE.x + startupDx(t), y: BUBBLE.y + Math.sin(t * 1.6) * 4 };
}

function ideaStart(i: number, t: number): Point {
  const p = IDEA_PEOPLE[i] ?? IDEA_PEOPLE[0]!;
  const c = bubbleCenter(t);
  return { x: c.x + p.x + Math.sin(t * 1.3 + i) * 3, y: c.y + p.y + 12 + Math.sin(t * 2.1 + i * 2) * 3 };
}

function ideaFall(i: number, t: number): { p: Point; k: number; landedAt: number } {
  const p = IDEA_PEOPLE[i] ?? IDEA_PEOPLE[0]!;
  const t0 = BURST + 0.03 + i * 0.05;
  const t1 = t0 + 0.6;
  const from = ideaStart(i, t0);
  const to = { x: STARTUP_X + (LAND_X[p.slot] ?? 0), y: PILLAR_TOP };
  const k = seg(t, t0, t1);
  return {
    p: { x: lerp(from.x, to.x, sine(k)), y: from.y + (to.y - from.y) * k * k - 34 * k * (1 - k) },
    k,
    landedAt: t1,
  };
}

function drawBubble(ctx: Ctx, a: Assets, t: number) {
  if (t >= BURST) return;
  const c = bubbleCenter(t);
  const tremble = seg(t, 4.15, BURST);
  const wob = Math.sin(t * 46) * 0.05 * tremble;
  const rx = BUBBLE.r * (1 + wob + 0.03 * tremble);
  const ry = BUBBLE.r * (1 - wob + 0.03 * tremble);
  // Thought trail from the pillar up to the bubble.
  ctx.globalCompositeOperation = "lighter";
  for (const [ox, oy, r] of [
    [-20, 76, 7],
    [-29, 92, 4.5],
  ] as const) {
    ctx.strokeStyle = `rgba(${CYAN},0.6)`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(c.x + ox, c.y + oy, r, 0, TAU);
    ctx.stroke();
    sprite(ctx, a, CYAN, c.x + ox, c.y + oy, r * 2.4, 0.18);
  }
  // Inner glow of the ideas.
  sprite(ctx, a, GOLD, c.x, c.y + 6, rx * 1.1, 0.22 + 0.15 * tremble);
  ctx.globalCompositeOperation = "source-over";
  IDEA_PEOPLE.forEach((p, i) => {
    const s = ideaStart(i, t);
    drawIdeaPerson(ctx, a, s.x, s.y, p.rgb, 0.4 + 0.3 * Math.sin(t * 2 + i), 1, 0.95);
  });
  // The glass: a thin film, brighter at the edge (fresnel), with an iridescent rim and specular highlights.
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(rx / BUBBLE.r, ry / BUBBLE.r);
  const r = BUBBLE.r;
  const film = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
  film.addColorStop(0, "rgba(200,225,255,0.05)");
  film.addColorStop(0.7, "rgba(150,195,255,0.08)");
  film.addColorStop(0.92, "rgba(170,205,255,0.22)");
  film.addColorStop(1, "rgba(220,235,255,0.42)");
  ctx.fillStyle = film;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.globalCompositeOperation = "lighter";
  const conic = "createConicGradient" in ctx ? ctx.createConicGradient(t * 0.6, 0, 0) : null;
  if (conic) {
    [PINK, VIOLET, CYAN, MINT, GOLD, PINK].forEach((rgb, i, all) =>
      conic.addColorStop(i / (all.length - 1), `rgba(${rgb},0.75)`),
    );
    ctx.strokeStyle = conic;
  } else {
    ctx.strokeStyle = `rgba(${CYAN},0.7)`;
  }
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, 0, r - 1, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineCap = "round";
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.82, Math.PI * 1.08, Math.PI * 1.38);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.84, Math.PI * 0.1, Math.PI * 0.35);
  ctx.stroke();
  sprite(ctx, a, WHITE, -r * 0.22, -r * 0.78, 5, 0.9);
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();
}

function drawBurst(ctx: Ctx, a: Assets, t: number) {
  const age = t - BURST;
  if (age < 0 || age > 1.4) return;
  const c = bubbleCenter(BURST);
  ctx.globalCompositeOperation = "lighter";
  sprite(ctx, a, WHITE, c.x, c.y, 120 * (0.5 + age), 0.9 * (1 - seg(age, 0, 0.35)));
  const ring = out(seg(age, 0, 0.6));
  if (ring < 1) {
    ctx.strokeStyle = `rgba(${CYAN},${(0.9 * (1 - ring)).toFixed(3)})`;
    ctx.lineWidth = 3 * (1 - ring) + 0.5;
    ctx.beginPath();
    ctx.arc(c.x, c.y, BUBBLE.r * (1 + ring * 1.6), 0, TAU);
    ctx.stroke();
  }
  // Droplets of the film fly off and fall.
  for (let i = 0; i < 28; i += 1) {
    const ang = (i / 28) * TAU + hash(i) * 0.3;
    const sp = 120 + hash(i + 0.4) * 160;
    const life = 0.7 + hash(i + 0.8) * 0.6;
    if (age > life) continue;
    const d = (sp * (1 - Math.exp(-3 * age))) / 3;
    const x = c.x + Math.cos(ang) * (BUBBLE.r + d);
    const y = c.y + Math.sin(ang) * (BUBBLE.r + d) + 180 * age * age;
    const rgb = [PINK, CYAN, VIOLET, GOLD][i % 4] ?? CYAN;
    sprite(ctx, a, rgb, x, y, 7, 0.9 * (1 - age / life));
  }
  ctx.globalCompositeOperation = "source-over";
}

function drawIdeasLanding(ctx: Ctx, a: Assets, t: number) {
  if (t < BURST) return;
  IDEA_PEOPLE.forEach((p, i) => {
    const { p: pos, k, landedAt } = ideaFall(i, t);
    if (k < 1) {
      ctx.globalCompositeOperation = "lighter";
      for (let j = 1; j < 10; j += 1) {
        const back = ideaFall(i, t - j * 0.022);
        if (back.k <= 0) break;
        sprite(ctx, a, p.rgb, back.p.x, back.p.y - 12, 16 - j, 0.55 - j * 0.05);
      }
      ctx.globalCompositeOperation = "source-over";
      drawIdeaPerson(ctx, a, pos.x, pos.y, p.rgb, 0.8, 1, 0.95);
      return;
    }
    const since = t - landedAt;
    const ring = seg(since, 0, 0.4);
    if (ring < 1) {
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(${p.rgb},${(1 - ring).toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y, 4 + ring * 22, 1.5 + ring * 6, 0, 0, TAU);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }
    const bounce = since < 0.3 ? -Math.sin((since / 0.3) * Math.PI) * 5 : 0;
    const arms = out(seg(since, 0.1, 0.45));
    drawIdeaPerson(ctx, a, pos.x, pos.y + bounce, p.rgb, arms * (0.85 + 0.15 * Math.sin(t * 7 + i)), 1, 0.95);
  });
}

/* ------------------------------------------- the investors' transformation */

const CHARGE = [6.0, 6.85] as const;
const EXPLODE = 6.95;

function drawImplosion(ctx: Ctx, a: Assets, t: number) {
  const center = { x: INVESTOR_X, y: DECK_Y };
  ctx.globalCompositeOperation = "lighter";
  // Light is drawn into the pillar while it charges.
  const ch = seg(t, CHARGE[0], EXPLODE);
  if (ch > 0 && ch < 1) {
    for (let i = 0; i < 46; i += 1) {
      const u = (ch * 1.8 + hash(i)) % 1;
      const ang = hash(i + 0.3) * TAU + u * 2.2;
      const r = (1 - easeIn(u)) * (130 + hash(i + 0.6) * 90);
      const rgb = i % 3 === 0 ? GOLD : i % 3 === 1 ? CYAN : VIOLET;
      sprite(
        ctx,
        a,
        rgb,
        center.x + Math.cos(ang) * r,
        center.y + Math.sin(ang) * r * 0.9,
        5 + u * 3,
        0.85 * u * Math.min(1, ch * 4),
      );
    }
  }
  const core = pulse(t, 6.75, 6.97, 7.4);
  sprite(ctx, a, WHITE, center.x, center.y, 30 + core * 110, core);
  sprite(ctx, a, GOLD, center.x, center.y, 60 + core * 160, core * 0.6);
  const age = t - EXPLODE;
  if (age > 0 && age < 1.4) {
    for (const [delay, rgb, reach] of [
      [0, CYAN, 420],
      [0.08, VIOLET, 320],
    ] as const) {
      const k = out(seg(age, delay, delay + 0.8));
      if (k <= 0 || k >= 1) continue;
      ctx.strokeStyle = `rgba(${rgb},${(0.9 * (1 - k) ** 1.5).toFixed(3)})`;
      ctx.lineWidth = 7 * (1 - k) + 1;
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, 20 + reach * k, (20 + reach * k) * 0.75, 0, 0, TAU);
      ctx.stroke();
    }
    // Sparks flung out with drag, drawn as short streaks for motion blur.
    for (let i = 0; i < 70; i += 1) {
      const life = 0.7 + hash(i + 0.9) * 0.7;
      if (age > life) continue;
      const ang = hash(i) * TAU;
      const sp = 180 + hash(i + 0.4) * 300;
      const at = (s: number) => (sp * (1 - Math.exp(-4 * s))) / 4;
      const d0 = at(Math.max(0, age - 0.035));
      const d1 = at(age);
      const rgb = [GOLD, CYAN, PINK, VIOLET, WHITE][i % 5] ?? WHITE;
      ctx.strokeStyle = `rgba(${rgb},${(1 - age / life).toFixed(3)})`;
      ctx.lineWidth = 1.2 + hash(i + 0.2) * 2;
      ctx.beginPath();
      ctx.moveTo(center.x + Math.cos(ang) * d0, center.y + Math.sin(ang) * d0 * 0.8);
      ctx.lineTo(center.x + Math.cos(ang) * d1, center.y + Math.sin(ang) * d1 * 0.8);
      ctx.stroke();
    }
    // Anamorphic lens flare.
    const f = 1 - seg(age, 0, 0.6);
    sprite(ctx, a, CYAN, center.x, center.y, 60, f, 7, 0.09);
    sprite(ctx, a, WHITE, center.x, center.y, 40, f, 5, 0.05);
  }
  ctx.globalCompositeOperation = "source-over";
}

function drawUnicorn(ctx: Ctx, a: Assets, i: number, t: number) {
  const u = UNICORNS[i] ?? UNICORNS[0]!;
  const appear = outBack(seg(t, 6.97 + u.delay * 0.5, 7.35 + u.delay * 0.5));
  if (appear <= 0) return;
  const dissolve = seg(t, 8.6, 9.0);
  if (dissolve >= 1) return;
  const p = unicornAt(i, t);
  const q = unicornAt(i, t + 0.02);
  const vx = q.x - p.x;
  const vy = q.y - p.y;
  const facing = Math.tanh(vx / 2.2) || 1;
  const pitch = clamp(Math.atan2(vy, Math.abs(vx) + 0.001), -0.75, 0.75);
  const scale = u.scale * appear * lerp(1, 0.3, easeIn(dissolve));

  ctx.globalCompositeOperation = "lighter";
  // Rainbow ribbon trail, sampled from where the unicorn just was.
  const trail: Point[] = [];
  for (let j = 0; j < 44; j += 1) trail.push(unicornAt(i, t - j * 0.02));
  const strands = [
    [PINK, -5],
    [VIOLET, 0],
    [CYAN, 5],
  ] as const;
  for (const [rgb, off] of strands) {
    for (let j = 1; j < trail.length; j += 1) {
      const p0 = trail[j - 1]!;
      const p1 = trail[j]!;
      const len = dist(p0, p1) || 1;
      const nx = (-(p1.y - p0.y) / len) * off * scale * 0.7;
      const ny = ((p1.x - p0.x) / len) * off * scale * 0.7;
      const fade = (1 - j / trail.length) * appear * (1 - dissolve);
      ctx.strokeStyle = `rgba(${rgb},${(0.55 * fade).toFixed(3)})`;
      ctx.lineCap = "butt";
      ctx.lineWidth = (4.5 * (1 - j / trail.length) + 0.6) * scale * 0.7;
      ctx.beginPath();
      ctx.moveTo(p0.x + nx, p0.y + ny);
      ctx.lineTo(p1.x + nx, p1.y + ny);
      ctx.stroke();
    }
  }
  for (let j = 0; j < 9; j += 1) {
    const at = trail[4 + j * 4];
    if (!at) continue;
    const tw = 0.5 + 0.5 * Math.sin(t * 20 + j * 2 + i);
    sparkle(
      ctx,
      at.x + (hash(j + i) - 0.5) * 30,
      at.y + (hash(j + i + 0.5) - 0.5) * 30,
      5 * tw * scale * 0.6,
      tw * (1 - dissolve),
    );
  }
  sprite(ctx, a, VIOLET, p.x, p.y - 10 * scale, 70 * scale, 0.55);
  sprite(ctx, a, WHITE, p.x, p.y - 10 * scale, 36 * scale, 0.35 + 0.6 * dissolve);
  ctx.globalCompositeOperation = "source-over";

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(facing * scale, scale);
  ctx.rotate(pitch);
  ctx.translate(-2, 12);
  ctx.globalAlpha = 1 - dissolve * 0.6;
  const U = a.unicorn;
  const bodyFill = ctx.createLinearGradient(0, -30, 0, 10);
  bodyFill.addColorStop(0, "#ffffff");
  bodyFill.addColorStop(1, "#d9d2ff");
  const mane = ctx.createLinearGradient(-30, -30, 20, 10);
  mane.addColorStop(0, "#f9a8d4");
  mane.addColorStop(0.5, "#b4a0ff");
  mane.addColorStop(1, "#8fd3ff");
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const legs = (d: Path2D, back: boolean) => {
    ctx.strokeStyle = back ? "#c9c0ff" : "#ffffff";
    ctx.lineWidth = 3.4;
    ctx.stroke(d);
  };
  const flap = Math.cos(t * TAU * 2.6 + i);
  {
    ctx.fillStyle = mane;
    ctx.fill(U.tailB);
    ctx.fill(U.tailA);
    legs(U.legsBack, true);
    ctx.fillStyle = bodyFill;
    ctx.fill(U.body);
    legs(U.legsFront, false);
    ctx.fill(U.neck);
    ctx.fill(U.head);
    ctx.fillStyle = mane;
    ctx.fill(U.maneB);
    ctx.fill(U.maneA);
    ctx.fillStyle = "#ffffff";
    ctx.fill(U.ear);
    const horn = ctx.createLinearGradient(23, -30, 31, -42);
    horn.addColorStop(0, "#f59e0b");
    horn.addColorStop(1, "#fde68a");
    ctx.fillStyle = horn;
    ctx.fill(U.horn);
    ctx.fillStyle = "#3b3f7a";
    ctx.beginPath();
    ctx.arc(26.5, -24, 1.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(249,168,212,0.8)";
    ctx.beginPath();
    ctx.ellipse(29.5, -19.5, 2, 1.2, 0, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.translate(2, -9);
    ctx.scale(1, lerp(-0.35, 1, (flap + 1) / 2));
    ctx.translate(-2, 9);
    const wing = ctx.createLinearGradient(-22, -34, 2, -9);
    wing.addColorStop(0, "#ffffff");
    wing.addColorStop(1, "#dce6ff");
    ctx.fillStyle = wing;
    ctx.fill(U.wing);
    ctx.strokeStyle = "rgba(150,170,230,0.7)";
    ctx.lineWidth = 0.7;
    ctx.stroke(U.feathers);
    ctx.restore();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 0.6;
    ctx.stroke(U.body);
    ctx.stroke(U.head);
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  // The horn shines.
  ctx.globalCompositeOperation = "lighter";
  const tip = { x: p.x + facing * 30 * scale, y: p.y - 30 * scale };
  sprite(ctx, a, GOLD, tip.x, tip.y, 10 * scale, 0.8);
  ctx.globalCompositeOperation = "source-over";
}

function sparkle(ctx: Ctx, x: number, y: number, r: number, alpha: number) {
  if (alpha <= 0.01 || r <= 0.2) return;
  ctx.strokeStyle = `rgba(255,236,190,${alpha.toFixed(3)})`;
  ctx.lineWidth = Math.max(0.6, r * 0.18);
  ctx.beginPath();
  ctx.moveTo(x - r, y);
  ctx.lineTo(x + r, y);
  ctx.moveTo(x, y - r);
  ctx.lineTo(x, y + r);
  ctx.stroke();
}

function drawEmbers(ctx: Ctx, a: Assets, t: number) {
  const dawn = sine(seg(t, 7.2, 9.6));
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 80; i += 1) {
    const speed = 10 + hash(i + 0.5) * 26;
    const x = hash(i) * 1150 - 90 + Math.sin(t * 0.6 + i) * 12;
    const y = 470 - ((t * speed + hash(i + 0.3) * 980) % 980);
    const tw = 0.6 + 0.4 * Math.sin(t * 3 + i * 1.7);
    const warm = hash(i + 0.8) < 0.35 + dawn * 0.4;
    sprite(ctx, a, warm ? GOLD : CYAN, x, y, 2 + hash(i + 0.6) * 4, 0.55 * tw);
  }
  ctx.globalCompositeOperation = "source-over";
}

/** Everything standing on the floor, so it can be drawn a second time as its reflection. */
function drawStage(ctx: Ctx, a: Assets, t: number) {
  const sdx = startupDx(t);
  const idx = investorDx(t);
  const energy = sine(seg(t, 5.0, 6.0));
  const charge = seg(t, CHARGE[0], CHARGE[1]);
  const implode = easeIn(seg(t, 6.72, EXPLODE));

  ctx.globalCompositeOperation = "lighter";
  sprite(ctx, a, BLUE, INVESTOR_X + idx, DECK_Y, 170, 0.22 * (1 - implode));
  sprite(ctx, a, energy > 0 ? GOLD : BLUE, STARTUP_X + sdx, DECK_Y - 20, 170 + energy * 40, 0.2 + energy * 0.35);
  sprite(ctx, a, CYAN, INVESTOR_X + idx, DECK_Y, 150, charge * 0.5 * (1 - implode));
  ctx.globalCompositeOperation = "source-over";

  drawBridge(ctx, a, t);
  if (t < EXPLODE) {
    const jitter = charge > 0 ? Math.sin(t * 90) * 1.6 * charge : 0;
    drawPillar(ctx, a, INVESTOR_X + idx + jitter, {
      label: "INVESTORS",
      stops: [
        [0, "#0b1730"],
        [0.18, "#1d3a69"],
        [0.36, "#36598f"],
        [0.45, "#7ea7d8"],
        [0.53, "#4a6ea6"],
        [0.76, "#1b355f"],
        [1, "#081226"],
      ],
      energy: 0,
      charge,
      white: Math.max(seg(t, 6.3, 6.85) * 0.22, implode),
      sx: lerp(1, 0.08, implode),
      sy: lerp(1, 0.16, implode),
    });
  }
  drawPillar(ctx, a, STARTUP_X + sdx, {
    label: "STARTUPS",
    stops: [
      [0, "#13284d"],
      [0.18, "#2b4f8b"],
      [0.36, "#5f89c8"],
      [0.45, "#b3cff0"],
      [0.53, "#7ea7d8"],
      [0.76, "#2d5390"],
      [1, "#0e1c37"],
    ],
    energy,
    charge: 0,
    white: 0,
    sx: 1,
    sy: 1,
  });
  // The founders, pushing the Startup pillar.
  [270, 226, 182].forEach((x, i) => drawFounder(ctx, a, x + sdx, t, i));
  // Where the pillars lock together.
  const dock = pulse(t, 3.58, 3.64, 4.1);
  if (dock > 0) {
    ctx.globalCompositeOperation = "lighter";
    sprite(ctx, a, WHITE, STARTUP_X + SHAFT_HALF, DECK_Y, 60 * dock + 10, dock);
    sprite(ctx, a, GOLD, STARTUP_X + SHAFT_HALF, DECK_Y, 120 * dock, dock * 0.6);
    ctx.globalCompositeOperation = "source-over";
  }
}

function drawPost(ctx: Ctx, a: Assets, t: number, W: number, H: number, lite: boolean) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // Foreground bokeh, out of focus and closer than everything else.
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < (lite ? 0 : 9); i += 1) {
    const x = (hash(i) * 1.2 - 0.1 + t * 0.012 * (hash(i + 0.4) - 0.5)) * W;
    const y = (0.1 + hash(i + 0.7) * 0.85) * H;
    sprite(
      ctx,
      a,
      hash(i + 0.2) > 0.5 ? BLUE : GOLD,
      x,
      y,
      (0.06 + hash(i + 0.9) * 0.08) * W,
      0.07 + 0.04 * Math.sin(t + i),
    );
  }
  // Flash as the unicorns become the logo.
  const flash = pulse(t, 8.92, 9.0, 9.3);
  if (flash > 0) {
    ctx.fillStyle = `rgba(255,244,225,${(0.55 * flash).toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
    sprite(ctx, a, WHITE, W / 2, H / 2, W * 0.7, flash);
  }
  ctx.globalCompositeOperation = "source-over";
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.75);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  // Film grain.
  ctx.globalAlpha = lite ? 0 : 0.05;
  ctx.globalCompositeOperation = "overlay";
  const ox = Math.floor(hash(Math.floor(t * 24)) * 192);
  const oy = Math.floor(hash(Math.floor(t * 24) + 0.5) * 192);
  for (let x = -ox; x < W; x += 192) for (let y = -oy; y < H; y += 192) ctx.drawImage(a.grain, x, y);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  const black = Math.max(1 - sine(seg(t, 0, 0.7)), sine(seg(t, 11.3, CYCLE)));
  if (black > 0) {
    ctx.fillStyle = `rgba(1,3,10,${black.toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function drawReflection(ctx: Ctx, a: Assets, t: number, cam: Cam, z: number, horizon: number, W: number, H: number) {
  const r = a.reflection;
  if (r.width !== W || r.height !== H) {
    r.width = W;
    r.height = H;
  }
  const rc = context(r);
  rc.setTransform(1, 0, 0, 1, 0, 0);
  rc.clearRect(0, 0, W, H);
  rc.setTransform(z, 0, 0, -z, W / 2 - cam.x * z, H / 2 + (2 * FLOOR_Y - cam.y) * z);
  drawStage(rc, a, t);
  rc.setTransform(1, 0, 0, 1, 0, 0);
  rc.globalCompositeOperation = "destination-in";
  const fade = rc.createLinearGradient(0, horizon, 0, horizon + 170 * z);
  fade.addColorStop(0, "rgba(0,0,0,1)");
  fade.addColorStop(1, "rgba(0,0,0,0)");
  rc.fillStyle = fade;
  rc.fillRect(0, 0, W, H);
  rc.globalCompositeOperation = "source-over";
  rc.clearRect(0, 0, W, Math.max(0, horizon));
  ctx.globalAlpha = 0.32;
  ctx.drawImage(r, 0, 0);
  ctx.globalAlpha = 1;
}

function overlay(t: number): Overlay {
  const end = 1 - sine(seg(t, 11.2, 11.9));
  return {
    logo: out(seg(t, 8.98, 9.6)) * end,
    logoScale: lerp(0.86, 1, out(seg(t, 8.98, 10))),
    glint: seg(t, 9.75, 10.55),
    tagline: out(seg(t, 9.55, 10.3)) * end,
  };
}

function drawFrame(ctx: Ctx, a: Assets, time: number, lite: boolean): Overlay {
  const t = ((time % CYCLE) + CYCLE) % CYCLE;
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  // A hidden or collapsed loader has a 0×0 canvas, which drawImage rejects.
  if (!W || !H) return overlay(t);
  const base = W / VIEW_W;
  const cam = camera(t);
  const z = base * cam.z;
  const world = () => ctx.setTransform(z, 0, 0, z, W / 2 - cam.x * z, H / 2 - cam.y * z);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  world();
  const horizon = ctx.getTransform().d * FLOOR_Y + ctx.getTransform().f;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawSky(ctx, a, t, horizon, z, W, H);
  drawStars(ctx, a, t, cam, base, W, H);
  const farY = drawSkyline(ctx, a, cam, base, W, H);
  drawRays(ctx, t, W, H);
  drawFloor(ctx, a, t, farY, W, H);

  // Glossy floor: the stage mirrored below the floor line, fading with distance.
  if (!lite) drawReflection(ctx, a, t, cam, z, horizon, W, H);

  world();
  drawEmbers(ctx, a, t);
  drawStage(ctx, a, t);
  drawBubble(ctx, a, t);
  drawBurst(ctx, a, t);
  drawIdeasLanding(ctx, a, t);
  drawImplosion(ctx, a, t);
  for (let i = UNICORNS.length - 1; i >= 0; i -= 1) drawUnicorn(ctx, a, i, t);
  // A soft halo where the logo will sit.
  const halo = out(seg(t, 8.9, 9.6)) * (1 - sine(seg(t, 11.2, 11.9)));
  if (halo > 0) {
    ctx.globalCompositeOperation = "lighter";
    sprite(ctx, a, BLUE, LOGO_AT.x, LOGO_AT.y, 300, 0.35 * halo, 1.4, 0.8);
    ctx.globalCompositeOperation = "source-over";
  }
  drawPost(ctx, a, t, W, H, lite);
  return overlay(t);
}

export interface Scene {
  /**
   * Draws the frame at `time` seconds (any value; it wraps every CYCLE seconds).
   * `lite` skips the floor reflection, bokeh and film grain for slow devices.
   */
  draw(time: number, lite?: boolean): Overlay;
}

export function createScene(target: HTMLCanvasElement, font = "system-ui, sans-serif"): Scene {
  const ctx = context(target);
  const assets = createAssets(font);
  return { draw: (time, lite = false) => drawFrame(ctx, assets, time, lite) };
}

export { VIEW_H, VIEW_W };
