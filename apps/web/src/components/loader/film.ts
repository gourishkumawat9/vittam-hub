import { CAPTIONS, CYCLE } from "./constants";
import { FRAGMENT_SHADER, VERTEX_SHADER } from "./film.glsl";

/**
 * The loader's film, rendered live with WebGL2. This file is the story: every
 * position, pose and light as a pure function of time, so a frame at t always
 * looks the same (the video export renders the same frames). It projects the
 * glowing parts to the screen and hands everything to the shader in film.glsl.ts.
 *
 * World units are roughly metres: the pillars are 12.3 tall and the founders 1.75.
 * x runs right, y up, and the camera looks towards -z.
 */

export interface Label {
  text: string;
  /** Position over the canvas, 0-1 from the left and from the top. */
  x: number;
  y: number;
  opacity: number;
}

/** What the HTML layer over the canvas shows at this moment. */
export interface Overlay {
  logo: number;
  logoScale: number;
  /** Light sweep across the logo, 0-1 while it runs. */
  glint: number;
  tagline: number;
  labels: Label[];
}

export interface Film {
  /** "pending" while the GPU compiles the shader in the background; draw only once "ready". */
  status(): "pending" | "ready" | "failed";
  /** Draws the frame at `time` seconds (wraps every CYCLE). Quality 0 is full; 2 and up skip reflections and shadows. */
  draw(time: number, quality?: number): Overlay;
  dispose(): void;
}

type V3 = [number, number, number];
type V2 = [number, number];

const clamp = (k: number) => Math.min(Math.max(k, 0), 1);
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const smooth = (k: number) => k * k * (3 - 2 * k);
const out = (k: number) => 1 - (1 - k) ** 3;
const sine = (k: number) => (1 - Math.cos(Math.PI * k)) / 2;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** A bump that rises over [a, b] and falls over [b, c]. */
const pulse = (t: number, a: number, b: number, c: number) =>
  t < a || t > c ? 0 : t < b ? out(seg(t, a, b)) : 1 - seg(t, b, c);
