/**
 * Shaders for the loader's film (see ./film.ts). The fragment shader ray-marches
 * the two pillars, the founders and the bridge as signed distance fields, and
 * adds everything else analytically: a wet street with reflections, a storm
 * sky with a city skyline, height fog, searchlight and floodlight beams, glows,
 * rain and embers, and sprites (unicorns, startup people, sparks) that film.ts
 * has already projected to the screen. It finishes with a film grade, grain,
 * vignette and letterbox bars.
 *
 * uD layout (vec4 slots), written every frame by film.ts:
 *   0-38   founders: 3 figures x 13 joints (xyz)
 *   39-40  founders' bounding box (min, max)
 *   41-48  bridge: 4 capsules x (a.xyz + radius, b.xyz)
 *   49-51  bridge nodes (xyz, glow)
 *   52-61  startup people: 5 x (x, y, size, intensity), then 5 x (angle, flip, pose, depth)
 *   62-67  unicorns: 3 x (x, y, size, intensity), then 3 x (angle, flip, flap, depth)
 *   68-82  unicorn trails: 3 x 10 points, two per slot
 *   83-97  startup people trails: 5 x 6 points, two per slot
 *   98-121 sparks: 12 x (x, y, previous x, previous y), then 12 x (size, intensity, cool, depth)
 *   122-124 lens flares (x, y, intensity, -)
 *   125    light pulse along the bridge (xyz, strength)
 *   126    welding tip of the growing bridge (xyz, strength)
 *   127    dock point, where the bridge meets the Startups pillar (xyz, flash)
 */
export const VERTEX_SHADER = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

export const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 uRes;
uniform float uT;
uniform float uQ;
uniform vec3 uCamPos;
uniform vec3 uCamFwd;
uniform vec3 uCamRight;
uniform vec3 uCamUp;
uniform float uFocal;
uniform vec4 uPillars;   // startups x, investors x, startups energy, investors charge
uniform vec4 uFx;        // investors dissolve, eruption beam, shockwave radius, shockwave strength
uniform vec4 uBubble;    // centre, radius (0 = gone)
uniform vec4 uBubbleFx;  // burst, wobble, small bubbles, -
uniform vec4 uLight;     // lightning, lightning cloud u, v, dock flash
uniform vec4 uMisc;      // fade, letterbox, rain, unicorn light
uniform vec4 uD[128];
uniform sampler2D uLabel;
uniform sampler2D uSprite;
out vec4 outColor;

#define PI 3.14159265
const vec3 KEY_DIR = vec3(-0.27, 0.42, -0.87);
const vec3 KEY_COL = vec3(0.30, 0.40, 0.60);
const vec3 WARM = vec3(1.0, 0.68, 0.40);
const vec3 COOL = vec3(0.55, 0.75, 1.0);
const vec3 BLUE_FIRE = vec3(0.35, 0.65, 1.0);
const vec3 GOLD = vec3(1.0, 0.72, 0.35);

// smoothstep that also accepts falling edges (edge0 > edge1), which GLSL leaves undefined.
float ss(float a, float b, float x) { float k = clamp((x - a) / (b - a), 0.0, 1.0); return k * k * (3.0 - 2.0 * k); }
float h11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float h21(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y);
}
float n3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n = i.x + i.y * 57.0 + i.z * 113.0;
  return mix(
    mix(mix(h11(n), h11(n + 1.0), f.x), mix(h11(n + 57.0), h11(n + 58.0), f.x), f.y),
    mix(mix(h11(n + 113.0), h11(n + 114.0), f.x), mix(h11(n + 170.0), h11(n + 171.0), f.x), f.y),
    f.z);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * n2(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return s;
}

float sdBox(vec3 p, vec3 b) { vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }
float sdCap(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h) - r;
}
float smin(float a, float b, float k) { float h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k * 0.25; }

// The I-shaped monolith: a shaft between two caps, with filleted joins. Base centre at the origin.
float sdPillar(vec3 p) {
  float shaft = sdBox(p - vec3(0.0, 6.15, 0.0), vec3(0.82, 5.26, 0.92)) - 0.04;
  float caps = min(sdBox(p - vec3(0.0, 0.45, 0.0), vec3(1.92, 0.41, 1.22)), sdBox(p - vec3(0.0, 11.85, 0.0), vec3(1.92, 0.41, 1.22))) - 0.04;
  return smin(shaft, caps, 0.9);
}

// Investors pillar dissolving into light, top first. Positive = solid stays.
float erodeField(vec3 p) {
  float n = n3(p * 1.15 + vec3(0.0, uT * 0.6, 0.0)) * 0.7 + n3(p * 3.3) * 0.3;
  float thr = uFx.x * 1.7 - 0.55 + (p.y / 12.3) * 0.45;
  return n - thr;
}

float sdFigure(vec3 p, int o) {
  vec3 head = uD[o].xyz, neck = uD[o + 1].xyz, hip = uD[o + 2].xyz;
  float d = length(p - head) - 0.105;
  d = smin(d, sdCap(p, neck, head, 0.05), 0.06);
  d = min(d, sdCap(p, hip, mix(hip, neck, 0.55), 0.12));
  d = smin(d, sdCap(p, mix(hip, neck, 0.5), neck, 0.145), 0.08);
  d = min(d, sdCap(p, uD[o + 3].xyz, uD[o + 4].xyz, 0.05));
  d = min(d, sdCap(p, uD[o + 4].xyz, uD[o + 5].xyz, 0.042));
  d = min(d, sdCap(p, uD[o + 6].xyz, uD[o + 7].xyz, 0.05));
  d = min(d, sdCap(p, uD[o + 7].xyz, uD[o + 8].xyz, 0.042));
  vec3 hl = hip - vec3(0.0, 0.0, 0.09), hr = hip + vec3(0.0, 0.0, 0.09);
  d = min(d, sdCap(p, hl, uD[o + 9].xyz, 0.072));
  d = min(d, sdCap(p, uD[o + 9].xyz, uD[o + 10].xyz, 0.058));
  d = min(d, sdCap(p, hr, uD[o + 11].xyz, 0.072));
  d = min(d, sdCap(p, uD[o + 11].xyz, uD[o + 12].xyz, 0.058));
  return d;
}

