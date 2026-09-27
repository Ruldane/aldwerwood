import { STATION_POINTS, STATIONS } from "../../content/survey";
import { type RGB, clamp, css, hex, mix, rng, smoothstep } from "../math";
import { BONE, INK, PAPER } from "../timeline/tracks";
import type { WorldState } from "../timeline/world";
import { glow, makeCanvas } from "./sprites";
import type { View } from "./view";

interface Star {
  x: number;
  y: number;
  r: number;
  ph: number;
}

export class SkyLayer {
  private hatch: HTMLCanvasElement | null = null;
  private stars: Star[] = [];
  private key = "";

  resize(v: View) {
    const key = `${v.w}x${v.h}`;
    if (key === this.key) return;
    this.key = key;
    // Engraved sky: ruled horizontal lines, tighter toward the zenith.
    const c = makeCanvas(Math.ceil(v.w * v.dpr), Math.ceil(v.horizon * v.dpr));
    const g = c.getContext("2d")!;
    g.scale(v.dpr, v.dpr);
    g.strokeStyle = css(INK, 0.55);
    g.lineWidth = 0.6;
    g.beginPath();
    let y = 2;
    let i = 0;
    while (y < v.horizon) {
      const wob = (i % 3) * 0.3;
      g.moveTo(0, y + wob);
      for (let x = 0; x <= v.w; x += 80) g.lineTo(x, y + Math.sin(x * 0.01 + i) * 0.5 + wob);
      y += 3 + (y / v.horizon) * 7;
      i++;
    }
    g.stroke();
    this.hatch = c;

    const R = rng(2026);
    const count = v.mobile ? 160 : Math.round(260 * Math.min(2, v.w / 1440));
    this.stars = Array.from({ length: count }, () => ({
      x: R() * v.w,
      y: Math.pow(R(), 1.5) * v.horizon * 0.92,
      r: R() < 0.1 ? 1.5 + R() : 0.5 + R() * 0.8,
      ph: R() * 6.28,
    }));
  }

  draw(ctx: CanvasRenderingContext2D, v: View, w: WorldState, time: number, handFont: string) {
    ctx.clearRect(0, 0, v.w, v.h);
    const H = v.horizon;

    // Wash. Semi-transparent in daylight so the laid paper reads through.
    const alpha = 0.72 + w.night * 0.26 + w.storm * 0.12;
    const g = ctx.createLinearGradient(0, 0, 0, H + 40);
    g.addColorStop(0, css(w.zenith, alpha));
    g.addColorStop(0.72, css(mix(w.zenith, w.horizon, 0.7), alpha));
    g.addColorStop(1, css(w.horizon, alpha));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, v.w, H + 40);

    // The storm's bank of cloud pressing down from the top of the page.
    if (w.storm > 0.02) {
      const bank = ctx.createLinearGradient(0, 0, 0, H * 0.75);
      bank.addColorStop(0, css(mix(INK, w.zenith, 0.35), w.storm * 0.75));
      bank.addColorStop(1, css(mix(INK, w.zenith, 0.35), 0));
      ctx.fillStyle = bank;
      ctx.fillRect(0, 0, v.w, H * 0.75);
    }

    if (this.hatch) {
      ctx.globalAlpha = 0.16 * (1 - w.night) + w.storm * 0.3;
      ctx.drawImage(this.hatch, 0, 0, v.w, H);
      ctx.globalAlpha = 1;
    }