/** Deterministic noise in [0, 1). */
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => mul(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
const mix = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const bezier = (p0: V3, p1: V3, p2: V3, p3: V3, k: number): V3 => {
  const u = 1 - k;
  return add(add(mul(p0, u * u * u), mul(p1, 3 * u * u * k)), add(mul(p2, 3 * u * k * k), mul(p3, k * k * k)));
};

// ---------- the story ----------

const PILLAR_TOP = 12.3;
const BRIDGE_Y = 6.4;
/** Where the unicorns meet and the logo appears; the camera centres on it at 9 s. */
const LOGO_AT: V3 = [0, 23, -8];

const startupsX = (t: number) => lerp(-10, -3.6, smooth(seg(t, 0.7, 3.6)));
const investorsX = (t: number) => lerp(4.0, 3.6, smooth(seg(t, 1.2, 3.6)));

interface Shot {
  at: number;
  pos: V3;
  look: V3;
  focal: number;
}

const SHOTS: Shot[] = [
  // Close on the founders straining at the base, then a crane back to reveal the scale.
  { at: 0, pos: [-8.6, 0.45, 4.6], look: [-12.2, 1.6, 0], focal: 1.55 },
  { at: 0.7, pos: [-8.4, 0.55, 5.2], look: [-11.6, 2.2, 0], focal: 1.55 },
  { at: 2.0, pos: [-5.2, 1.5, 13.5], look: [-4.6, 6.8, 0], focal: 1.7 },
  { at: 3.6, pos: [-0.7, 2.0, 14.0], look: [-0.8, 7.4, 0], focal: 1.75 },
  { at: 4.0, pos: [-1.2, 3.6, 13.0], look: [-1.8, 9.6, 0], focal: 1.8 },
  { at: 4.6, pos: [-2.2, 11.4, 8.8], look: [-3.3, 14.8, 0], focal: 1.9 },
  { at: 5.4, pos: [-1.4, 12.6, 9.9], look: [-3.4, 12.8, 0], focal: 1.9 },
  { at: 6.3, pos: [0.4, 1.3, 13.6], look: [3.2, 8.6, 0], focal: 1.8 },
  { at: 6.9, pos: [1.3, 1.05, 12.3], look: [3.4, 9.4, 0], focal: 1.85 },
  // Crane up with the unicorns until only the storm and the logo are left.
  { at: 8.0, pos: [0.4, 6.5, 18], look: [0.6, 17.5, -4], focal: 1.75 },
  { at: 9.0, pos: [0, 15, 19], look: LOGO_AT, focal: 1.8 },
  { at: 12, pos: [0, 16, 18.4], look: [0, 23.6, -8], focal: 1.8 },
];

/** Cubic Hermite through the shots, so the camera never stops dead between beats. */
function shotAt(t: number): { pos: V3; look: V3; focal: number } {
  const n = SHOTS.length;
  let i = 0;
  while (i < n - 2 && t > SHOTS[i + 1]!.at) i += 1;
  const a = SHOTS[i]!;
  const b = SHOTS[i + 1]!;
  const prev = SHOTS[i - 1];
  const next = SHOTS[i + 2];
  const k = seg(t, a.at, b.at);
  const h = b.at - a.at;
  const k2 = k * k;
  const k3 = k2 * k;
  const herm = (pa: number, pb: number, ma: number, mb: number) =>
    (2 * k3 - 3 * k2 + 1) * pa + (k3 - 2 * k2 + k) * h * ma + (-2 * k3 + 3 * k2) * pb + (k3 - k2) * h * mb;
  const slope = (get: (s: Shot) => number, s0?: Shot, s1?: Shot) =>
    s0 && s1 ? (get(s1) - get(s0)) / (s1.at - s0.at) : 0;
  const track = (get: (s: Shot) => number) => herm(get(a), get(b), slope(get, prev, b), slope(get, a, next));
  return {
    pos: [track((s) => s.pos[0]), track((s) => s.pos[1]), track((s) => s.pos[2])],
    look: [track((s) => s.look[0]), track((s) => s.look[1]), track((s) => s.look[2])],
    focal: track((s) => s.focal),
  };
}

interface Camera {
  pos: V3;
  fwd: V3;
  right: V3;
  up: V3;
  focal: number;
}

function camera(t: number): Camera {
  const s = shotAt(t);
  // Hand-held drift, plus a jolt when the pillars lock together and when the investors' pillar erupts.
  const jolt = (at: number, amp: number) => {
    const d = t - at;
    return d > 0 && d < 0.8 ? amp * (1 - d / 0.8) ** 2 * Math.sin(d * 48) : 0;
  };
  const shake = jolt(3.6, 0.05) + jolt(6.95, 0.12);
  const look = add(s.look, [
    0.06 * Math.sin(t * 0.7) + 0.03 * Math.sin(t * 1.9) + shake,
    0.05 * Math.sin(t * 0.9 + 1) + shake * 0.7,
    0,
  ]);
  const fwd = norm(sub(look, s.pos));
  const roll = 0.006 * Math.sin(t * 0.5) + shake * 0.15;
  const r0 = norm(cross(fwd, [0, 1, 0]));
  const u0 = cross(r0, fwd);
  const right = add(mul(r0, Math.cos(roll)), mul(u0, Math.sin(roll)));
  const up = add(mul(u0, Math.cos(roll)), mul(r0, -Math.sin(roll)));
  return { pos: s.pos, fwd, right, up, focal: s.focal };
}

interface Projected {
  x: number;
  y: number;
  depth: number;
  /** Screen size of one world unit at this depth. */
  scale: number;
}

function project(cam: Camera, p: V3): Projected {
  const v = sub(p, cam.pos);
  const depth = Math.max(dot(v, cam.fwd), 0.05);
  const scale = cam.focal / depth;
  return { x: dot(v, cam.right) * scale, y: dot(v, cam.up) * scale, depth, scale };
}

// ----- founders -----

const FOUNDERS = [
  { z: -0.78, back: 0.0, phase: 0.0 },
  { z: 0.06, back: 0.1, phase: 2.1 },
  { z: 0.86, back: -0.04, phase: 4.2 },
];

/** Two-bone IK in the side plane: the middle joint, bent to the side `bend` picks. */
function ik(a: V2, b: V2, l1: number, l2: number, bend: number): V2 {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(l1 - l2) + 1e-4), l1 + l2 - 1e-4);
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const th = Math.atan2(dy, dx) + bend * Math.acos(Math.min(Math.max(cosA, -1), 1));
  return [a[0] + l1 * Math.cos(th), a[1] + l1 * Math.sin(th)];
}

type Pose = V2[]; // head, neck, hip, shoulder, elbowL, handL, elbowR, handR, kneeL, footL, kneeR, footR

function torso(hip: V2, lean: number, look: number): { neck: V2; head: V2; shoulder: V2 } {
  const s = Math.sin(lean);
  const c = Math.cos(lean);
  const neck: V2 = [hip[0] + 0.56 * s, hip[1] + 0.56 * c];
  return {
    neck,
    head: [neck[0] + 0.17 * Math.sin(lean - look), neck[1] + 0.17 * Math.cos(lean - look)],
    shoulder: [hip[0] + 0.5 * s, hip[1] + 0.5 * c],
  };
}

function legs(hip: V2, footL: V2, footR: V2): V2[] {
  return [ik(hip, footL, 0.47, 0.47, 1), footL, ik(hip, footR, 0.47, 0.47, 1), footR];
}