float sdBridge(vec3 p) {
  float d = 1e5;
  for (int i = 0; i < 4; i++) {
    vec4 a = uD[41 + i * 2];
    if (a.w > 0.0) d = min(d, sdCap(p, a.xyz, uD[42 + i * 2].xyz, a.w));
  }
  for (int i = 0; i < 3; i++) {
    vec4 n = uD[49 + i];
    if (n.w > 0.01) d = min(d, length(p - n.xyz) - 0.2 * min(n.w, 1.0));
  }
  return d;
}

// x: distance, y: material (1 startups, 2 investors, 3 bridge, 4 founders)
vec2 map(vec3 p) {
  vec2 r = vec2(sdPillar(p - vec3(uPillars.x, 0.0, 0.0)), 1.0);
  if (uFx.x < 0.999) {
    float d = sdPillar(p - vec3(uPillars.y, 0.0, 0.0));
    if (uFx.x > 0.0) d = max(d, -erodeField(p) * 0.9);
    if (d < r.x) r = vec2(d, 2.0);
  }
  float bb = sdBox(p - vec3(0.0, 6.2, 0.0), vec3(6.0, 1.2, 0.6));
  if (bb < r.x) { float d = sdBridge(p); if (d < r.x) r = vec2(d, 3.0); }
  vec3 lo = uD[39].xyz, hi = uD[40].xyz;
  float fb = sdBox(p - (lo + hi) * 0.5, (hi - lo) * 0.5);
  if (fb < r.x) {
    float d = min(sdFigure(p, 0), min(sdFigure(p, 13), sdFigure(p, 26)));
    if (d < r.x) r = vec2(d, 4.0);
  }
  return r;
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(1.0, -1.0) * 0.0015;
  return normalize(e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x + e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x);
}

vec2 march(vec3 ro, vec3 rd, float tMax, int maxSteps) {
  float t = 0.05;
  float scale = uFx.x > 0.0 ? 0.7 : 1.0;
  for (int i = 0; i < 110; i++) {
    if (i >= maxSteps) break;
    vec2 h = map(ro + rd * t);
    if (h.x < 0.0012 * t) return vec2(t, h.y);
    t += h.x * scale;
    if (t > tMax) break;
  }
  return vec2(-1.0, 0.0);
}

float softShadow(vec3 ro, vec3 rd) {
  float res = 1.0, t = 0.08;
  for (int i = 0; i < 28; i++) {
    float h = map(ro + rd * t).x;
    res = min(res, 9.0 * h / t);
    t += clamp(h, 0.06, 1.2);
    if (res < 0.02 || t > 30.0) break;
  }
  return clamp(res, 0.0, 1.0);
}

// ---------- sky ----------

vec3 skyline(vec3 rd, vec3 col) {
  float az = atan(rd.x, -rd.z);
  float y = rd.y;
  if (y > 0.16 || y < -0.02) return col;
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    float dens = 16.0 + fk * 13.0;
    float cell = floor(az * dens + fk * 7.3);
    float r = h11(cell + fk * 31.0);
    float hgt = (0.012 + r * r * r * 0.12) * (1.0 - fk * 0.22);
    if (y < hgt) {
      vec3 haze = mix(vec3(0.016, 0.018, 0.026), vec3(0.09, 0.07, 0.06), 0.25 + fk * 0.22);
      vec3 b = haze * (0.8 + 0.4 * ss(0.0, hgt, y));
      vec2 w = vec2(az * dens * 7.0, y * (380.0 - fk * 90.0));
      vec2 wf = fract(w);
      float lit = step(0.7, h21(floor(w) + cell * 3.1)) * step(0.25, wf.x) * step(0.3, wf.y);
      b += WARM * lit * (0.10 - fk * 0.025) * (0.7 + 0.3 * sin(uT * 0.7 + cell));
      if (r > 0.8 && k < 2) {
        float cx = (cell + 0.5 - fk * 7.3) / dens;
        float blink = step(0.5, fract(uT * 0.8 + r * 3.0));
        b += vec3(1.0, 0.1, 0.05) * blink * exp(-pow((az - cx) * 900.0, 2.0) - pow((y - hgt) * 700.0, 2.0)) * 2.0;
      }
      return b;
    }
  }
  return col;
}

