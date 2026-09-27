import { type RGB, css, mix, rng } from "../math";
import { INK, PAPER } from "../timeline/tracks";

export type FoliageKind = "alder" | "birch" | "oak";

/**
 * Engraved foliage clumps, pre-rendered once per (kind, season colour,
 * sun side, darkness) and stamped with drawImage. Colour inputs are
 * quantised so a slow scroll regenerates only occasionally.
 */
const SPRITE = 128;
const VARIANTS = 6;

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function blobPath(ctx: CanvasRenderingContext2D, kind: FoliageKind, seed: number) {
  const R = rng(seed);
  const cx = SPRITE / 2;
  const cy = SPRITE / 2;
  const bumps = kind === "oak" ? 9 : kind === "birch" ? 8 : 12;
  const base = kind === "birch" ? 40 : 50;
  const sx = kind === "birch" ? 0.72 : 1;
  const sy = kind === "birch" ? 1.12 : kind === "alder" ? 1.02 : 0.9;
  const pts: [number, number][] = [];
  for (let i = 0; i < bumps; i++) {
    const a = (i / bumps) * Math.PI * 2 + R() * 0.2;
    const lobe = kind === "oak" ? 0.72 + R() * 0.28 : 0.84 + R() * 0.16;
    pts.push([cx + Math.cos(a) * base * lobe * sx, cy + Math.sin(a) * base * lobe * sy]);
  }
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    // Push the control point outward to make a scallop.
    const dx = mx - cx;
    const dy = my - cy;
    const len = Math.hypot(dx, dy) || 1;
    const bulge = kind === "oak" ? 16 : kind === "birch" ? 9 : 12;
    if (i === 0) ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(mx + (dx / len) * bulge, my + (dy / len) * bulge, x1, y1);
  }
  ctx.closePath();
}