function pushPose(t: number, hand: V2, f: (typeof FOUNDERS)[number]): Pose {
  const lean = 0.86 + 0.03 * Math.sin(t * 9 + f.phase);
  // Steps keep pace with the pillar, so the planted foot doesn't slide.
  const phase = (startupsX(t) + 10) / 0.24 + f.phase;
  const hipY = 0.82 + 0.02 * Math.cos(2 * phase);
  const shoulderY = hipY + 0.5 * Math.cos(lean);
  const dy = hand[1] - shoulderY;
  const reach = Math.sqrt(Math.max(0.25 - dy * dy, 0.01));
  const hip: V2 = [hand[0] - reach - 0.5 * Math.sin(lean) - f.back, hipY];
  const { neck, head, shoulder } = torso(hip, lean, 0.6);
  const foot = (p: number): V2 => [hip[0] - 0.3 + 0.24 * Math.sin(p), 0.06 + 0.07 * Math.max(Math.cos(p), 0)];
  const elbow = ik(shoulder, hand, 0.3, 0.28, -1);
  return [head, neck, hip, shoulder, elbow, hand, elbow, hand, ...legs(hip, foot(phase), foot(phase + Math.PI))];
}

function standPose(i: number, x: number, cheer: number): Pose {
  const hip: V2 = [x - 0.35 - i * 0.12, 0.9];
  const { neck, head, shoulder } = torso(hip, -0.06, 0.4);
  const down: V2 = [shoulder[0] + 0.06, shoulder[1] - 0.55];
  const up: V2 = [shoulder[0] + 0.14, shoulder[1] + 0.56];
  const handL: V2 = i === 1 ? [lerp(down[0], up[0], cheer), lerp(down[1], up[1], cheer)] : down;
  const handR: V2 = i !== 2 ? [lerp(down[0], up[0] + 0.05, cheer), lerp(down[1], up[1], cheer)] : down;
  return [
    head,
    neck,
    hip,
    shoulder,
    ik(shoulder, handL, 0.3, 0.28, -1),
    handL,
    ik(shoulder, handR, 0.3, 0.28, -1),
    handR,
    ...legs(hip, [hip[0] - 0.08, 0.06], [hip[0] + 0.12, 0.06]),
  ];
}

/** Joints in world space, 13 per founder (see the shader's sdFigure). */
function founders(t: number, out3: (i: number, p: V3) => void): [V3, V3] {
  const sx = startupsX(t);
  const hand: V2 = [sx - 1.98, 0.8];
  const k = smooth(seg(t, 3.65, 4.25));
  const cheer = pulse(t, 3.7, 4.0, 5.5);
  let lo: V3 = [1e9, 1e9, 1e9];
  let hi: V3 = [-1e9, -1e9, -1e9];
  FOUNDERS.forEach((f, i) => {
    const a = pushPose(Math.min(t, 3.6), hand, f);
    const b = standPose(i, sx - 1.98, cheer);
    const j = a.map((p, n) => {
      const q = b[n]!;
      return [lerp(p[0], q[0], k), lerp(p[1], q[1], k)] as V2;
    });
    const z = f.z;
    const at = (n: number, dz = 0): V3 => [j[n]![0], j[n]![1], z + dz];
    const joints: V3[] = [
      at(0),
      at(1),
      at(2),
      at(3, -0.17),
      at(4, -0.19),
      at(5, -0.15),
      at(3, 0.17),
      at(6, 0.19),
      at(7, 0.15),
      at(8, -0.1),
      at(9, -0.1),
      at(10, 0.1),
      at(11, 0.1),
    ];
    // Shoulders and elbows sit off the spine; the shader joins them to the torso.
    joints.forEach((p, n) => {
      out3(i * 13 + n, p);
      lo = [Math.min(lo[0], p[0]), Math.min(lo[1], p[1]), Math.min(lo[2], p[2])];
      hi = [Math.max(hi[0], p[0]), Math.max(hi[1], p[1]), Math.max(hi[2], p[2])];
    });
  });
  return [sub(lo, [0.3, 0.3, 0.3]), add(hi, [0.3, 0.3, 0.3])];
}

// ----- bridge -----

function bridgePoints(t: number) {
  const inv = investorsX(t);
  const a: V3 = [inv - 0.86, BRIDGE_Y, 0];
  const n1: V3 = [inv - 2.25, BRIDGE_Y, 0];
  const n2: V3 = [inv - 3.6, BRIDGE_Y - 0.7, 0];
  const n3: V3 = [inv - 4.95, BRIDGE_Y, 0];
  const b: V3 = [startupsX(t) + 0.86, BRIDGE_Y, 0];
  return { a, n1, n2, n3, b };
}

const GROW = [
  [1.5, 2.1],
  [2.2, 2.8],
  [2.9, 3.5],
] as const;

/** Where the bridge's growing end is at time t, or null when nothing is growing. */
function weldTip(t: number): V3 | null {
  const { a, n1, n2, n3, b } = bridgePoints(t);
  const g = GROW.map(([s, e]) => out(seg(t, s, e)));
  if (t >= GROW[0][0] && t < GROW[0][1]) return mix(a, n1, g[0]!);
  if (t >= GROW[1][0] && t < GROW[1][1]) return g[1]! < 0.5 ? mix(n1, n2, g[1]! * 2) : mix(n2, n3, g[1]! * 2 - 1);
  if (t >= GROW[2][0] && t < GROW[2][1]) return mix(n3, b, g[2]!);
  return null;
}