vec3 sky(vec3 rd, bool detail) {
  float y = rd.y;
  vec3 zen = vec3(0.006, 0.010, 0.020);
  vec3 hor = vec3(0.072, 0.056, 0.05);
  vec3 col = mix(hor, zen, ss(-0.02, 0.5, y));
  col += KEY_COL * 0.25 * pow(max(dot(rd, KEY_DIR), 0.0), 12.0);
  if (detail && y > -0.02) {
    vec2 cuv = rd.xz / (y + 0.16);
    vec2 drift = vec2(uT * 0.03, uT * 0.012);
    vec2 warp = vec2(fbm(cuv * 0.45 + drift), fbm(cuv * 0.45 + vec2(5.2, 1.3) - drift));
    float c = fbm(cuv * 0.8 + warp * 1.4 + drift);
    float dens = ss(0.36, 0.78, c);
    float under = exp(-y * 6.0);
    vec3 cloud = mix(vec3(0.012, 0.016, 0.026), vec3(0.11, 0.072, 0.055), under);
    cloud *= 0.55 + 0.9 * ss(0.45, 0.95, c);
    float fl = uLight.x * exp(-length(cuv - uLight.yz) * 0.45);
    cloud += vec3(0.55, 0.65, 0.95) * fl * (0.2 + c * 1.5);
    cloud += BLUE_FIRE * uMisc.w * 0.45 * exp(-length(cuv - vec2(0.3, -0.9)) * 0.5) * (0.3 + c);
    col += vec3(0.4, 0.5, 0.8) * fl * 0.1;
    col = mix(col, cloud, dens * ss(-0.02, 0.1, y));
    col = skyline(rd, col);
  }
  return col;
}

// ---------- fog and volumes ----------

vec3 fogColor(vec3 rd) {
  vec3 c = mix(vec3(0.04, 0.05, 0.066), vec3(0.085, 0.064, 0.056), ss(0.35, -0.02, rd.y));
  c += KEY_COL * 0.35 * pow(max(dot(rd, KEY_DIR), 0.0), 6.0);
  c += vec3(0.4, 0.5, 0.8) * uLight.x * 0.08;
  return c * mix(1.0, 0.45, ss(0.0, -0.3, rd.y));
}

// Height fog: thick at street level, thinning with altitude.
float fogAmount(vec3 ro, vec3 rd, float t) {
  float a = 0.028, b = 0.11;
  float k = rd.y * b;
  float f = a * exp(-ro.y * b) * (abs(k) > 1e-4 ? (1.0 - exp(-t * k)) / k : t) + t * 0.0015;
  return clamp(1.0 - exp(-f), 0.0, 1.0);
}

// Light scattered in the fog by a beam from o along unit v (one-sided, from s = 0).
float beam(vec3 ro, vec3 rd, float tMax, vec3 o, vec3 v, float w0, float spread, float fall) {
  vec3 w = ro - o;
  float b = dot(rd, v), d = dot(rd, w), e = dot(v, w);
  float den = max(1.0 - b * b, 1e-3);
  float s = max((e - b * d) / den, 0.0);
  float t = clamp(dot(o + v * s - ro, rd), 0.0, tMax);
  vec3 q = ro + rd * t - (o + v * s);
  float wid = w0 + s * spread;
  return exp(-dot(q, q) / (wid * wid)) * exp(-s * fall) * min(wid / sqrt(den), 6.0);
}

// Glow around a segment a-b, hidden behind tMax.
float segGlow(vec3 ro, vec3 rd, float tMax, vec3 a, vec3 b, float w) {
  vec3 v = b - a;
  float len = length(v);
  if (len < 1e-3) return 0.0;
  v /= len;
  vec3 wv = ro - a;
  float bb = dot(rd, v), d = dot(rd, wv), e = dot(v, wv);
  float den = max(1.0 - bb * bb, 1e-3);
  float s = clamp((e - bb * d) / den, 0.0, len);
  float t = dot(a + v * s - ro, rd);
  if (t < 0.0 || t > tMax + 0.3) return 0.0;
  vec3 q = ro + rd * t - (a + v * s);
  return exp(-dot(q, q) / (w * w));
}

float pointGlow(vec3 ro, vec3 rd, float tMax, vec3 p, float w) {
  float t = dot(p - ro, rd);
  if (t < 0.0 || t > tMax + 0.3) return 0.0;
  vec3 q = ro + rd * t - p;
  return exp(-dot(q, q) / (w * w));
}

