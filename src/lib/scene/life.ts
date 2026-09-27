import { clamp, css, hex, lerp, mix, rng, smoothstep } from "../math";
import { BONE, INK } from "../timeline/tracks";
import type { WorldState } from "../timeline/world";
import { FENCE_DEPTH } from "./cast";
import { glow } from "./sprites";
import { type View, project } from "./view";

/** Small engraved bird: two arcs, wings driven by a flap phase. */
function bird(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, flap: number) {
  const lift = Math.sin(flap) * s * 0.55;
  ctx.moveTo(x - s, y - lift);
  ctx.quadraticCurveTo(x - s * 0.45, y - s * 0.5 - lift * 0.3, x, y);
  ctx.quadraticCurveTo(x + s * 0.45, y - s * 0.5 - lift * 0.3, x + s, y - lift);
}

export class LifeLayer {
  private rainDrops: { x: number; y: number; l: number; s: number }[] = [];
  private leaves: { x: number; y: number; s: number; ph: number; sp: number }[] = [];
  private glows: { x: number; d: number; ph: number; s: number }[] = [];
  private motes: { x: number; y: number; ph: number }[] = [];
  private key = "";
  /** Smoothed owl gaze, -1 (left) .. 1 (right). */
  private gaze = 0;

  resize(v: View) {
    const key = `${v.w}x${v.h}x${v.quality}`;
    if (key === this.key) return;
    this.key = key;
    const R = rng(1968);
    const q = v.quality === 2 ? 1 : v.quality === 1 ? 0.6 : 0.35;
    this.rainDrops = Array.from({ length: Math.round(340 * q * Math.min(2, v.w / 1200)) }, () => ({
      x: R(),
      y: R(),
      l: 10 + R() * 16,
      s: 0.7 + R() * 0.6,
    }));
    this.leaves = Array.from({ length: Math.round(40 * q) }, () => ({
      x: R(),
      y: R(),
      s: 2.5 + R() * 3,
      ph: R() * 6.28,
      sp: 0.5 + R(),
    }));
    this.glows = Array.from({ length: Math.round((v.mobile ? 22 : 40) * Math.max(0.6, q)) }, () => ({
      x: 0.4 + R() * 0.7,
      d: FENCE_DEPTH - 0.12 + R() * 0.3,
      ph: R() * 6.28,
      s: 0.6 + R() * 0.6,
    }));
    this.motes = Array.from({ length: Math.round(34 * q) }, () => ({ x: R(), y: R(), ph: R() * 6.28 }));
  }

  drawBirds(ctx: CanvasRenderingContext2D, v: View, w: WorldState, time: number) {
    const ink = css(mix(INK, BONE, w.inverse * 0.6));
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.1;
    ctx.lineCap = "round";
    if (w.birds > 0) {
      // A loose flock of finches crossing the young grove.
      ctx.beginPath();
      const R = rng(3);
      for (let i = 0; i < 9; i++) {
        const lag = R() * 0.12;
        const t = clamp((w.birds - lag) / 0.88);
        const x = lerp(-0.08, 1.08, t) * v.w + Math.sin(time * 0.7 + i) * 6;
        const y = v.horizon * (0.3 + R() * 0.22) + Math.sin(t * 9 + i) * 14;
        bird(ctx, x, y, 5 + R() * 3, time * 11 + i * 1.3);
      }
      ctx.stroke();
    }
    if (w.rooks > 0) {
      // The rooks lift out of the wood and leave, west, before the storm.
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      const R = rng(8);
      for (let i = 0; i < 14; i++) {
        const lag = R() * 0.3;
        const t = clamp((w.rooks - lag) / 0.7);
        if (t <= 0) continue;
        const sx = (0.4 + R() * 0.5) * v.w;
        const sy = v.horizon * (0.55 + R() * 0.2);
        const x = lerp(sx, -0.15 * v.w, t * t);
        const y = lerp(sy, v.horizon * (0.08 + R() * 0.2), Math.sqrt(t));
        bird(ctx, x, y, 8 + R() * 4, time * 8 + i * 2.1);
      }
      ctx.stroke();
    }
  }