// ----- the idea bubble and its startup people -----

const BUBBLE_R = 1.55;
const bubbleCentre = (t: number): V3 => [startupsX(t) + 0.2, 15.3 + 0.18 * Math.sin(t * 1.3), 0.1];
const BURST = 4.6;
const LAND_X = [-1.25, -0.62, 0, 0.62, 1.25];

interface Person {
  pos: V3;
  height: number;
  pose: number;
  glow: number;
  tilt: number;
}

function person(i: number, t: number): Person {
  const inside = (time: number): V3 => {
    const c = bubbleCentre(time);
    const a = (i * 2 * Math.PI) / 5 + time * 0.7;
    return add(c, [
      Math.cos(a) * 0.62,
      0.12 + Math.sin(a * 1.3) * 0.32 + 0.08 * Math.sin(time * 2 + i),
      Math.sin(a) * 0.42,
    ]);
  };
  const start = BURST + 0.02 + i * 0.04;
  if (t < start) return { pos: inside(t), height: 0.42, pose: 0, glow: 1, tilt: 0 };
  const dur = 0.62 + i * 0.05;
  const k = seg(t, start, start + dur);
  const p0 = inside(start);
  const land: V3 = [startupsX(t) + LAND_X[i]!, PILLAR_TOP + 0.3, 0.35];
  const outward = norm(sub(p0, bubbleCentre(start)));
  const c1 = add(p0, [outward[0] * 1.4, 1.1, outward[2] * 0.8]);
  const c2: V3 = [land[0], land[1] + 1.6, land[2]];
  const u = Math.pow(k, 1.5);
  const landed = seg(t, start + dur, start + dur + 0.5);
  return {
    pos: bezier(p0, c1, c2, land, u),
    height: lerp(0.42, 0.6, k),
    pose: k < 1 ? 0 : landed < 1 ? 0 : 1,
    glow: k < 1 ? 1.25 : lerp(1.25, 0.85, landed),
    tilt: (1 - k) * Math.sin(i * 2.3 + t * 6) * 0.6,
  };
}

// ----- unicorns of blue fire -----

const UNICORN_PATHS: [V3, V3, V3][] = [
  [
    [9, 20, 3],
    [-10, 31, -4],
    [-0.6, 23.2, -8],
  ],
  [
    [3, 28, 1],
    [11, 28, -6],
    [0.5, 23.4, -8],
  ],
  [
    [-3, 16, 5],
    [-9, 20, -5],
    [0, 22.6, -8],
  ],
];
const UNICORN_START = 7.0;
const UNICORN_END = 8.95;

function unicornAt(i: number, t: number): V3 {
  const start = UNICORN_START + i * 0.14;
  const k = sine(seg(t, start, UNICORN_END));
  const [c1, c2, end] = UNICORN_PATHS[i]!;
  const p0: V3 = [investorsX(t), 11.5 + i * 1.4, 0];
  return bezier(p0, c1, c2, end, k);
}

// ---------- assets ----------

// A galloping winged horse facing right, about 100 units long (y down).
const UNICORN_BODY =
  "M68 34C69 26 70 20 72 14C77 15 83 17 90 20C93 20 95 18 94 15C92 10 84 2 79 -3L76 -11L73 -4" +
  "C68 4 62 13 56 20C48 23 36 22 28 22C22 23 18 28 20 34C22 39 26 41 30 42C40 45 54 45 62 42C66 41 68 38 68 34Z";
const UNICORN_HORN = "M77.5 -3L80.5 -5.5L91 -23Z";
const UNICORN_WING = "M57 20C55 2 44 -16 22 -31L28 -21L18 -18L30 -11L20 -7L33 -2L25 3L38 7L33 12L45 14L42 19L52 21Z";
/** Legs as polylines from the body to the hoof, thick at the top. */
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
const UNICORN_HAIR: string[] = [
  "M74 -3C68 -9 60 -8 52 -4",
  "M70 3C63 -1 56 2 48 6",
  "M65 10C58 8 51 12 44 15",
  "M21 26C12 20 4 25 -6 20",
  "M20 29C11 29 4 35 -7 32",
  "M21 32C13 36 7 43 -2 43",
];

function drawUnicorn(g: CanvasRenderingContext2D, wingUp: boolean) {
  g.save();
  g.translate(128, 128);
  g.scale(1.55, 1.55);
  g.translate(-43, -15);
  g.fillStyle = "#fff";
  g.strokeStyle = "#fff";
  g.lineCap = "round";
  g.lineJoin = "round";
  const wing = (alpha: number, angle: number, squash: number) => {
    g.save();
    g.globalAlpha = alpha;
    g.translate(55, 20);
    g.rotate(angle);
    g.scale(1, squash);
    g.translate(-55, -20);
    g.fill(new Path2D(UNICORN_WING));
    g.restore();
  };
  wing(0.5, wingUp ? -0.3 : 0.75, wingUp ? 1 : 0.6);
  g.fill(new Path2D(UNICORN_BODY));
  g.fill(new Path2D(UNICORN_HORN));
  for (const leg of UNICORN_LEGS) {
    leg.slice(1).forEach((p, i) => {
      const a = leg[i]!;
      g.lineWidth = [7, 4.6, 3.6][i] ?? 3.6;
      g.beginPath();
      g.moveTo(a[0], a[1]);
      g.lineTo(p[0], p[1]);
      g.stroke();
    });
  }
  g.lineWidth = 2.6;
  for (const d of UNICORN_HAIR) g.stroke(new Path2D(d));
  wing(1, wingUp ? -0.12 : 1.0, wingUp ? 1 : 0.7);
  g.restore();
}