vec3 volumes(vec3 ro, vec3 rd, float tMax, bool full) {
  vec3 acc = vec3(0.0);
  // Searchlights sweeping from the city.
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec3 o = vec3(-34.0 + fi * 36.0, 0.0, -70.0 - fi * 12.0);
    float a = sin(uT * (0.22 + fi * 0.07) + fi * 2.1) * 0.42 + (fi - 1.0) * 0.25;
    vec3 v = normalize(vec3(sin(a), 1.25, cos(a) * 0.45 + 0.25));
    acc += vec3(0.55, 0.62, 0.75) * beam(ro, rd, tMax, o, v, 0.7, 0.025, 0.006) * 0.05;
  }
  // Floodlights washing up each pillar.
  acc += WARM * beam(ro, rd, tMax, vec3(uPillars.x, 0.12, 2.35), normalize(vec3(0.0, 1.0, -0.42)), 0.25, 0.16, 0.12) * 0.07;
  acc += COOL * beam(ro, rd, tMax, vec3(uPillars.y, 0.12, 2.35), normalize(vec3(0.0, 1.0, -0.42)), 0.25, 0.16, 0.12) * 0.07 * (1.0 - uFx.x);
  // A work light behind the founders.
  vec3 wl = vec3(uPillars.x - 4.4, 0.55, -1.7);
  float wf = 0.85 + 0.15 * sin(uT * 23.0) * sin(uT * 7.0);
  acc += vec3(1.0, 0.5, 0.2) * pointGlow(ro, rd, tMax, wl, 1.3) * 0.7 * wf;
  acc += vec3(1.0, 0.82, 0.6) * pointGlow(ro, rd, tMax, wl, 0.14) * 3.0;
  // Red aviation lights blinking on the pillar tops.
  float blink = ss(0.0, 0.08, fract(uT * 0.7)) * ss(0.5, 0.35, fract(uT * 0.7));
  for (int i = 0; i < 4; i++) {
    float px = i < 2 ? uPillars.x : uPillars.y;
    if (i >= 2 && uFx.x > 0.3) break;
    vec3 lp = vec3(px + (i % 2 == 0 ? -1.85 : 1.85), 12.42, 1.15);
    acc += vec3(1.0, 0.12, 0.05) * (pointGlow(ro, rd, tMax, lp, 0.06) * 3.5 + pointGlow(ro, rd, tMax, lp, 0.38) * 0.16) * blink;
  }
  // Eruption beam.
  if (uFx.y > 0.0) {
    vec3 o = vec3(uPillars.y, 10.5, 0.0);
    float core = beam(ro, rd, tMax, o, vec3(0.0, 1.0, 0.0), 0.35 + uFx.y * 0.25, 0.004, 0.012);
    float halo = beam(ro, rd, tMax, o, vec3(0.0, 1.0, 0.0), 1.6, 0.03, 0.02);
    acc += (vec3(0.85, 0.95, 1.0) * core * 1.6 + BLUE_FIRE * halo * 0.35) * uFx.y;
  }
  // Bridge: a light conduit with a pulse running along it after docking.
  for (int i = 0; i < 4; i++) {
    vec4 a = uD[41 + i * 2];
    if (a.w <= 0.0) continue;
    vec3 b = uD[42 + i * 2].xyz;
    acc += COOL * segGlow(ro, rd, tMax, a.xyz, b, 0.2) * 0.35;
    acc += vec3(0.3, 0.5, 0.9) * segGlow(ro, rd, tMax, a.xyz, b, 0.75) * 0.06;
  }
  // Welding glow at the growing tip, and the pulse that runs across once docked.
  if (uD[126].w > 0.0) acc += WARM * pointGlow(ro, rd, tMax, uD[126].xyz, 0.3) * uD[126].w * 1.2;
  if (uD[125].w > 0.0) acc += vec3(1.0, 0.9, 0.7) * pointGlow(ro, rd, tMax, uD[125].xyz, 0.55) * uD[125].w * 2.2;
  for (int i = 0; i < 3; i++) {
    vec4 n = uD[49 + i];
    if (n.w > 0.01) acc += COOL * pointGlow(ro, rd, tMax, n.xyz, 0.55) * n.w * 0.6;
  }
  // Dock flash where the bridge meets the Startups pillar.
  if (uLight.w > 0.0) acc += vec3(1.0, 0.85, 0.6) * pointGlow(ro, rd, tMax, uD[127].xyz, 1.4) * uLight.w * 3.0;
  // Startups pillar crowned with light once the ideas land.
  if (uPillars.z > 0.0) acc += GOLD * pointGlow(ro, rd, tMax, vec3(uPillars.x, 12.9, 0.2), 1.8) * uPillars.z * 0.35;
  // Investors charge-up: a glow gathering at the top.
  if (uPillars.w > 0.0 && uFx.x < 1.0) acc += BLUE_FIRE * pointGlow(ro, rd, tMax, vec3(uPillars.y, 12.0, 0.0), 2.4) * pow(uPillars.w, 3.0) * 0.8;
  return acc;
}

// ---------- shading ----------

vec3 floodlight(vec3 p, vec3 n, float px, vec3 col) {
  vec3 lp = vec3(px, 0.12, 2.35);
  vec3 l = lp - p;
  float d2 = dot(l, l);
  l *= inversesqrt(d2);
  float spot = ss(0.55, 0.9, dot(-l, normalize(vec3(0.0, 1.0, -0.42))));
  return col * max(dot(n, l), 0.0) * spot * 9.0 / (1.0 + d2 * 0.55);
}

// Panel seams of the pillar (lp is pillar-local), where its energy shows first.
float seams(vec3 lp) {
  float hz = ss(0.035, 0.0, abs(fract(lp.y * 0.55 + 0.5) - 0.5));
  float vt = ss(0.03, 0.0, abs(abs(lp.x) - 0.42)) * step(0.85, abs(lp.z));
  return max(hz, vt);
}

float cracks(vec3 lp) {
  float c = 1.0 - abs(n3(lp * vec3(2.3, 1.15, 2.3)) * 2.0 - 1.0);
  float d = 1.0 - abs(n3(lp * vec3(4.6, 2.3, 4.6) + 11.0) * 2.0 - 1.0);
  return ss(0.94, 0.995, c) + ss(0.965, 0.998, d) * 0.6;
}

