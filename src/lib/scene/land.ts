import { type RGB, band, css, hex, lerp, mix, noise1, rng, smoothstep } from "../math";
import { INK, PAPER } from "../timeline/tracks";
import type { WorldState } from "../timeline/world";
import { FENCE_DEPTH, HERO_DEPTH, STREAM_DEPTH } from "./cast";
import { hatchPattern, makeCanvas } from "./sprites";
import type { Tree } from "./trees";
import { type View, groundY, project, zoomAt } from "./view";

const MEADOW: RGB = hex("#aaa67c");
const FLOOR: RGB = hex("#6f6b4c");

interface Ridge {
  pts: Float32Array;
  step: number;
}

export class LandLayer {
  private key = "";
  private hillInk: HTMLCanvasElement | null = null;
  private groundInk: HTMLCanvasElement | null = null;
  private ridges: Ridge[] = [];
  private shadowPattern: CanvasPattern | null = null;
  private farTrees: { x: number; h: number; r: number; born: number }[] = [];

  resize(v: View, ctx: CanvasRenderingContext2D) {
    const key = `${v.w}x${v.h}`;
    if (key === this.key) return;
    this.key = key;
    const step = 12;
    this.ridges = [0, 1, 2].map((k) => {
      const n = Math.ceil(v.w / step) + 2;
      const pts = new Float32Array(n);
      const amp = [0.13, 0.075, 0.03][k] * v.h;
      const freq = [0.0022, 0.004, 0.009][k];
      for (let i = 0; i < n; i++) {
        const x = i * step;
        const nn = noise1(x * freq, k + 3) * 0.7 + noise1(x * freq * 2.7, k + 9) * 0.3;
        pts[i] = v.horizon - amp * (0.35 + nn * 0.9) + k * 4;
      }
      return { pts, step };
    });

    // Cached ink: ridge outlines + contour hatching in the hills.
    const hc = makeCanvas(Math.ceil(v.w * v.dpr), Math.ceil(v.horizon * v.dpr) + 4);
    const hg = hc.getContext("2d")!;
    hg.scale(v.dpr, v.dpr);
    this.ridges.forEach((r, k) => {
      hg.save();
      this.ridgePath(hg, r, v, v.horizon + 4);
      hg.clip();
      hg.strokeStyle = css(INK, 0.28 + k * 0.08);
      hg.lineWidth = 0.6;
      hg.beginPath();
      for (let y = v.horizon; y > v.horizon - v.h * 0.2; y -= 3.2 + k) {
        hg.moveTo(0, y);
        for (let x = 0; x <= v.w; x += 60) hg.lineTo(x, y + Math.sin(x * 0.012 + y) * 0.8);
      }
      hg.stroke();
      hg.restore();
      hg.strokeStyle = css(INK, 0.5 + k * 0.15);
      hg.lineWidth = 0.9;
      hg.beginPath();
      for (let i = 0; i < r.pts.length; i++) {
        const x = i * r.step;
        if (i === 0) hg.moveTo(x, r.pts[i]);
        else hg.lineTo(x, r.pts[i]);
      }
      hg.stroke();
    });
    this.hillInk = hc;

    // Cached ground engraving: perspective-spaced furrows and grass ticks.
    const gc = makeCanvas(Math.ceil(v.w * v.dpr), Math.ceil(v.groundSpan * v.dpr));
    const gg = gc.getContext("2d")!;
    gg.scale(v.dpr, v.dpr);
    gg.strokeStyle = css(INK, 0.3);
    gg.lineWidth = 0.6;
    gg.beginPath();
    let y = 2;
    let i = 0;
    while (y < v.groundSpan) {
      const t = y / v.groundSpan;
      gg.moveTo(0, y);
      for (let x = 0; x <= v.w; x += 40) gg.lineTo(x, y + Math.sin(x * 0.01 + i * 1.7) * (0.6 + t * 2));
      y += 2.2 + t * t * 16;
      i++;
    }
    gg.stroke();
    const R = rng(44);
    gg.strokeStyle = css(INK, 0.45);
    gg.lineWidth = 0.7;
    gg.beginPath();
    const ticks = Math.round((v.w * v.groundSpan) / 900);
    for (let k = 0; k < ticks; k++) {
      const t = Math.pow(R(), 1.4);
      const gx = R() * v.w;
      const gy = t * v.groundSpan;
      const h = 2 + t * 9;
      gg.moveTo(gx, gy);
      gg.lineTo(gx - h * 0.2, gy - h);
      gg.moveTo(gx + 2, gy);
      gg.lineTo(gx + 2 + h * 0.25, gy - h * 0.8);
    }
    gg.stroke();
    this.groundInk = gc;

    this.shadowPattern = hatchPattern(ctx, INK, 0.85, 4);

    const FR = rng(9);
    this.farTrees = Array.from({ length: Math.round(v.w / 11) }, () => ({
      x: FR() * v.w,
      h: 6 + FR() * 16,
      r: 3 + FR() * 6,
      born: 1860 + FR() * 60,
    }));
  }