/** A person 80 units tall, centred in the cell: arms raised, or standing. */
function drawPerson(g: CanvasRenderingContext2D, armsUp: boolean) {
  g.save();
  g.translate(128, 128);
  g.scale(1.6, 1.6);
  g.fillStyle = "#fff";
  g.strokeStyle = "#fff";
  g.lineCap = "round";
  g.lineJoin = "round";
  g.beginPath();
  g.arc(0, -33, 6.2, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(-9, -24);
  g.quadraticCurveTo(0, -27, 9, -24);
  g.lineTo(6.5, -2);
  g.lineTo(-6.5, -2);
  g.closePath();
  g.fill();
  g.lineWidth = 4.2;
  const limb = (pts: V2[]) => {
    g.beginPath();
    g.moveTo(pts[0]![0], pts[0]![1]);
    for (const p of pts.slice(1)) g.lineTo(p[0], p[1]);
    g.stroke();
  };
  if (armsUp) {
    limb([
      [-8, -22],
      [-14, -34],
      [-17, -46],
    ]);
    limb([
      [8, -22],
      [14, -34],
      [17, -46],
    ]);
  } else {
    limb([
      [-8.5, -22],
      [-10.5, -11],
      [-10, -1],
    ]);
    limb([
      [8.5, -22],
      [10.5, -11],
      [10, -1],
    ]);
  }
  g.lineWidth = 5.2;
  limb([
    [-3.6, -3],
    [-5, 18],
    [-6, 38],
  ]);
  limb([
    [3.6, -3],
    [5, 18],
    [6, 38],
  ]);
  g.restore();
}

/** Separable box blur on one channel, three passes for a near-Gaussian falloff. */
function blur(src: Float32Array, size: number, r: number): Float32Array {
  const a = Float32Array.from(src);
  const b = new Float32Array(src.length);
  const pass = (from: Float32Array, to: Float32Array, horizontal: boolean) => {
    const norm = 1 / (2 * r + 1);
    for (let line = 0; line < size; line += 1) {
      let sum = 0;
      const at = (i: number) => {
        const c = Math.min(Math.max(i, 0), size - 1);
        return horizontal ? from[line * size + c]! : from[c * size + line]!;
      };
      for (let i = -r; i <= r; i += 1) sum += at(i);
      for (let i = 0; i < size; i += 1) {
        to[horizontal ? line * size + i : i * size + line] = sum * norm;
        sum += at(i + r + 1) - at(i - r);
      }
    }
  };
  for (let n = 0; n < 3; n += 1) {
    pass(a, b, true);
    pass(b, a, false);
  }
  return a;
}

/** 4 cells of 256²: unicorn wings up, wings down, person arms up, person standing. R sharp, G and B blurred. */
function spriteAtlas(): Uint8Array {
  const size = 256;
  const data = new Uint8Array(1024 * size * 4);
  const cell = document.createElement("canvas");
  cell.width = cell.height = size;
  const g = cell.getContext("2d", { willReadFrequently: true });
  if (!g) throw new Error("2D canvas is not available");
  const draws = [
    () => drawUnicorn(g, true),
    () => drawUnicorn(g, false),
    () => drawPerson(g, true),
    () => drawPerson(g, false),
  ];
  draws.forEach((draw, c) => {
    g.clearRect(0, 0, size, size);
    draw();
    const px = g.getImageData(0, 0, size, size).data;
    const sharp = new Float32Array(size * size);
    for (let i = 0; i < sharp.length; i += 1) sharp[i] = px[i * 4 + 3]! / 255;
    const soft = blur(sharp, size, 4);
    const halo = blur(sharp, size, 12);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const i = y * size + x;
        const o = (y * 1024 + c * size + x) * 4;
        data[o] = sharp[i]! * 255;
        data[o + 1] = Math.min(soft[i]! * 2.2, 1) * 255;
        data[o + 2] = Math.min(halo[i]! * 3, 1) * 255;
        data[o + 3] = 255;
      }
    }
  });
  return data;
}