  drawOwl(ctx: CanvasRenderingContext2D, v: View, w: WorldState, time: number, snagX: number, snagY: number, pointerX: number, dt: number) {
    const s = (v.mobile ? 16 : 22) * (v.unit / 900);
    if (w.owl > 0.02) {
      this.gaze += (clamp((pointerX - snagX) / (v.w * 0.35), -1, 1) - this.gaze) * clamp(dt * 4);
      const x = snagX;
      const y = snagY - s * 1.0;
      const rim = css(mix(BONE, hex("#d8c7a0"), 0.3));
      const plumage = css(mix(hex("#7d6446"), INK, 0.25 + w.night * 0.3));
      const ink = css(INK);
      ctx.globalAlpha = w.owl;
      ctx.lineWidth = 1;
      ctx.lineCap = "round";

      // Body: a pear, widest at the folded wings.
      ctx.beginPath();
      ctx.moveTo(x, y - s * 1.0);
      ctx.bezierCurveTo(x + s * 0.95, y - s * 0.9, x + s * 0.9, y + s * 0.9, x + s * 0.2, y + s * 1.15);
      ctx.lineTo(x - s * 0.2, y + s * 1.15);
      ctx.bezierCurveTo(x - s * 0.9, y + s * 0.9, x - s * 0.95, y - s * 0.9, x, y - s * 1.0);
      ctx.fillStyle = plumage;
      ctx.fill();
      ctx.strokeStyle = rim;
      ctx.stroke();

      // Breast: vertical streaks with small cross-bars.
      ctx.strokeStyle = ink;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let k = -2; k <= 2; k++) {
        const bx = x + k * s * 0.16;
        for (let j = 0; j < 4; j++) {
          const by = y - s * 0.15 + j * s * 0.26;
          ctx.moveTo(bx, by);
          ctx.lineTo(bx, by + s * 0.16);
          ctx.moveTo(bx - s * 0.05, by + s * 0.08);
          ctx.lineTo(bx + s * 0.05, by + s * 0.08);
        }
      }
      // Folded wing bars.
      for (const side of [-1, 1]) {
        for (let j = 0; j < 4; j++) {
          const wy = y + s * 0.05 + j * s * 0.2;
          ctx.moveTo(x + side * s * 0.52, wy);
          ctx.lineTo(x + side * s * 0.78, wy + s * 0.06);
        }
      }
      ctx.stroke();

      // Head turns to follow the reader's pointer.
      const hx = x + this.gaze * s * 0.16;
      const hy = y - s * 1.05;
      ctx.beginPath();
      ctx.ellipse(hx, hy, s * 0.66, s * 0.58, 0, 0, Math.PI * 2);
      ctx.fillStyle = plumage;
      ctx.fill();
      ctx.strokeStyle = rim;
      ctx.lineWidth = 1;
      ctx.stroke();
      // Facial disc: two pale lobes with a dark rim, the tawny's heart face.
      const fx = hx + this.gaze * s * 0.22;
      ctx.fillStyle = css(mix(hex("#cdb893"), INK, w.night * 0.25));
      ctx.strokeStyle = ink;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(fx + side * s * 0.2, hy + s * 0.04, s * 0.24, s * 0.3, side * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      // Eyes: large and dark; a slow blink now and then.
      const blink = Math.sin(time * 0.9) > 0.985 ? 0.15 : 1;
      ctx.fillStyle = ink;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(fx + side * s * 0.2, hy + s * 0.02, s * 0.1, s * 0.1 * blink, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Beak.
      ctx.beginPath();
      ctx.moveTo(fx - s * 0.05, hy + s * 0.14);
      ctx.lineTo(fx, hy + s * 0.28);
      ctx.lineTo(fx + s * 0.05, hy + s * 0.14);
      ctx.fillStyle = css(hex("#c8b27a"));
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (w.owlFlight > 0) {
      // Crosses the moon on silent, wide wings.
      const t = w.owlFlight;
      const x = lerp(snagX, v.w * 1.1, t);
      const y = snagY - Math.sin(t * Math.PI) * v.horizon * 0.55 - t * v.horizon * 0.1;
      const span = s * 3.4;
      const flap = Math.sin(time * 6) * 0.35;
      ctx.fillStyle = css(mix(INK, hex("#3a3226"), 0.3));
      ctx.beginPath();
      ctx.moveTo(x - span, y - span * 0.15 * (1 + flap));
      ctx.quadraticCurveTo(x - span * 0.4, y - span * 0.35 * (1 - flap), x, y);
      ctx.quadraticCurveTo(x + span * 0.4, y - span * 0.35 * (1 - flap), x + span, y - span * 0.15 * (1 + flap));
      ctx.quadraticCurveTo(x + span * 0.4, y + span * 0.05, x, y + span * 0.2);
      ctx.quadraticCurveTo(x - span * 0.4, y + span * 0.05, x - span, y - span * 0.15 * (1 + flap));
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y - span * 0.02, s * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawGlowWorms(ctx: CanvasRenderingContext2D, v: View, w: WorldState, time: number) {
    if (w.glow <= 0.02) return;
    const g = glow();
    ctx.globalCompositeOperation = "lighter";
    for (const p of this.glows) {
      const pos = project(v, p.x, p.d);
      const pulse = 0.55 + 0.45 * Math.sin(time * (0.8 + p.s) + p.ph);
      const size = 18 * p.s * pos.s * (v.unit / 900) + 6;
      ctx.globalAlpha = w.glow * pulse;
      ctx.drawImage(g, pos.x - size / 2, pos.y - size / 2 - 3, size, size);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  drawRain(ctx: CanvasRenderingContext2D, v: View, w: WorldState, time: number) {
    if (w.rain <= 0.02) return;
    // The same diagonal hatch Tobias pencilled beside his log, now falling.
    const slant = 0.35 + w.wind * 0.45;
    ctx.strokeStyle = css(hex("#d4d1c4"), 0.42 + w.rain * 0.2);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    const n = Math.round(this.rainDrops.length * w.rain);
    const span = v.h + 60;
    for (let i = 0; i < n; i++) {
      const d = this.rainDrops[i];
      const y = ((d.y * span + time * 900 * d.s) % span) - 30;
      const x = ((d.x * (v.w + 200) + time * 900 * d.s * slant) % (v.w + 200)) - 100;
      ctx.moveTo(x, y);
      ctx.lineTo(x - d.l * slant, y - d.l);
    }
    ctx.stroke();
  }

  drawLeaves(ctx: CanvasRenderingContext2D, v: View, w: WorldState, time: number, burstX: number, burstY: number) {
    const autumn = smoothstep(4.05, 4.25, w.c) * (1 - smoothstep(4.85, 5.2, w.c));
    const amount = autumn * (0.25 + w.wind * 0.75);
    const burst = w.alderFall > 0 && w.alderFall < 1 ? Math.sin(w.alderFall * Math.PI) : 0;
    if (amount <= 0.02 && burst <= 0.02) return;
    ctx.fillStyle = css(mix(w.leafColor, INK, 0.25));
    ctx.strokeStyle = css(INK, 0.7);
    ctx.lineWidth = 0.6;
    const n = this.leaves.length;
    for (let i = 0; i < n; i++) {
      const p = this.leaves[i];
      let x: number;
      let y: number;
      let a: number;
      if (i < n * 0.6) {
        const speed = 60 + w.wind * 260;
        x = ((p.x * (v.w + 100) + time * speed * p.sp) % (v.w + 100)) - 50;
        y = v.horizon * 0.35 + p.y * v.h * 0.55 + Math.sin(time * 2 * p.sp + p.ph) * 20;
        a = amount;
      } else {
        const r = burst * (80 + p.y * 160);
        x = burstX + Math.cos(p.ph) * r + burst * 60;
        y = burstY + Math.sin(p.ph) * r * 0.6 + burst * 40;
        a = burst;
      }
      if (a <= 0.02) continue;
      ctx.globalAlpha = a;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(time * 3 * p.sp + p.ph);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.s, p.s * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  drawMotes(ctx: CanvasRenderingContext2D, v: View, w: WorldState, time: number) {
    if (w.godRays <= 0.05 || v.quality === 0) return;
    ctx.fillStyle = css(hex("#fff6dc"));
    for (const m of this.motes) {
      const x = (m.x * v.w + Math.sin(time * 0.3 + m.ph) * 20) % v.w;
      const y = v.horizon * 0.3 + ((m.y * v.h * 0.6 + time * 6) % (v.h * 0.6));
      ctx.globalAlpha = w.godRays * (0.3 + 0.3 * Math.sin(time + m.ph));
      ctx.fillRect(x, y, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;
  }
}