  private ridgePath(g: CanvasRenderingContext2D, r: Ridge, v: View, bottom: number) {
    g.beginPath();
    g.moveTo(0, bottom);
    for (let i = 0; i < r.pts.length; i++) g.lineTo(i * r.step, r.pts[i]);
    g.lineTo(v.w, bottom);
    g.closePath();
  }

  drawHills(ctx: CanvasRenderingContext2D, v: View, w: WorldState) {
    this.ridges.forEach((r, k) => {
      const tone = mix(mix(w.horizon, PAPER, 0.3), INK, 0.08 + k * 0.09 + w.night * 0.4);
      ctx.fillStyle = css(tone);
      this.ridgePath(ctx, r, v, v.horizon + 6);
      ctx.fill();
      if (k === 1) this.drawFarForest(ctx, v, w, r);
    });
    if (this.hillInk) {
      ctx.globalAlpha = 1 - w.night * 0.5;
      ctx.drawImage(this.hillInk, 0, 0, v.w, v.horizon + 4);
      ctx.globalAlpha = 1;
    }
  }

  private drawFarForest(ctx: CanvasRenderingContext2D, v: View, w: WorldState, r: Ridge) {
    const fill = css(mix(mix(w.horizon, w.leafColor, 0.3), INK, 0.22 + w.night * 0.35));
    const body = new Path2D();
    const line = new Path2D();
    for (const t of this.farTrees) {
      const g = smoothstep(t.born, t.born + 70, w.year);
      if (g <= 0.05) continue;
      const i = Math.min(r.pts.length - 1, Math.max(0, Math.round(t.x / r.step)));
      const gy = r.pts[i] + 3;
      const h = t.h * (0.3 + 0.7 * g) * (v.mobile ? 0.8 : 1);
      const rr = t.r * (0.4 + 0.6 * g) * (0.5 + 0.5 * w.leafiness);
      line.moveTo(t.x, gy);
      line.lineTo(t.x, gy - h);
      body.moveTo(t.x + rr, gy - h);
      body.ellipse(t.x, gy - h, rr, rr * 1.25, 0, 0, Math.PI * 2);
    }
    ctx.fillStyle = fill;
    ctx.fill(body);
    ctx.strokeStyle = css(INK, 0.45);
    ctx.lineWidth = 0.6;
    ctx.stroke(body);
    ctx.stroke(line);
  }

  drawGround(ctx: CanvasRenderingContext2D, v: View, w: WorldState) {
    const canopy = smoothstep(1898, 1935, w.year) * (0.35 + 0.65 * w.leafiness);
    const top = mix(mix(w.horizon, MEADOW, 0.55), w.leafColor, 0.15);
    const bottom = mix(mix(MEADOW, FLOOR, 0.3 + canopy * 0.5), w.leafColor, 0.2);
    const g = ctx.createLinearGradient(0, v.horizon, 0, v.h);
    g.addColorStop(0, css(top, 0.92));
    g.addColorStop(1, css(bottom, 0.96));
    ctx.fillStyle = g;
    ctx.fillRect(0, v.horizon, v.w, v.groundSpan);
    if (this.groundInk) ctx.drawImage(this.groundInk, 0, v.horizon, v.w, v.groundSpan);
  }