    this.drawHorizonGlow(ctx, v, w);
    this.drawStars(ctx, v, w, time);
    this.drawSun(ctx, v, w);
    this.drawMoon(ctx, v, w);
    this.drawClouds(ctx, v, w, time);
    this.drawConstellation(ctx, v, w, time, handFont);
  }

  /** Sunrise and sunset light pooling along the horizon on the sun's side. */
  private drawHorizonGlow(ctx: CanvasRenderingContext2D, v: View, w: WorldState) {
    const low = 1 - smoothstep(0.0, 0.32, Math.abs(w.sunElev));
    const a = low * (1 - w.storm) * (1 - w.night) * 0.55;
    if (a <= 0.02) return;
    const x = w.sunX * v.w;
    const r = v.w * 0.7;
    const g = ctx.createRadialGradient(x, v.horizon, 0, x, v.horizon, r);
    const warm = hex(w.sunX < 0.5 ? "#f0b98f" : "#ee9f5c");
    g.addColorStop(0, css(warm, a));
    g.addColorStop(0.45, css(warm, a * 0.35));
    g.addColorStop(1, css(warm, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, v.w, v.horizon + 20);
  }

  private drawSun(ctx: CanvasRenderingContext2D, v: View, w: WorldState) {
    if (w.sunVisible <= 0.01) return;
    const x = w.sunX * v.w;
    const y = v.horizon - w.sunElev * v.horizon * 0.78;
    const low = 1 - smoothstep(0.05, 0.4, w.sunElev);
    const r = (v.mobile ? 20 : 28) * (1 + low * 0.35);
    const warm: RGB = mix(hex("#f3e7c4"), hex("#eaa46a"), low);
    ctx.globalAlpha = w.sunVisible;

    const halo = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 7);
    halo.addColorStop(0, css(warm, 0.55));
    halo.addColorStop(1, css(warm, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(x - r * 7, y - r * 7, r * 14, r * 14);

    // Engraved rays: alternating long and short ruled strokes.
    ctx.strokeStyle = css(INK, 0.5);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const r0 = r * 1.35;
      const r1 = r * (i % 2 === 0 ? 2.6 : 1.9);
      ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
      ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = css(mix(warm, PAPER, 0.3));
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = css(INK, 0.8);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  private drawMoon(ctx: CanvasRenderingContext2D, v: View, w: WorldState) {
    if (w.moonVisible <= 0.01) return;
    const x = w.moonX * v.w;
    const y = v.horizon - w.moonElev * v.horizon * 0.72;
    const r = v.mobile ? 16 : 22;
    ctx.globalAlpha = w.moonVisible;
    const g = glow();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = w.moonVisible * 0.25;
    ctx.drawImage(g, x - r * 5, y - r * 5, r * 10, r * 10);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = w.moonVisible;
    // Waxing crescent: lit disc minus an offset disc.
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = css(BONE);
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.beginPath();
    ctx.arc(x - r * 0.48, y - r * 0.12, r * 0.94, 0, Math.PI * 2);
    ctx.fillStyle = css(mix(w.zenith, INK, 0.1));
    ctx.fill();
    // Hatching on the terminator.
    ctx.strokeStyle = css(mix(w.zenith, BONE, 0.3), 0.8);
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (let i = -6; i <= 6; i++) {
      ctx.moveTo(x + r * 0.3, y + i * 3);
      ctx.lineTo(x + r * 0.62, y + i * 3 + 1);
    }
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  private drawStars(ctx: CanvasRenderingContext2D, v: View, w: WorldState, time: number) {
    if (w.stars <= 0.01) return;
    ctx.fillStyle = css(BONE);
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      // Stars come out in order of brightness as the sky deepens.
      const appear = clamp((w.stars - (1 - s.r / 2.5) * 0.7) / 0.3);
      if (appear <= 0) continue;
      const tw = 0.75 + 0.25 * Math.sin(time * 1.3 + s.ph);
      ctx.globalAlpha = appear * tw;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /** The 1887 survey traverse, rising as stars. */
  private drawConstellation(ctx: CanvasRenderingContext2D, v: View, w: WorldState, time: number, font: string) {
    if (w.constellation <= 0.01) return;
    const k = w.constellation;
    const box = v.mobile
      ? { x: v.w * 0.16, y: v.h * 0.07, s: v.w * 0.62 }
      : { x: v.w * 0.3, y: v.h * 0.07, s: Math.min(v.w * 0.3, v.horizon * 0.62) };
    const pts = STATION_POINTS.map((p) => ({ x: box.x + p.x * box.s, y: box.y + p.y * box.s * 0.8 }));

    // Chain lines, drawn station by station.
    ctx.strokeStyle = css(BONE, 0.55);
    ctx.lineWidth = 0.9;
    ctx.setLineDash([2, 5]);
    ctx.beginPath();
    const segs = pts.length - 1;
    for (let i = 0; i < segs; i++) {
      const t = clamp(k * (segs + 1) - i - 0.6);
      if (t <= 0) break;
      const a = pts[i];
      const b = pts[i + 1];
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    const g = glow();
    for (let i = 0; i < pts.length; i++) {
      const t = clamp(k * (segs + 1) - i);
      if (t <= 0) continue;
      const p = pts[i];
      const tw = 0.85 + 0.15 * Math.sin(time * 2 + i);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = t * 0.5 * tw;
      ctx.drawImage(g, p.x - 14, p.y - 14, 28, 28);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = t;
      ctx.fillStyle = css(BONE);
      ctx.beginPath();
      // Four-pointed engraved star.
      const r = 4.2;
      ctx.moveTo(p.x, p.y - r * 1.8);
      ctx.lineTo(p.x + r * 0.35, p.y - r * 0.35);
      ctx.lineTo(p.x + r * 1.8, p.y);
      ctx.lineTo(p.x + r * 0.35, p.y + r * 0.35);
      ctx.lineTo(p.x, p.y + r * 1.8);
      ctx.lineTo(p.x - r * 0.35, p.y + r * 0.35);
      ctx.lineTo(p.x - r * 1.8, p.y);
      ctx.lineTo(p.x - r * 0.35, p.y - r * 0.35);
      ctx.closePath();
      ctx.fill();
      if (font) {
        ctx.globalAlpha = t * 0.85;
        ctx.font = `${v.mobile ? 13 : 15}px ${font}`;
        const st = STATIONS[i];
        const label = st.bearing === "origin" ? "Stn. A" : `${st.id}  ${st.bearing}`;
        ctx.fillText(label, p.x + 9, p.y - 8);
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawClouds(ctx: CanvasRenderingContext2D, v: View, w: WorldState, time: number) {
    const count = v.mobile ? 3 : 5;
    const stormExtra = Math.round(w.storm * (v.mobile ? 4 : 6));
    const vis = 1 - w.night * 0.8;
    if (vis <= 0.02 && w.storm < 0.05) return;
    const body = mix(mix(w.horizon, PAPER, 0.35), w.zenith, 0.12);
    const lit = mix(body, INK, w.night * 0.45 + w.storm * 0.35);
    const R = rng(77);
    for (let i = 0; i < count + stormExtra; i++) {
      const isStorm = i >= count;
      const x0 = R();
      const y0 = R();
      const sz = 0.6 + R() * 0.7;
      const speed = 0.004 + R() * 0.004 + w.wind * 0.03;
      const span = 1.6;
      const x = (((x0 + time * speed + w.c * 0.08) % span) + span) % span;
      const cx = (x - 0.3) * v.w;
      const cy = (isStorm ? 0.2 + y0 * 0.35 : 0.1 + y0 * 0.34) * v.horizon;
      const cw = (isStorm ? 380 : 190) * sz * (v.mobile ? 0.6 : 1);
      const ch = cw * (isStorm ? 0.34 : 0.26);
      const a = isStorm ? w.storm * 0.95 : vis * (0.8 - w.storm * 0.4);
      if (a <= 0.02) continue;

      // Irregular cumulus crown over a softly bowed base.
      const bumps = 6 + Math.floor(R() * 4);
      const tops: [number, number, number][] = [];
      for (let b = 0; b < bumps; b++) {
        const t = (b + 0.5) / bumps;
        const env = Math.sin(t * Math.PI);
        tops.push([cx - cw / 2 + t * cw, cy - ch * (0.25 + env * (0.55 + R() * 0.35)), (cw / bumps) * (0.55 + R() * 0.5)]);
      }
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.moveTo(cx - cw / 2, cy);
      for (const [bx, by, br] of tops) {
        ctx.quadraticCurveTo(bx - br * 0.9, by - br * 0.7, bx + br * 0.25, by);
      }
      ctx.quadraticCurveTo(cx + cw / 2 + 10, cy - ch * 0.2, cx + cw / 2, cy);
      ctx.quadraticCurveTo(cx, cy + ch * 0.12, cx - cw / 2, cy);
      ctx.closePath();
      ctx.fillStyle = css(isStorm ? mix(lit, INK, 0.3) : lit, 0.72);
      ctx.fill();
      ctx.strokeStyle = css(INK, 0.38);
      ctx.lineWidth = 0.7;
      ctx.stroke();

      // Engraver's hatching, dense toward the shaded underside.
      ctx.save();
      ctx.clip();
      ctx.beginPath();
      const rows = Math.round(ch / 3.2);
      for (let l = 0; l < rows; l++) {
        const t = l / rows;
        const ly = cy + 2 - t * ch * 1.1;
        const inset = t * t * cw * 0.35;
        ctx.moveTo(cx - cw / 2 + inset + (l % 3) * 4, ly);
        ctx.lineTo(cx + cw / 2 - inset * 0.6, ly);
        if (t > 0.5) l += 1;
      }
      ctx.lineWidth = 0.55;
      ctx.strokeStyle = css(INK, 0.3 + w.storm * 0.3);
      ctx.stroke();
      ctx.restore();

      // Ruled wisps trailing off the base.
      ctx.beginPath();
      for (let l = 0; l < 4; l++) {
        const ly = cy + 5 + l * 3.5;
        const len = cw * (0.9 - l * 0.18);
        ctx.moveTo(cx - len * 0.35 + l * 9, ly);
        ctx.lineTo(cx + len * 0.65, ly);
      }
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = css(INK, 0.22);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}