vec3 lighting(vec3 p, vec3 n, vec3 rd, vec3 albedo, float rough, float shadow) {
  vec3 col = vec3(0.0);
  float ndl = max(dot(n, KEY_DIR), 0.0);
  vec3 h = normalize(KEY_DIR - rd);
  float spec = pow(max(dot(n, h), 0.0), mix(90.0, 12.0, rough)) * (1.0 - rough) * 2.0;
  col += KEY_COL * (albedo * ndl + spec) * shadow;
  float rim = pow(1.0 - max(dot(n, -rd), 0.0), 4.0);
  col += KEY_COL * rim * 0.5 * (0.4 + 0.6 * shadow);
  col += albedo * (vec3(0.03, 0.04, 0.06) * (0.6 + 0.4 * n.y) + vec3(0.04, 0.026, 0.018) * (0.5 - 0.5 * n.y));
  col += albedo * floodlight(p, n, uPillars.x, WARM);
  {
    vec3 l = vec3(uPillars.x - 4.4, 0.55, -1.7) - p;
    float d2 = dot(l, l);
    float ndl = max(dot(n, l * inversesqrt(d2)), 0.0);
    col += albedo * vec3(1.0, 0.55, 0.25) * 9.0 * ndl / (1.0 + d2 * 0.9);
    col += vec3(1.0, 0.55, 0.25) * 1.6 * pow(1.0 - max(dot(n, -rd), 0.0), 2.5) * ndl / (1.0 + d2 * 0.5);
  }
  col += albedo * floodlight(p, n, uPillars.y, COOL) * (1.0 - uFx.x);
  col += albedo * vec3(0.5, 0.6, 0.9) * uLight.x * 0.6 * max(n.y * 0.6 + 0.4, 0.0);
  if (uLight.w > 0.0) {
    vec3 l = uD[127].xyz - p;
    float d2 = dot(l, l);
    col += albedo * vec3(1.0, 0.8, 0.55) * uLight.w * 14.0 * max(dot(n, l * inversesqrt(d2)), 0.0) / (1.0 + d2);
  }
  if (uFx.y > 0.0 || uPillars.w > 0.0) {
    vec3 l = vec3(uPillars.y, 11.0, 0.0) - p;
    float d2 = dot(l, l);
    float k = uFx.y * 30.0 + pow(uPillars.w, 3.0) * 6.0 + uFx.w * 30.0;
    col += albedo * BLUE_FIRE * k * max(dot(n, l * inversesqrt(d2)), 0.0) / (1.0 + d2 * 0.3);
  }
  if (uPillars.z > 0.0) {
    vec3 l = vec3(uPillars.x, 13.0, 1.0) - p;
    float d2 = dot(l, l);
    col += albedo * GOLD * uPillars.z * 5.0 * max(dot(n, l * inversesqrt(d2)), 0.0) / (1.0 + d2 * 0.3);
  }
  return col;
}

vec3 shadeObject(vec3 p, vec3 rd, float m, float t, bool full) {
  vec3 n = calcNormal(p);
  vec3 albedo;
  float rough;
  vec3 emit = vec3(0.0);
  if (m < 2.5) {
    bool inv = m > 1.5;
    float px = inv ? uPillars.y : uPillars.x;
    vec3 lp = p - vec3(px, 0.0, 0.0);
    // Dark brushed steel with panel seams and weathering.
    float streak = n2(vec2(lp.x * 9.0 + lp.z * 9.0, lp.y * 0.4));
    float grime = n3(lp * 0.7);
    albedo = vec3(0.06, 0.065, 0.075) * (0.55 + 0.5 * streak) * (0.7 + 0.5 * grime);
    float seam = ss(0.035, 0.0, abs(fract(lp.y * 0.55 + 0.5) - 0.5) - 0.0) * step(abs(lp.x), 0.8);
    albedo *= 1.0 - seam * 0.6;
    rough = 0.35 + 0.3 * grime;
    // Engraved name down the front face.
    if (lp.z > 0.9 && abs(lp.x) < 0.82 && lp.y > 1.3 && lp.y < 11.0) {
      vec2 uv = vec2((lp.y - 1.3) / 9.7, (lp.x + 0.82) / 1.64);
      uv.y = uv.y * 0.5 + (inv ? 0.5 : 0.0);
      float lod = log2(max(t * 1024.0 / (9.7 * uRes.y * uFocal * 0.5), 1.0));
      float txt = textureLod(uLabel, uv, lod).r;
      vec3 tc = inv ? COOL : WARM;
      float glow = inv ? 0.9 + uPillars.w * 3.0 : 0.9 + uPillars.z * 2.5;
      emit += tc * txt * glow * 0.9;
      albedo *= 1.0 - txt * 0.5;
    }
    if (!inv && uPillars.z > 0.0) {
      // The ideas' light pours down from the top through the seams.
      float front = uPillars.z * 13.5;
      float mask = ss(front, front - 1.5, 12.3 - lp.y);
      emit += GOLD * (seams(lp) * 1.1 + cracks(lp) * 1.7 + 0.05) * mask;
    }
    if (inv) {
      if (uPillars.w > 0.0) {
        // Charging from the ground up, like a monster's spines lighting before it breathes fire.
        float front = uPillars.w * 13.0;
        float mask = ss(front, front - 1.2, lp.y);
        float flick = 0.75 + 0.25 * sin(uT * 37.0 + lp.y * 3.0);
        emit += BLUE_FIRE * (seams(lp) * 1.6 + cracks(lp + vec3(0.0, -uT * 0.4, 0.0)) * 3.2 + 0.06 * uPillars.w) * mask * flick;
      }
      if (uFx.x > 0.0) {
        float g = erodeField(p);
        emit += vec3(0.7, 0.9, 1.0) * exp(-max(g, 0.0) * 14.0) * 6.0;
      }
    }
  } else if (m < 3.5) {
    albedo = vec3(0.12, 0.14, 0.18);
    rough = 0.25;
    emit += COOL * 1.4;
    if (uD[125].w > 0.0) emit += vec3(1.0, 0.9, 0.7) * exp(-length(p - uD[125].xyz) * 2.5) * 8.0 * uD[125].w;
  } else {
    // Founders: dark work clothes, caught by the floodlights and the rim light.
    albedo = vec3(0.05, 0.045, 0.042);
    rough = 0.8;
  }
  float sh = full ? softShadow(p + n * 0.02, KEY_DIR) : 1.0;
  vec3 col = lighting(p, n, rd, albedo, rough, sh) + emit;
  vec3 r = reflect(rd, n);
  float fres = 0.04 + 0.96 * pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
  col += sky(r, false) * fres * (1.0 - rough) * 0.6;
  return col;
}