/** "STARTUPS" over "INVESTORS", read along the pillar from the base up. */
function labelCanvas(font: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const g = c.getContext("2d");
  if (!g) throw new Error("2D canvas is not available");
  g.fillStyle = "#000";
  g.fillRect(0, 0, 1024, 256);
  g.fillStyle = "#fff";
  g.textAlign = "center";
  g.textBaseline = "middle";
  ["STARTUPS", "INVESTORS"].forEach((text, row) => {
    g.font = `700 70px ${font}`;
    const spaced = text.split("").join(" ");
    const w = g.measureText(spaced).width;
    g.save();
    g.translate(512, 64 + row * 128);
    g.scale(Math.min(860 / w, 1.4), 1);
    g.fillText(spaced, 0, 4);
    g.restore();
  });
  return c;
}

// ---------- WebGL ----------

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type);
  if (!s) throw new Error("Could not create a shader");
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

function texture(gl: WebGL2RenderingContext, unit: number, upload: () => void): WebGLTexture {
  const tex = gl.createTexture();
  if (!tex) throw new Error("Could not create a texture");
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  upload();
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

const UNIFORMS = [
  "uRes",
  "uT",
  "uQ",
  "uCamPos",
  "uCamFwd",
  "uCamRight",
  "uCamUp",
  "uFocal",
  "uPillars",
  "uFx",
  "uBubble",
  "uBubbleFx",
  "uLight",
  "uMisc",
  "uD",
  "uLabel",
  "uSprite",
] as const;

/**
 * Throws when WebGL2 isn't available; the loader then keeps its still poster.
 * The shader compiles in the background where the browser supports it
 * (KHR_parallel_shader_compile), so mounting the loader never blocks the page.
 */
export function createFilm(target: HTMLCanvasElement, font = "system-ui, sans-serif", preserve = false): Film {
  const gl = target.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: preserve,
    powerPreference: "high-performance",
  });
  if (!gl) throw new Error("WebGL2 is not available");
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) throw new Error("Could not create a program");
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  const parallel = gl.getExtension("KHR_parallel_shader_compile") as { COMPLETION_STATUS_KHR: number } | null;
  let state: "pending" | "ready" | "failed" = "pending";
  type Locations = Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>;
  let loc = {} as Locations;
  const status = () => {
    if (gl.isContextLost()) state = "failed";
    if (state !== "pending") return state;
    if (parallel && !gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR)) return state;
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      state = "failed";
      if (process.env.NODE_ENV !== "production") {
        console.warn("Loader film shader failed:", gl.getShaderInfoLog(fs) ?? gl.getProgramInfoLog(program));
      }
      return state;
    }
    loc = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(program, n)])) as Locations;
    state = "ready";
    return state;
  };
  const vao = gl.createVertexArray();
  const labels = labelCanvas(font);
  const atlas = spriteAtlas();
  const textures = [
    texture(gl, 0, () => gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, labels)),
    texture(gl, 1, () => gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, atlas)),
  ];
  const data = new Float32Array(128 * 4);

  const draw = (time: number, quality = 0): Overlay => {
    const t = ((time % CYCLE) + CYCLE) % CYCLE;
    const W = gl.drawingBufferWidth;
    const H = gl.drawingBufferHeight;
    const aspect = W / Math.max(H, 1);
    const cam = camera(t);
    const sx = startupsX(t);
    const inv = investorsX(t);
    data.fill(0);
    const put = (slot: number, x: number, y: number, z: number, w: number) => data.set([x, y, z, w], slot * 4);
    const put3 = (slot: number, p: V3, w = 0) => put(slot, p[0], p[1], p[2], w);
    const visible = (p: Projected) => p.depth > 0.3 && Math.abs(p.x) < aspect + 0.6 && Math.abs(p.y) < 1.6;

    // Founders.
    const [lo, hi] = founders(t, (i, p) => put3(i, p));
    put3(39, lo);
    put3(40, hi);

    // Bridge.
    const { a, n1, n2, n3, b } = bridgePoints(t);
    const g = GROW.map(([s, e]) => out(seg(t, s, e)));
    const capsule = (slot: number, from: V3, to: V3, on: boolean) => {
      if (!on) return;
      put3(slot, from, 0.075);
      put3(slot + 1, to);
    };
    capsule(41, a, mix(a, n1, g[0]!), g[0]! > 0);
    capsule(43, n1, mix(n1, n2, clamp(g[1]! * 2)), g[1]! > 0);
    capsule(45, n2, mix(n2, n3, clamp(g[1]! * 2 - 1)), g[1]! > 0.5);
    capsule(47, n3, mix(n3, b, g[2]!), g[2]! > 0);
    const dockFlash = pulse(t, 3.6, 3.63, 4.1);
    const pulseK = seg(t, 3.65, 4.35);
    [n1, n2, n3].forEach((p, i) => {
      const lit = seg(t, 2.05 + i * 0.35, 2.3 + i * 0.35);
      const passing = pulseK > 0 && pulseK < 1 ? Math.exp(-((pulseK - (0.75 - i * 0.25)) ** 2) * 60) : 0;
      put3(49 + i, p, lit * (1 + passing * 1.5));
    });
    if (pulseK > 0 && pulseK < 1) {
      const path = [b, n3, n2, n1, a];
      const lens = path.slice(1).map((p, i) => Math.hypot(...sub(p, path[i]!)));
      let d = pulseK * lens.reduce((s, l) => s + l, 0);
      let at = a;
      for (let i = 0; i < lens.length; i += 1) {
        if (d <= lens[i]!) {
          at = mix(path[i]!, path[i + 1]!, d / lens[i]!);
          break;
        }
        d -= lens[i]!;
      }
      put3(125, at, Math.sin(pulseK * Math.PI));
    }
    const tip = weldTip(t);
    if (tip) put3(126, tip, 0.75 + 0.25 * Math.sin(t * 60));
    put3(127, b, dockFlash);

    // Startup people.
    for (let i = 0; i < 5; i += 1) {
      const p = person(i, t);
      const s = project(cam, p.pos);
      if (!visible(s)) continue;
      put(52 + i, s.x, s.y, p.height * s.scale, p.glow);
      put(57 + i, p.tilt, 1, p.pose, s.depth);
      const falling = t > BURST && p.pose === 0 && t < BURST + 1.2;
      for (let k = 0; k < 6; k += 2) {
        const q0 = project(cam, person(i, t - (k + 1) * 0.035).pos);
        const q1 = project(cam, person(i, t - (k + 2) * 0.035).pos);
        if (falling) put(83 + i * 3 + k / 2, q0.x, q0.y, q1.x, q1.y);
        else put(83 + i * 3 + k / 2, s.x, s.y, s.x, s.y);
      }
    }

    // Unicorns.
    for (let i = 0; i < 3; i += 1) {
      const start = UNICORN_START + i * 0.14;
      const life = seg(t, start, start + 0.25) * (1 - seg(t, UNICORN_END - 0.4, UNICORN_END));
      if (life <= 0) continue;
      const p = unicornAt(i, t);
      const s = project(cam, p);
      const q = project(cam, unicornAt(i, t + 0.03));
      const vx = q.x - s.x;
      const vy = q.y - s.y;
      const right = vx >= 0;
      const angle = Math.max(Math.min(right ? Math.atan2(vy, vx) : -Math.atan2(vy, -vx), 0.7), -0.7);
      put(62 + i, s.x, s.y, 4.0 * s.scale * lerp(0.5, 1, life), life);
      put(65 + i, angle, right ? 1 : -1, 0.5 + 0.5 * Math.sin(t * 11 + i * 2), s.depth);
      for (let k = 0; k < 10; k += 2) {
        const q0 = project(cam, unicornAt(i, t - (k + 1) * 0.035));
        const q1 = project(cam, unicornAt(i, t - (k + 2) * 0.035));
        put(68 + i * 5 + k / 2, q0.x, q0.y, q1.x, q1.y);
      }
    }

    // Sparks: welding at the bridge tip, then the dock burst, then the bubble's droplets.
    for (let i = 0; i < 6; i += 1) {
      const life = 0.55;
      const age = (((t - 1.5 + (i * life) / 6) % life) + life) % life;
      const born = t - age;
      const from = weldTip(born);
      if (!from) continue;
      const v: V3 = [
        (hash(i + Math.floor(born / life) * 7) - 0.5) * 2.4,
        0.6 + hash(i + 3.3) * 1.6,
        (hash(i + 9.1) - 0.5) * 1.6,
      ];
      const at = (k: number): V3 => add(from, [v[0] * k, v[1] * k - 4.9 * k * k, v[2] * k]);
      const s = project(cam, at(age));
      const s0 = project(cam, at(Math.max(age - 0.03, 0)));
      put(98 + i, s.x, s.y, s0.x, s0.y);
      put(110 + i, 0.0035 + 0.02 * s.scale * 0.1, (1 - age / life) * 1.3, 0, s.depth);
    }
    for (let i = 0; i < 6; i += 1) {
      const dir = norm([Math.cos(i * 1.7 + 0.4), Math.sin(i * 2.3) * 0.8 + 0.4, Math.sin(i * 1.7 + 0.4) * 0.6]);
      let from: V3 | null = null;
      let age = 0;
      let cool = 0;
      let speed = 3;
      if (t >= 3.6 && t < 4.4) {
        from = b;
        age = t - 3.6;
        speed = 4 + hash(i) * 3;
      } else if (t >= BURST && t < BURST + 0.7) {
        from = add(bubbleCentre(BURST), mul(dir, BUBBLE_R));
        age = t - BURST;
        cool = 1;
        speed = 2.5 + hash(i + 2) * 2;
      }
      if (!from) continue;
      const origin = from;
      const at = (k: number): V3 =>
        add(origin, [dir[0] * speed * k, dir[1] * speed * k - 4.9 * k * k, dir[2] * speed * k]);
      const s = project(cam, at(age));
      const s0 = project(cam, at(Math.max(age - 0.03, 0)));
      const life = cool ? 0.7 : 0.8;
      put(104 + i, s.x, s.y, s0.x, s0.y);
      put(116 + i, 0.004, (1 - age / life) * (cool ? 0.8 : 1.4), cool, s.depth);
    }

    // Lens flares.
    const flare = (slot: number, p: V3, k: number) => {
      if (k <= 0) return;
      const s = project(cam, p);
      if (visible(s)) put(slot, s.x, s.y, k, 0);
    };
    flare(122, tip ?? b, tip ? 0.35 : dockFlash * 1.5);
    const beam = pulse(t, 6.9, 7.0, 9.2) * (t < 8.6 ? 1 : 1 - seg(t, 8.6, 9.2) * 0.6);
    const shock = 1 - seg(t, 6.95, 7.8);
    flare(123, [inv, PILLAR_TOP, 0], t > 6.9 ? beam * 0.8 + (t < 7.8 ? shock : 0) : 0);
    flare(124, LOGO_AT, pulse(t, 8.85, 8.97, 9.4) * 2);

    // Lightning.
    let lightning = 0;
    let flashAt: V2 = [0, -1.8];
    for (const [at, amp, u, v] of [
      [0.12, 1.5, -1.6, -1.9],
      [0.34, 1.0, -1.4, -2.0],
      [2.45, 0.6, 1.8, -1.7],
      [9.85, 0.7, 1.2, -2.2],
      [10.02, 0.4, 1.0, -2.1],
    ] as const) {
      const d = t - at;
      if (d >= 0 && d < 0.4) {
        const f = amp * Math.exp(-d * 14);
        if (f > lightning) flashAt = [u, v];
        lightning += f;
      }
    }

    gl.viewport(0, 0, W, H);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.uniform2f(loc.uRes, W, H);
    gl.uniform1f(loc.uT, t);
    gl.uniform1f(loc.uQ, quality);
    gl.uniform3fv(loc.uCamPos, cam.pos);
    gl.uniform3fv(loc.uCamFwd, cam.fwd);
    gl.uniform3fv(loc.uCamRight, cam.right);
    gl.uniform3fv(loc.uCamUp, cam.up);
    gl.uniform1f(loc.uFocal, cam.focal);
    gl.uniform4f(loc.uPillars, sx, inv, seg(t, 5.2, 6.3), seg(t, 5.7, 6.92));
    gl.uniform4f(loc.uFx, seg(t, 6.95, 7.7), t > 6.9 ? beam : 0, Math.max(t - 6.95, 0) * 26, t > 6.95 ? shock : 0);
    const c = bubbleCentre(t);
    const wobble = Math.sin(t * 46) * 0.035 * seg(t, 4.15, BURST);
    gl.uniform4f(loc.uBubble, c[0], c[1], c[2], t < BURST + 0.14 ? BUBBLE_R * (1 + wobble) : 0);
    gl.uniform4f(loc.uBubbleFx, seg(t, BURST, BURST + 0.14), wobble, 1 - seg(t, 4.45, 4.55), 0);
    gl.uniform4f(loc.uLight, lightning, flashAt[0], flashAt[1], dockFlash);
    const fade = smooth(seg(t, 0, 0.7)) * (1 - smooth(seg(t, 11.3, 12)));
    gl.uniform4f(loc.uMisc, fade, 0.16, 1, t > 6.9 ? beam * 0.6 + seg(t, 7, 7.5) * (1 - seg(t, 8.8, 9.6)) : 0);
    gl.uniform4fv(loc.uD, data);
    gl.uniform1i(loc.uLabel, 0);
    gl.uniform1i(loc.uSprite, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // HTML layer: bridge captions and the logo.
    const end = 1 - sine(seg(t, 11.2, 11.9));
    const leave = 1 - seg(t, 3.95, 4.25);
    const caption = (text: string, p: V3, show: number): Label => {
      const s = project(cam, p);
      const ok = s.depth > 0.5 ? 1 : 0;
      return { text, x: 0.5 + s.x / (2 * aspect), y: 0.5 - s.y / 2, opacity: show * leave * ok };
    };
    return {
      logo: out(seg(t, 8.98, 9.6)) * end,
      logoScale: lerp(0.86, 1, out(seg(t, 8.98, 10))),
      glint: seg(t, 9.75, 10.55),
      tagline: out(seg(t, 9.55, 10.3)) * end,
      labels: [
        caption(CAPTIONS[0], add(n1, [0.45, 1.05, 0]), out(seg(t, 2.1, 2.4))),
        caption(CAPTIONS[1], add(n2, [0, -0.85, 0]), out(seg(t, 2.5, 2.8))),
        caption(CAPTIONS[2], add(n3, [-0.5, 0.55, 0]), out(seg(t, 2.85, 3.15))),
      ],
    };
  };

  return {
    status,
    draw: (time, quality) => (status() === "ready" ? draw(time, quality) : draw0()),
    dispose: () => {
      textures.forEach((tex) => gl.deleteTexture(tex));
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteVertexArray(vao);
      // Free the context now: browsers cap how many can be alive at once.
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/** The still poster's overlay, for when the film can't draw. */
function draw0(): Overlay {
  return { logo: 1, logoScale: 1, glint: -1, tagline: 1, labels: [] };
}
