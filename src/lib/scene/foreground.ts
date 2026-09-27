import { clamp, css, mix, rng } from "../math";
import { INK } from "../timeline/tracks";
import { num } from "../timeline/tracks";
import type { WorldState } from "../timeline/world";
import type { View } from "./view";

/**
 * Bracken at the reader's feet. Its abundance follows the canopy: it
 * flourishes in the open young grove, is shaded out when the crowns close,
 * and returns in the storm gap. Fronds part around the pointer with a
 * spring, so the wood answers a hand moved through it.
 */
const brackenByYear = num([
  [1887, 0.35],
  [1906, 1.0],
  [1924, 0.62],
  [1947, 0.45],
  [1968, 0.55],
  [1989, 0.9],
  [2026, 0.78],
]);

interface Frond {
  x: number;
  len: number;
  lean: number;
  pinnae: number;
  born: number;
  bend: number;
  vel: number;
  ph: number;
}

export class Foreground {
  private fronds: Frond[] = [];
  private key = "";

  resize(v: View) {
    const key = `${v.w}x${v.h}x${v.quality}`;
    if (key === this.key) return;
    this.key = key;
    const R = rng(1906);
    const count = Math.round((v.w / (v.mobile ? 34 : 44)) * (v.quality === 0 ? 0.6 : 1));
    this.fronds = Array.from({ length: count }, (_, i) => ({
      x: (i + R() * 0.8) / count,
      len: 0.14 + R() * 0.14,
      lean: (R() - 0.5) * 0.9,
      pinnae: 9 + Math.floor(R() * 5),
      born: R(),
      bend: 0,
      vel: 0,
      ph: R() * 6.28,
    }));
  }

  draw(
    ctx: CanvasRenderingContext2D,
    v: View,
    w: WorldState,
    time: number,
    dt: number,
    pointer: { x: number; y: number; active: boolean },
  ) {
    const abundance = brackenByYear(w.year);
    const base = v.h + 6;
    const color = mix(mix(w.leafColor, INK, 0.45), INK, w.night * 0.5);
    ctx.lineCap = "round";
    const stems = new Path2D();
    const leaves = new Path2D();
    const reach = v.h * 0.26;
    for (const f of this.fronds) {
      if (f.born > abundance) continue;
      const bx = f.x * v.w + v.px * 22;
      const len = f.len * v.unit * (0.6 + abundance * 0.4);
      // Spring toward a pointer-driven target bend.
      let target = f.lean + Math.sin(time * (1 + w.wind * 2) + f.ph) * (0.04 + w.wind * 0.16) + w.wind * w.wind * 0.35;
      if (pointer.active) {
        const dx = bx - pointer.x;
        const dy = base - len * 0.6 - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < reach) target += Math.sign(dx || 1) * (1 - dist / reach) * 0.9;
      }
      const k = 30;
      const damp = 7;
      f.vel += ((target - f.bend) * k - f.vel * damp) * clamp(dt, 0, 0.05);
      f.bend += f.vel * clamp(dt, 0, 0.05);
      if (dt === 0) f.bend = target;

      const tipX = bx + Math.sin(f.bend) * len;
      const tipY = base - Math.cos(f.bend) * len * 0.9;
      const cx = bx + Math.sin(f.bend * 0.4) * len * 0.3;
      const cy = base - len * 0.7;
      stems.moveTo(bx, base);
      stems.quadraticCurveTo(cx, cy, tipX, tipY);
      for (let i = 1; i < f.pinnae; i++) {
        const t = i / f.pinnae;
        const u = 1 - t;
        const px = u * u * bx + 2 * u * t * cx + t * t * tipX;
        const py = u * u * base + 2 * u * t * cy + t * t * tipY;
        const dx = 2 * u * (cx - bx) + 2 * t * (tipX - cx);
        const dy = 2 * u * (cy - base) + 2 * t * (tipY - cy);
        const L = Math.hypot(dx, dy) || 1;
        const nx = -dy / L;
        const ny = dx / L;
        const pl = len * 0.2 * (1 - t * 0.85);
        leaves.moveTo(px, py);
        leaves.quadraticCurveTo(px + nx * pl * 0.6, py + ny * pl * 0.6 - pl * 0.3, px + nx * pl, py + ny * pl - pl * 0.1);
        leaves.moveTo(px, py);
        leaves.quadraticCurveTo(px - nx * pl * 0.6, py - ny * pl * 0.6 - pl * 0.3, px - nx * pl, py - ny * pl - pl * 0.1);
      }
    }
    ctx.strokeStyle = css(color);
    ctx.lineWidth = v.mobile ? 1.1 : 1.4;
    ctx.stroke(stems);
    ctx.lineWidth = v.mobile ? 0.9 : 1.1;
    ctx.stroke(leaves);
  }
}