vec3 shadeGround(vec3 p, vec3 rd, float t, bool full, out float wet) {
  vec2 q = p.xz;
  float puddle = ss(0.5, 0.64, n2(q * 0.16 + 3.1)) * ss(90.0, 30.0, t);
  vec2 e = vec2(0.04, 0.0);
  float h0 = n2(q * 2.2) * 0.5 + n2(q * 7.0) * 0.25;
  float hx = n2((q + e.xy) * 2.2) * 0.5 + n2((q + e.xy) * 7.0) * 0.25;
  float hz = n2((q + e.yx) * 2.2) * 0.5 + n2((q + e.yx) * 7.0) * 0.25;
  vec2 g = vec2(hx - h0, hz - h0) / e.x;
  // Raindrop ripples in the puddles.
  vec2 cell = floor(q * 1.6);
  vec2 f = fract(q * 1.6) - 0.5;
  float ph = fract(uT * 0.9 + h21(cell));
  float ring = sin((length(f) - ph * 0.5) * 60.0) * exp(-ph * 4.0) * ss(0.5 * ph + 0.05, 0.5 * ph, length(f));
  vec3 n = normalize(vec3(-g.x * 0.06 * (1.0 - puddle) + f.x * ring * 0.15 * puddle, 1.0, -g.y * 0.06 * (1.0 - puddle) + f.y * ring * 0.15 * puddle));
  vec3 albedo = vec3(0.028, 0.03, 0.034) * (0.6 + 0.8 * n2(q * 0.6)) * (1.0 - puddle * 0.6);
  float sh = full ? softShadow(p + vec3(0.0, 0.02, 0.0), KEY_DIR) : 1.0;
  vec3 col = lighting(p, n, rd, albedo, 0.6, sh);
  if (t > 20.0) {
    vec2 gq = q / 7.0;
    vec2 cell = floor(gq);
    vec2 off = (vec2(h21(cell + 1.0), h21(cell + 2.0)) - 0.5) * 0.6;
    vec2 d = (fract(gq) - 0.5 - off) * 7.0;
    col += WARM * exp(-dot(d, d) * 6.0) * step(0.5, h21(cell + 4.0)) * 0.7 * ss(20.0, 40.0, t);
  }
  // Shockwave and dust rings.
  if (uFx.w > 0.0) {
    float r = length(q - vec2(uPillars.y, 0.0));
    col += BLUE_FIRE * exp(-pow((r - uFx.z) * 1.4, 2.0)) * uFx.w * 3.0;
  }
  // Reflection of the scene, sharp in puddles.
  vec3 rr = reflect(rd, n);
  float fres = 0.04 + 0.96 * pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
  wet = mix(0.16, 0.85, puddle) * mix(fres, 1.0, 0.3);
  vec3 refl;
  float tr = 1e9;
  if (full) {
    vec2 h = march(p + n * 0.03, rr, 60.0, 56);
    if (h.x > 0.0) { tr = h.x; refl = shadeObject(p + rr * h.x, rr, h.y, h.x, false); refl = mix(refl, fogColor(rr), fogAmount(p, rr, h.x)); }
    else refl = sky(rr, true);
  } else {
    refl = sky(rr, false);
  }
  refl += volumes(p + n * 0.03, rr, tr, false);
  return col + refl * wet * mix(0.65, 1.0, puddle);
}

// ---------- the idea bubble ----------

// Soap film over a sphere: thin-film colours, environment reflection and highlights.
// burst opens a hole from the top that sweeps round until the film is gone.
vec3 glassSphere(vec3 ro, vec3 rd, float tHit, vec3 col, vec3 c, float r, float burst, float alpha) {
  vec3 oc = ro - c;
  float b = dot(oc, rd), cc = dot(oc, oc) - r * r;
  float disc = b * b - cc;
  if (disc <= 0.0 || alpha <= 0.0) return col;
  float q = sqrt(disc);
  vec3 hole = normalize(vec3(-0.45, 0.75, 0.5));
  float holeCos = cos(burst * PI * 1.06);
  float t0 = -b - q, t1 = -b + q;
  if (t0 > 0.0 && t0 < tHit) col += GOLD * 0.05 * alpha * (1.0 - burst) * (min(t1, tHit) - t0) / (2.0 * r);
  for (int side = 1; side >= 0; side--) {
    float t = side == 1 ? t1 : t0;
    if (t <= 0.0 || t > tHit) continue;
    vec3 p = ro + rd * t;
    vec3 n = normalize(p - c);
    float cosT = abs(dot(n, rd));
    float hd = dot(n, hole);
    float keep = burst > 0.0 ? 1.0 - ss(holeCos - 0.06, holeCos, hd) : 1.0;
    float rim = burst > 0.0 && burst < 1.0 ? exp(-pow((hd - holeCos) * 28.0, 2.0)) : 0.0;
    float thick = 0.55 + 0.35 * n3(n * 2.6 + vec3(0.0, uT * 0.35, uT * 0.2)) - n.y * 0.18;
    vec3 iri = 0.5 + 0.5 * cos(6.2831 * (thick * (2.2 - cosT * 0.6) + vec3(0.0, 0.33, 0.67)));
    float fres = 0.04 + 0.96 * pow(1.0 - cosT, 4.0);
    vec3 rr = reflect(rd, side == 1 ? -n : n);
    vec3 env = sky(rr, false) * 1.6 + 0.05;
    float spec = pow(max(dot(rr, KEY_DIR), 0.0), 260.0) * 5.0;
    vec3 warm = WARM * pow(max(dot(rr, normalize(vec3(0.1, -0.55, 0.85))), 0.0), 60.0) * 1.4;
    float face = side == 1 ? 0.55 : 1.0;
    float k = keep * alpha * face;
    vec3 film = env * iri * fres * 1.9 + iri * 0.025 + (spec + warm) * (side == 1 ? 0.4 : 1.0);
    film = mix(film, fogColor(rd) * fres, fogAmount(ro, rd, t) * 0.7);
    col = col * (1.0 - fres * 0.3 * k) + film * k + vec3(0.9, 0.95, 1.0) * rim * 0.9 * alpha;
  }
  return col;
}