function drawClump(
  kind: FoliageKind,
  seed: number,
  fill: RGB,
  shade: -1 | 0 | 1,
  dark: number,
): HTMLCanvasElement {
  const c = makeCanvas(SPRITE, SPRITE);
  const ctx = c.getContext("2d")!;
  const R = rng(seed * 7 + 3);
  const C = SPRITE / 2;
  // Direction the shadow falls within the clump (away from the sun, and down).
  const sx = shade === 0 ? 0 : shade * 0.75;
  const sy = shade === 0 ? 1 : 0.66;

  blobPath(ctx, kind, seed);
  const body = mix(mix(fill, PAPER, 0.3), INK, dark * 0.55);
  ctx.fillStyle = css(body);
  ctx.fill();

  ctx.save();
  blobPath(ctx, kind, seed);
  ctx.clip();

  // Soft tonal core on the shade side, like a watercolour wash under the lines.
  const g = ctx.createRadialGradient(C + sx * 34, C + sy * 30, 6, C + sx * 34, C + sy * 30, 70);
  g.addColorStop(0, css(mix(fill, INK, 0.55), 0.55));
  g.addColorStop(1, css(mix(fill, INK, 0.55), 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SPRITE, SPRITE);

  // Engraver's foliage: small scalloped leaf marks, denser and heavier in shade.
  const lit = new Path2D();
  const deep = new Path2D();
  const step = kind === "birch" ? 6.5 : 7.5;
  for (let y = 6; y < SPRITE - 4; y += step) {
    for (let x = 6; x < SPRITE - 4; x += step) {
      const jx = x + (R() - 0.5) * step * 0.9;
      const jy = y + (R() - 0.5) * step * 0.9;
      const ox = (jx - C) / 56;
      const oy = (jy - C) / 56;
      if (ox * ox + oy * oy > 1.05) continue;
      const tone = clamp01(0.45 + 0.55 * (ox * sx + oy * sy) + (R() - 0.5) * 0.25);
      if (R() > 0.2 + tone * 0.8) continue;
      const path = tone > 0.55 ? deep : lit;
      const r = (kind === "oak" ? 4.6 : kind === "birch" ? 3 : 3.8) * (0.8 + R() * 0.4);
      if (kind === "birch") {
        // Birch: fine drooping flecks.
        path.moveTo(jx, jy - r);
        path.quadraticCurveTo(jx + r * 0.5, jy, jx + r * 0.2, jy + r * 1.1);
      } else {
        // A leaf's upper edge: a short arc, open below.
        path.moveTo(jx - r, jy + r * 0.2);
        path.quadraticCurveTo(jx, jy - r * 1.05, jx + r, jy + r * 0.2);
        if (tone > 0.72) {
          path.moveTo(jx - r * 0.6, jy + r * 0.9);
          path.lineTo(jx + r * 0.5, jy + r * 0.35);
        }
      }
    }
  }
  const ink = css(INK);
  ctx.strokeStyle = ink;
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.4;
  ctx.stroke(lit);
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 2.1;
  ctx.stroke(deep);
  ctx.restore();

  // Contour: light on the lit side, a firm line where the shadow turns.
  blobPath(ctx, kind, seed);
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = ink;
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  if (shade === 0) ctx.rect(0, C, SPRITE, C);
  else if (shade > 0) ctx.rect(C - 10, 0, C + 10, SPRITE);
  else ctx.rect(0, 0, C + 10, SPRITE);
  ctx.clip();
  blobPath(ctx, kind, seed);
  ctx.globalAlpha = 0.95;
  ctx.lineWidth = 2.8;
  ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;
  return c;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

type SpriteSet = HTMLCanvasElement[];
const cache = new Map<string, SpriteSet>();
const order: string[] = [];

export function foliage(kind: FoliageKind, fill: RGB, shade: -1 | 0 | 1, dark: number): SpriteSet {
  const q = (v: number) => Math.round(v / 10) * 10;
  const dq = Math.round(dark * 5) / 5;
  const f: RGB = [q(fill[0]), q(fill[1]), q(fill[2])];
  const key = `${kind}|${f.join(",")}|${shade}|${dq}`;
  const hit = cache.get(key);
  if (hit) {
    // True LRU: a hit moves to the back of the eviction queue.
    const at = order.indexOf(key);
    if (at >= 0) order.splice(at, 1);
    order.push(key);
    return hit;
  }
  const set: SpriteSet = [];
  const base = kind === "oak" ? 300 : kind === "birch" ? 600 : 900;
  for (let i = 0; i < VARIANTS; i++) set.push(drawClump(kind, base + i * 13, f, shade, dq));
  cache.set(key, set);
  order.push(key);
  if (order.length > 48) {
    const old = order.shift()!;
    cache.delete(old);
  }
  return set;
}

let glowSprite: HTMLCanvasElement | null = null;
/** Soft warm point of light for glow-worms, the moon halo and god-ray motes. */
export function glow(): HTMLCanvasElement {
  if (glowSprite) return glowSprite;
  const c = makeCanvas(64, 64);
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,235,1)");
  g.addColorStop(0.18, "rgba(230,245,150,0.85)");
  g.addColorStop(0.5, "rgba(190,220,110,0.22)");
  g.addColorStop(1, "rgba(160,200,90,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  glowSprite = c;
  return c;
}

/** Diagonal engraving hatch used for cast shadows. */
export function hatchPattern(ctx: CanvasRenderingContext2D, color: RGB, alpha: number, gap = 5) {
  const c = makeCanvas(gap * 4, gap * 4);
  const g = c.getContext("2d")!;
  g.strokeStyle = css(color, alpha);
  g.lineWidth = 1;
  g.beginPath();
  for (let i = -4; i < 8; i++) {
    g.moveTo(i * gap, gap * 4);
    g.lineTo(i * gap + gap * 4, 0);
  }
  g.stroke();
  return ctx.createPattern(c, "repeat");
}

export { makeCanvas };