  drawStream(ctx: CanvasRenderingContext2D, v: View, w: WorldState, time: number) {
    const top: number[] = [];
    const bot: number[] = [];
    const xs: number[] = [];
    const zoom = zoomAt(v, STREAM_DEPTH);
    const steps = 44;
    for (let i = 0; i <= steps; i++) {
      const xn = -0.06 + (i / steps) * 1.12;
      const p = project(v, xn, STREAM_DEPTH);
      const cy = p.y + Math.sin(xn * 8.5 + 1.2) * v.h * 0.012 * zoom;
      const width = (0.006 + 0.004 * Math.sin(xn * 5.1) + (1 - xn) * 0.004 + w.flood * 0.014) * v.h * zoom;
      xs.push(p.x);
      top.push(cy - width);
      bot.push(cy + width);
    }
    ctx.beginPath();
    ctx.moveTo(xs[0], top[0]);
    for (let i = 1; i < xs.length; i++) ctx.lineTo(xs[i], top[i]);
    for (let i = xs.length - 1; i >= 0; i--) ctx.lineTo(xs[i], bot[i]);
    ctx.closePath();
    const water = mix(mix(w.zenith, w.horizon, 0.55), PAPER, 0.25);
    ctx.fillStyle = css(mix(water, hex("#7a6a4c"), w.flood * 0.45));
    ctx.fill();
    ctx.strokeStyle = css(INK, 0.75);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Ripples drift downstream; the flood makes them crowd and hurry.
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = css(INK, 0.45);
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    const flow = time * (18 + w.flood * 50);
    for (let i = 0; i < xs.length - 1; i += 1) {
      const rows = 2 + Math.round(w.flood * 2);
      for (let r = 0; r < rows; r++) {
        const t = (r + 1) / (rows + 1);
        const y = lerp(top[i], bot[i], t);
        const x = xs[i] + ((flow + r * 23 + i * 7) % 28) - 6;
        ctx.moveTo(x, y);
        ctx.lineTo(x + 7 + w.flood * 5, y);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  /** Cast shadows: long at dawn and dusk, short at noon, swinging east to west. */
  drawShadows(ctx: CanvasRenderingContext2D, v: View, w: WorldState, trees: Tree[]) {
    if (w.shadow <= 0.02 || !this.shadowPattern) return;
    ctx.fillStyle = this.shadowPattern;
    for (const t of trees) {
      if (!t.alive || t.spec.depth > 0.7 || t.heightPx < 8) continue;
      if (t.spec.hero && w.alderFall > 0.5) continue;
      const len = t.heightPx * w.shadowLen * 0.42;
      const thick = Math.max(3, t.heightPx * 0.045 * (1 - t.spec.depth * 0.6));
      ctx.globalAlpha = w.shadow * (0.75 - t.spec.depth * 0.5);
      ctx.beginPath();
      ctx.ellipse(t.baseX + w.shadowDir * len * 0.5, t.baseY + thick * 0.2, len * 0.5 + thick, thick, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /** Aerial perspective: a band of sky colour laid over everything behind a depth. */
  drawHaze(ctx: CanvasRenderingContext2D, v: View, w: WorldState, depth: number, strength: number) {
    const y = groundY(v, depth);
    const a = strength * (0.25 + w.fog * 0.65);
    if (a <= 0.01) return;
    const g = ctx.createLinearGradient(0, v.horizon - v.h * 0.45, 0, y + 10);
    const c = mix(w.horizon, w.zenith, 0.15);
    g.addColorStop(0, css(c, 0));
    g.addColorStop(0.55, css(c, a * 0.7));
    g.addColorStop(1, css(c, a));
    ctx.fillStyle = g;
    ctx.fillRect(0, v.horizon - v.h * 0.45, v.w, y + 10 - (v.horizon - v.h * 0.45));
  }

  /** Low drifting banks of fog for the years nobody came. */
  drawFog(ctx: CanvasRenderingContext2D, v: View, w: WorldState, time: number, layer: number) {
    if (w.fog <= 0.03) return;
    const c = mix(w.horizon, PAPER, 0.4 - w.night * 0.3);
    for (let i = 0; i < 3; i++) {
      const x = ((((i * 0.37 + time * (0.006 + i * 0.002) + layer * 0.2) % 1.6) + 1.6) % 1.6 - 0.3) * v.w;
      const y = v.horizon + (layer === 0 ? -0.02 : 0.1 + i * 0.05) * v.h;
      const rx = v.w * (0.5 + i * 0.15);
      const ry = v.h * (0.07 + i * 0.02);
      const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
      g.addColorStop(0, css(c, w.fog * (layer === 0 ? 0.55 : 0.4)));
      g.addColorStop(1, css(c, 0));
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, ry / rx);
      ctx.translate(-x, -y);
      ctx.fillStyle = g;
      ctx.fillRect(x - rx, y - rx, rx * 2, rx * 2);
      ctx.restore();
    }
  }

  /** A veil of fog over everything but the reader's own foreground. */
  drawFogVeil(ctx: CanvasRenderingContext2D, v: View, w: WorldState) {
    if (w.fog <= 0.05) return;
    const c = mix(w.horizon, PAPER, 0.35 - w.night * 0.3);
    const g = ctx.createLinearGradient(0, 0, 0, v.h);
    g.addColorStop(0, css(c, w.fog * 0.18));
    g.addColorStop(v.horizon / v.h, css(c, w.fog * 0.62));
    g.addColorStop(1, css(c, w.fog * 0.3));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, v.w, v.h);
  }

  drawGodRays(ctx: CanvasRenderingContext2D, v: View, w: WorldState, time: number) {
    if (w.godRays <= 0.03 || v.quality === 0) return;
    const sx = w.sunX * v.w;
    const sy = v.horizon - w.sunElev * v.horizon * 0.78;
    ctx.globalCompositeOperation = "screen";
    const warm = mix(hex("#fff4d6"), hex("#ffc27a"), 1 - smoothstep(0.1, 0.5, w.sunElev));
    for (let i = 0; i < 6; i++) {
      const spread = (i - 2.5) * 0.09 + Math.sin(time * 0.1 + i) * 0.01;
      const ex = sx + (0.5 - w.sunX) * v.w * 0.6 + spread * v.w;
      const ey = v.h;
      const wTop = 6;
      const wBot = 40 + i * 14;
      const g = ctx.createLinearGradient(sx, sy, ex, ey);
      g.addColorStop(0, css(warm, 0));
      g.addColorStop(0.35, css(warm, 0.22 * w.godRays));
      g.addColorStop(1, css(warm, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(sx - wTop, sy);
      ctx.lineTo(sx + wTop, sy);
      ctx.lineTo(ex + wBot, ey);
      ctx.lineTo(ex - wBot, ey);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  /** "Alder seedlings along the brook, some dozens." Gone into the grove by 1906. */
  drawSeedlings(ctx: CanvasRenderingContext2D, v: View, w: WorldState, intro: number) {
    const life = smoothstep(1885, 1889, w.year) * (1 - smoothstep(1899, 1908, w.year)) * intro;
    if (life <= 0.02) return;
    const R = rng(1888);
    const n = v.mobile ? 26 : 48;
    const grow = 0.55 + 0.45 * smoothstep(1887, 1900, w.year);
    const stems = new Path2D();
    const leaves = new Path2D();
    for (let i = 0; i < n; i++) {
      const byBrook = i < n * 0.7;
      const d = byBrook ? STREAM_DEPTH - 0.08 + R() * 0.14 : 0.25 + R() * 0.3;
      const p = project(v, -0.02 + R() * 1.04, d);
      const h = (9 + R() * 12) * p.s * (v.unit / 900) * grow * 2.8;
      const lean = (R() - 0.5) * 0.4;
      const tx = p.x + lean * h;
      const ty = p.y - h;
      stems.moveTo(p.x, p.y);
      stems.quadraticCurveTo(p.x, p.y - h * 0.6, tx, ty);
      for (let k = 0; k < 3; k++) {
        const t = 0.45 + k * 0.25;
        const lx = p.x + (tx - p.x) * t;
        const ly = p.y + (ty - p.y) * t;
        const side = k % 2 === 0 ? 1 : -1;
        const r = h * 0.2 * (1.1 - k * 0.2);
        leaves.moveTo(lx + side * r * 0.9 + r, ly - r * 0.2);
        leaves.ellipse(lx + side * r * 0.9, ly - r * 0.2, r, r * 0.55, side * -0.5, 0, Math.PI * 2);
      }
    }
    ctx.globalAlpha = life;
    ctx.fillStyle = css(mix(mix(w.leafColor, PAPER, 0.15), INK, w.night * 0.5));
    ctx.fill(leaves);
    ctx.strokeStyle = css(INK, 0.85);
    ctx.lineWidth = 0.8;
    ctx.stroke(leaves);
    ctx.lineWidth = 1;
    ctx.stroke(stems);
    ctx.globalAlpha = 1;
  }

  /* -------------------- human traces -------------------- */

  drawStumps(ctx: CanvasRenderingContext2D, v: View, w: WorldState) {
    const rot = 1 - smoothstep(1887, 1932, w.year);
    if (rot <= 0.02) return;
    const R = rng(5);
    for (let i = 0; i < 6; i++) {
      const p = project(v, 0.12 + R() * 0.8, 0.26 + R() * 0.34);
      const r = (10 + R() * 8) * p.s * (v.unit / 900);
      const h = r * (0.7 + R() * 0.5) * rot;
      ctx.globalAlpha = 0.4 + rot * 0.6;
      ctx.fillStyle = css(mix(PAPER, INK, 0.12 + w.night * 0.5));
      ctx.beginPath();
      ctx.moveTo(p.x - r, p.y);
      ctx.lineTo(p.x - r, p.y - h);
      ctx.ellipse(p.x, p.y - h, r, r * 0.35, 0, Math.PI, 0);
      ctx.lineTo(p.x + r, p.y);
      ctx.ellipse(p.x, p.y, r, r * 0.35, 0, 0, Math.PI);
      ctx.fill();
      ctx.strokeStyle = css(INK, 0.8);
      ctx.lineWidth = 0.9;
      ctx.stroke();
      // Growth rings on the cut face.
      ctx.beginPath();
      for (let k = 1; k <= 3; k++) ctx.ellipse(p.x, p.y - h, r * (k / 4), r * 0.35 * (k / 4), 0, 0, Math.PI * 2);
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  drawStakes(ctx: CanvasRenderingContext2D, v: View, w: WorldState, time: number, heroX: number) {
    const life = 1 - smoothstep(1930, 1945, w.year);
    if (life <= 0.02) return;
    const stakes = [
      { x: heroX + 0.035, d: HERO_DEPTH - 0.02 },
      { x: 0.56, d: 0.52 },
      { x: 0.74, d: 0.4 },
      { x: 0.92, d: 0.6 },
    ];
    const pts = stakes.map((s) => project(v, s.x, s.d));
    // The 1887 chain line between stakes, gone within a few seasons.
    const chain = 1 - smoothstep(1887.5, 1896, w.year);
    if (chain > 0.02) {
      ctx.globalAlpha = chain * 0.7;
      ctx.setLineDash([1.5, 4]);
      ctx.strokeStyle = css(INK);
      ctx.lineWidth = 1;
      ctx.beginPath();
      pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
      ctx.setLineDash([]);
    }
    const tilt = smoothstep(1887, 1940, w.year);
    pts.forEach((p, i) => {
      const h = 34 * p.s * (v.unit / 900);
      const lean = (i % 2 === 0 ? 1 : -1) * tilt * 0.25;
      const tx = p.x + Math.sin(lean) * h;
      const ty = p.y - Math.cos(lean) * h;
      ctx.globalAlpha = life;
      ctx.strokeStyle = css(INK);
      ctx.lineWidth = Math.max(1.2, 2.6 * p.s);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      // Survey flag, fading and fraying with the years.
      const flag = 1 - smoothstep(1887, 1912, w.year);
      if (flag > 0.02) {
        const flap = Math.sin(time * 4 + i) * 2 * (0.4 + w.wind);
        ctx.globalAlpha = life * flag;
        ctx.fillStyle = css(mix(hex("#b8482f"), PAPER, 0.25));
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + 10 * p.s + flap, ty + 3 * p.s);
        ctx.lineTo(tx, ty + 7 * p.s);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
  }

  /** Fence of 1904, broken by the alder in 1968, reduced to a few posts. */
  drawFence(ctx: CanvasRenderingContext2D, v: View, w: WorldState, logTipX: number) {
    if (w.year < 1903.5) return;
    const posts = v.mobile ? 8 : 12;
    const pts: { x: number; y: number; h: number; lean: number; a: number }[] = [];
    const broken = w.alderFall > 0.85;
    for (let i = 0; i < posts; i++) {
      const xn = 0.46 + (i / (posts - 1)) * 0.62;
      const built = smoothstep(1903.5 + i * 0.18, 1904 + i * 0.18, w.year);
      if (built <= 0) continue;
      const p = project(v, xn, FENCE_DEPTH + Math.sin(i * 1.3) * 0.015);
      const hit = broken && p.x < logTipX + 10 && p.x > logTipX - v.w * 0.22;
      const decayStart = 1972 + ((i * 7) % 11) * 2.2;
      const survives = i % 4 === 1;
      const a = survives ? 1 : 1 - smoothstep(decayStart, decayStart + 8, w.year);
      if (a <= 0.02) continue;
      const age = smoothstep(1950, 2020, w.year);
      const lean = (hit ? 0.9 : 0) + (survives ? age * 0.22 * (i % 2 ? 1 : -1) : 0);
      pts.push({ x: p.x, y: p.y, h: 30 * p.s * (v.unit / 900) * built, lean, a: a * built });
    }
    ctx.strokeStyle = css(INK);
    ctx.lineCap = "round";
    for (const p of pts) {
      ctx.globalAlpha = p.a;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + Math.sin(p.lean) * p.h, p.y - Math.cos(p.lean) * p.h);
      ctx.stroke();
    }
    // Rails only between upright neighbours.
    ctx.lineWidth = 1.1;
    const railsFade = 1 - smoothstep(1970, 1985, w.year);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      if (a.lean > 0.4 || b.lean > 0.4) continue;
      ctx.globalAlpha = Math.min(a.a, b.a) * (broken ? railsFade : 1);
      ctx.beginPath();
      for (const k of [0.35, 0.72]) {
        ctx.moveTo(a.x, a.y - a.h * k);
        ctx.lineTo(b.x, b.y - b.h * k);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /** Moss, bracket fungi and ferns colonising the fallen trunk. */
  drawLogLife(ctx: CanvasRenderingContext2D, v: View, w: WorldState, log: { x: number; y: number; w: number }[]) {
    if (log.length === 0 || w.c < 4.85) return;
    const moss = smoothstep(1970, 1990, w.year);
    if (moss <= 0.01) return;
    ctx.globalAlpha = moss;
    const green = mix(hex("#6e7d3e"), INK, w.night * 0.5);
    log.forEach((p, i) => {
      ctx.fillStyle = css(green, 0.8);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - p.w * 0.35, p.w * 1.4, p.w * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = css(INK, 0.7);
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      for (let k = -3; k <= 3; k++) {
        ctx.moveTo(p.x + k * p.w * 0.35, p.y - p.w * 0.45);
        ctx.lineTo(p.x + k * p.w * 0.35 + 2, p.y - p.w * 0.75);
      }
      ctx.stroke();
      if (i % 2 === 0) {
        // Bracket fungus.
        const fx = p.x + p.w * 0.3;
        const fy = p.y - p.w * 0.1;
        ctx.fillStyle = css(mix(hex("#c9b48a"), INK, w.night * 0.5));
        ctx.beginPath();
        ctx.ellipse(fx, fy, p.w * 0.55, p.w * 0.22, 0, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      if (i % 2 === 1) {
        // A small fern springing from the rot.
        const h = p.w * 2.4 * moss;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - p.w * 0.5);
        ctx.quadraticCurveTo(p.x + h * 0.2, p.y - h, p.x + h * 0.55, p.y - h * 1.1);
        for (let k = 1; k < 6; k++) {
          const t = k / 6;
          const bx = p.x + h * 0.55 * t * t;
          const by = p.y - p.w * 0.5 - (h * 0.6) * t;
          ctx.moveTo(bx, by);
          ctx.lineTo(bx - 5 * (1 - t), by - 4 * (1 - t));
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + 5 * (1 - t), by - 2 * (1 - t));
        }
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
  }

  /** Splintered top of the snapped alder; later a dark hollow for the owls. */
  drawSnag(ctx: CanvasRenderingContext2D, w: WorldState, x: number, y: number, width: number) {
    if (w.alderFall <= 0.02 || width <= 0) return;
    ctx.strokeStyle = css(INK);
    ctx.fillStyle = css(mix(PAPER, INK, 0.25 + w.night * 0.5));
    ctx.lineWidth = 1;
    ctx.beginPath();
    const half = width * 0.55;
    ctx.moveTo(x - half, y + 2);
    const spikes = [0.4, 1, 0.2, 0.8, 0.5];
    spikes.forEach((s, i) => {
      const sx = x - half + ((i + 0.5) / spikes.length) * half * 2;
      ctx.lineTo(sx, y - s * width * 0.9);
      ctx.lineTo(sx + (half * 2) / spikes.length / 2, y);
    });
    ctx.lineTo(x + half, y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    const hollow = band(w.year, 1974, 1984, 3000, 3001) * (w.c > 4.85 ? 1 : 0);
    if (hollow > 0.02) {
      ctx.globalAlpha = hollow;
      ctx.fillStyle = css(INK);
      ctx.beginPath();
      ctx.ellipse(x, y + width * 0.9, width * 0.22, width * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