// ---------- screen space ----------

float segDist(vec2 p, vec2 a, vec2 b, out float h) {
  vec2 pa = p - a, ba = b - a;
  h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0);
  return length(pa - ba * h);
}

// Glow along a trail of n points stored two per slot from uD[base], fading towards the tail.
float trail(vec2 uv, int base, int n, float w0) {
  float acc = 0.0;
  for (int k = 0; k < 9; k++) {
    if (k >= n - 1) break;
    vec4 s0 = uD[base + k / 2];
    vec4 s1 = uD[base + (k + 1) / 2];
    vec2 a = (k % 2 == 0) ? s0.xy : s0.zw;
    vec2 b = ((k + 1) % 2 == 0) ? s1.xy : s1.zw;
    float h;
    float d = segDist(uv, a, b, h);
    float f = 1.0 - (float(k) + h) / float(n - 1);
    float w = w0 * (0.25 + 0.75 * f);
    acc += exp(-d * d / (w * w)) * f;
  }
  return acc;
}

vec3 spriteTap(vec2 uv, vec4 a, vec4 b, float cell, float px, vec2 warp) {
  vec2 d = uv - a.xy;
  float c = cos(b.x), s = sin(b.x);
  vec2 l = vec2(c * d.x + s * d.y, -s * d.x + c * d.y) / a.z;
  l.x *= b.y;
  l += warp;
  if (abs(l.x) > 1.0 || abs(l.y) > 1.0) return vec3(0.0);
  vec2 tc = vec2((l.x * 0.5 + 0.5 + cell) * 0.25, 0.5 - l.y * 0.5);
  float lod = log2(max(128.0 / max(a.z * px, 1.0), 1.0));
  return textureLod(uSprite, tc, lod).rgb;
}

vec3 sprites(vec2 uv, float tHit) {
  vec3 acc = vec3(0.0);
  float px = uRes.y * 0.5;
  // Unicorns of blue fire, with trails.
  for (int i = 0; i < 3; i++) {
    vec4 a = uD[62 + i], b = uD[65 + i];
    if (a.w <= 0.0) continue;
    if (b.w > tHit + 2.0) continue;
    float tr = trail(uv, 68 + i * 5, 10, a.z * 0.07);
    vec2 fq = (uv - a.xy) / a.z;
    vec2 warp = vec2(n2(fq * 7.0 + vec2(uT * 9.0 * b.y, 0.0)) - 0.5, n2(fq * 7.0 + vec2(3.0, -uT * 7.0)) - 0.5) * 0.07;
    vec3 s = mix(spriteTap(uv, a, b, 0.0, px, warp * 0.3), spriteTap(uv, a, b, 1.0, px, warp * 0.3), b.z);
    vec3 s2 = mix(spriteTap(uv, a, b, 0.0, px, warp * 2.0 + vec2(0.07, -0.02)), spriteTap(uv, a, b, 1.0, px, warp * 2.0 + vec2(0.07, -0.02)), b.z);
    float flick = 0.85 + 0.15 * n2(vec2(uT * 12.0, float(i) * 7.0));
    // Flame flickering inside the body, not a flat white shape.
    float flame = n2(fq * 9.0 + vec2(uT * 10.0 * b.y, uT * 3.0)) * 0.6 + n2(fq * 21.0 + vec2(uT * 16.0 * b.y, 0.0)) * 0.4;
    vec3 body = vec3(0.26, 0.5, 1.0) * s.r * (0.3 + 0.85 * flame) + vec3(0.7, 0.85, 1.0) * s.r * ss(0.62, 0.95, flame) * 0.4;
    float edge = s.g * (1.0 - s.r);
    vec3 glow = BLUE_FIRE * edge * 0.75 + vec3(0.18, 0.28, 1.0) * s.b * 0.16 + BLUE_FIRE * s2.g * (1.0 - s.r) * 0.3;
    acc += (body + glow) * a.w * flick;
    acc += mix(BLUE_FIRE, vec3(0.5, 0.35, 1.0), 0.45) * tr * a.w * 0.3;
  }
  // The startup people, glowing gold.
  for (int i = 0; i < 5; i++) {
    vec4 a = uD[52 + i], b = uD[57 + i];
    if (a.w <= 0.0 || b.w > tHit + 0.4) continue;
    vec3 s = spriteTap(uv, a, b, 2.0 + b.z, px, vec2(0.0));
    acc += (vec3(1.0, 0.92, 0.75) * s.r * 1.6 + GOLD * s.g * 1.1 + vec3(1.0, 0.5, 0.2) * s.b * 0.5) * a.w;
    acc += GOLD * trail(uv, 83 + i * 3, 6, a.z * 0.12) * a.w * 0.35;
  }
  // Sparks and droplets, motion-blurred.
  for (int i = 0; i < 12; i++) {
    vec4 a = uD[98 + i], b = uD[110 + i];
    if (b.y <= 0.0 || b.w > tHit + 0.3) continue;
    float h;
    float d = segDist(uv, a.xy, a.zw, h);
    float w = b.x;
    vec3 c = mix(vec3(1.0, 0.75, 0.4), vec3(0.75, 0.9, 1.0), b.z);
    acc += c * (exp(-d * d / (w * w)) * 1.4 + exp(-d * d / (w * w * 16.0)) * 0.15) * b.y;
  }
  // Anamorphic lens flares.
  for (int i = 0; i < 3; i++) {
    vec4 f = uD[122 + i];
    if (f.z <= 0.0) continue;
    vec2 d = uv - f.xy;
    acc += vec3(0.45, 0.65, 1.0) * exp(-abs(d.y) * 160.0) * exp(-abs(d.x) * 3.0) * f.z * 0.3;
    acc += vec3(1.0, 0.9, 0.8) * exp(-dot(d, d) * 140.0) * f.z * 0.3;
  }
  return acc;
}

vec3 weather(vec2 uv, vec2 frag) {
  vec3 acc = vec3(0.0);
  // Rain streaks at three depths, slanted by the wind.
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    vec2 r = vec2(uv.x + uv.y * 0.18, uv.y) * vec2(24.0 + fk * 18.0, 2.2 + fk * 1.3);
    r.y += uT * (9.0 + fk * 4.0);
    r.x += fk * 13.7;
    vec2 cell = floor(r);
    vec2 f = fract(r);
    float rnd = h21(cell);
    if (rnd > 0.72) {
      float x = abs(f.x - 0.2 - rnd * 0.6);
      float streak = ss(0.06, 0.0, x) * ss(0.0, 0.4, f.y) * ss(1.0, 0.6, f.y);
      acc += vec3(0.55, 0.65, 0.8) * streak * (0.05 - fk * 0.012) * (1.0 + uLight.x * 3.0);
    }
  }
  // Embers drifting up.
  for (int k = 0; k < 2; k++) {
    float fk = float(k);
    vec2 e = uv * (5.0 + fk * 4.0) + vec2(sin(uT * 0.3 + fk) * 0.5, -uT * (0.25 + fk * 0.2));
    vec2 ce = floor(e);
    vec2 fe = fract(e) - 0.5;
    float re = h21(ce + 17.0 + fk * 5.0);
    if (re > 0.93) {
      vec2 off = vec2(h21(ce + 3.0), h21(ce + 9.0)) - 0.5;
      float d = length(fe - off * 0.6);
      float tw = 0.5 + 0.5 * sin(uT * 6.0 + re * 40.0);
      float sharp = k == 0 ? 120.0 : 1400.0;
      acc += WARM * exp(-d * d * sharp) * tw * (k == 0 ? 0.12 : 0.5);
    }
  }
  return acc;
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (frag - 0.5 * uRes) / (0.5 * uRes.y);
  float bar = uMisc.y;
  if (abs(uv.y) > 1.0 - bar) { outColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  bool full = uQ < 1.5;
  vec3 ro = uCamPos;
  vec3 rd = normalize(uCamFwd * uFocal + uCamRight * uv.x + uCamUp * uv.y);

  float tG = rd.y < -1e-4 ? -ro.y / rd.y : 1e9;
  vec2 h = march(ro, rd, min(tG, 140.0), full ? 100 : 64);
  vec3 col;
  float tHit = 1e9;
  if (h.x > 0.0) {
    tHit = h.x;
    col = shadeObject(ro + rd * h.x, rd, h.y, h.x, full);
  } else if (tG < 1e8) {
    tHit = tG;
    float wet;
    col = shadeGround(ro + rd * tG, rd, tG, full, wet);
  } else {
    col = sky(rd, true);
  }
  if (tHit < 1e8) col = mix(col, fogColor(rd), fogAmount(ro, rd, tHit));
  if (uBubbleFx.z > 0.0) {
    col = glassSphere(ro, rd, tHit, col, vec3(uPillars.x + 0.05, 12.85 + 0.05 * sin(uT * 2.1), 0.1), 0.16, 0.0, uBubbleFx.z);
    col = glassSphere(ro, rd, tHit, col, vec3(uPillars.x + 0.15, 13.45 + 0.07 * sin(uT * 1.7), 0.1), 0.27, 0.0, uBubbleFx.z);
  }
  if (uBubble.w > 0.0) col = glassSphere(ro, rd, tHit, col, uBubble.xyz, uBubble.w, uBubbleFx.x, 1.0);
  col += volumes(ro, rd, tHit, full);
  col += sprites(uv, tHit);
  col += weather(uv, frag) * uMisc.z;

  // Film finish: exposure, filmic curve, teal-and-amber grade, vignette, grain.
  col *= 1.35;
  col = aces(col);
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(lum), col, 1.08);
  col += vec3(-0.006, 0.004, 0.014) * (1.0 - ss(0.0, 0.35, lum));
  col *= mix(vec3(1.0), vec3(1.04, 1.0, 0.94), ss(0.35, 0.9, lum));
  vec2 vq = frag / uRes - 0.5;
  col *= 1.0 - dot(vq, vq) * 0.9;
  col = pow(max(col, 0.0), vec3(0.95));
  float grain = h21(frag + fract(uT * 13.7) * 431.0) - 0.5;
  col += grain * 0.035;
  col *= uMisc.x;
  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;
