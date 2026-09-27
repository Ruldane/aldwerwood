import { clamp, css, easeInOut, easeOutCubic, smoothstep } from "../math";
import type { Frame } from "../timeline/clock";
import { INK } from "../timeline/tracks";
import type { WorldState } from "../timeline/world";
import { drawAnnotations } from "./annotations";
import { type Cast, FENCE_DEPTH, STREAM_DEPTH, buildCast } from "./cast";
import { Foreground } from "./foreground";
import { LandLayer } from "./land";
import { LifeLayer } from "./life";
import { SkyLayer } from "./sky";
import { type View, makeView } from "./view";

export interface Pointer {
  x: number;
  y: number;
  active: boolean;
  fine: boolean;
}

type Quality = 0 | 1 | 2;

function initialQuality(): Quality {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 8;
  const small = window.innerWidth < 768;
  if (nav.connection?.saveData || cores <= 2 || mem <= 2) return 0;
  if (small || cores <= 4) return 1;
  return 2;
}

/**
 * Draws Alderwood from a WorldState onto two stacked canvases:
 *   sky  - wash, sun, moon, stars, clouds, the survey constellation
 *   land - hills, ground, brook, trees, traces, life, grade, marginalia
 */
export class SceneRenderer {
  private skyCtx: CanvasRenderingContext2D;
  private landCtx: CanvasRenderingContext2D;
  private view: View;
  private cast!: Cast;
  private castKey = "";
  private sky = new SkyLayer();
  private land = new LandLayer();
  private life = new LifeLayer();
  private fg = new Foreground();
  private quality: Quality;
  private dprCap: number;
  private handFont = "";
  private introStart = -1;
  private introDone = false;
  private slowFrames = 0;
  private idleSkip = false;
  private lastC = -1;
  private lastW = 0;
  private lastH = 0;
  pointer: Pointer = { x: -9999, y: -9999, active: false, fine: false };
  private parallax = { x: 0, y: 0 };

  constructor(
    private skyCanvas: HTMLCanvasElement,
    private landCanvas: HTMLCanvasElement,
  ) {
    this.skyCtx = skyCanvas.getContext("2d", { alpha: true })!;
    this.landCtx = landCanvas.getContext("2d", { alpha: true })!;
    this.quality = initialQuality();
    this.dprCap = this.quality === 2 ? 1.75 : this.quality === 1 ? 1.5 : 1;
    this.view = makeView(1, 1, 1, this.quality);
  }

  setHandFont(family: string) {
    this.handFont = family;
    this.lastC = -1;
  }

  startIntro(reduced: boolean) {
    this.introStart = reduced ? -2 : performance.now();
    this.introDone = reduced;
  }

  resize(width: number, height: number) {
    if (width === this.lastW && height === this.lastH) return;
    this.lastW = width;
    this.lastH = height;
    const dpr = Math.min(window.devicePixelRatio || 1, this.dprCap);
    this.view = makeView(width, height, dpr, this.quality);
    for (const c of [this.skyCanvas, this.landCanvas]) {
      c.width = Math.round(width * dpr);
      c.height = Math.round(height * dpr);
    }
    this.skyCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.landCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.sky.resize(this.view);
    this.land.resize(this.view, this.landCtx);
    this.life.resize(this.view);
    this.fg.resize(this.view);
    const aspect = width / height;
    const key = `${this.quality}|${this.view.mobile}|${Math.round(aspect * 4)}`;
    if (key !== this.castKey) {
      this.cast = buildCast(aspect, this.quality, this.view.mobile);
      this.castKey = key;
    }
    this.lastC = -1;
  }

  private introProgress(now: number) {
    if (this.introDone) return 1;
    if (this.introStart < 0) return 1;
    const t = clamp((now - this.introStart) / 2800);
    if (t >= 1) this.introDone = true;
    return t;
  }

  render(frame: Frame) {
    const { world: w, time, dt, reducedMotion } = frame;
    if (!this.cast) return;
    const now = performance.now();
    const intro = this.introProgress(now);

    // A still world needs no redraw under reduced motion.
    if (reducedMotion && !frame.moving && this.lastC === w.c && intro >= 1) return;
    // At rest, the ambient life (wind, glow-worms, water) runs at half rate.
    if (!reducedMotion && !frame.moving && !this.pointer.active && intro >= 1) {
      this.idleSkip = !this.idleSkip;
      if (this.idleSkip) return;
    }
    this.lastC = w.c;

    const v = this.view;
    v.zoom = reducedMotion ? 0 : w.dolly;
    const target = this.pointer.fine && this.pointer.active && !reducedMotion
      ? { x: (this.pointer.x / v.w) * 2 - 1, y: (this.pointer.y / v.h) * 2 - 1 }
      : { x: 0, y: 0 };
    const k = clamp(dt * 3);
    this.parallax.x += (target.x - this.parallax.x) * k;
    this.parallax.y += (target.y - this.parallax.y) * k;
    v.px = this.parallax.x;
    v.py = this.parallax.y;

    this.sky.draw(this.skyCtx, v, w, time, this.handFont);
    this.drawLand(w, time, dt, intro, reducedMotion);

    // Adaptive quality: a sustained long frame interval (which includes GPU
    // fill, not just our JS) steps the resolution down.
    if (!reducedMotion && frame.moving) {
      const slow = dt > 0.026 && dt < 0.1;
      this.slowFrames = slow ? this.slowFrames + 1 : Math.max(0, this.slowFrames - 1);
      if (this.slowFrames > 45 && this.dprCap > 1) {
        this.dprCap = Math.max(1, this.dprCap - 0.35);
        this.slowFrames = 0;
        const { lastW, lastH } = this;
        this.lastW = 0;
        this.resize(lastW, lastH);
      }
    }
  }

  private drawLand(w: WorldState, time: number, dt: number, intro: number, reducedMotion: boolean) {
    const ctx = this.landCtx;
    const v = this.view;
    const { hero, trees } = this.cast;
    ctx.clearRect(0, 0, v.w, v.h);

    const inkIn = easeOutCubic(smoothstep(0.22, 1, intro));
    const rule = easeInOut(smoothstep(0, 0.4, intro));
    const shade: -1 | 0 | 1 = w.sunX < 0.42 ? 1 : w.sunX > 0.58 ? -1 : 0;
    const lineScale = v.mobile ? 0.85 : 1;

    ctx.globalAlpha = 0.25 + 0.75 * inkIn;
    this.land.drawHills(ctx, v, w);
    this.land.drawGround(ctx, v, w);
    ctx.globalAlpha = 1;
    this.land.drawShadows(ctx, v, w, trees);

    const items: { d: number; f: () => void }[] = [];
    // Reduced motion: the alder is not seen toppling; the standing tree
    // dissolves into the fallen one over the same stretch of scroll.
    const crossfade = reducedMotion && w.alderFall > 0 && w.alderFall < 1;
    for (const t of trees) {
      items.push({
        d: t.spec.depth,
        f: () => {
          if (t === hero && crossfade) {
            const k = w.alderFall;
            ctx.globalAlpha = 1 - k;
            t.draw(ctx, v, { ...w, alderFall: 0 }, time, shade, inkIn, lineScale);
            ctx.globalAlpha = k;
            t.draw(ctx, v, { ...w, alderFall: 1 }, time, shade, inkIn, lineScale);
            ctx.globalAlpha = 1;
          } else {
            t.draw(ctx, v, w, time, shade, inkIn, lineScale);
          }
          if (t === hero) {
            this.land.drawSnag(ctx, w, hero.snagX, hero.snagY, hero.snagWidth());
            this.land.drawLogLife(ctx, v, w, hero.logPoints());
          }
        },
      });
    }
    items.push({ d: 0.9, f: () => this.land.drawHaze(ctx, v, w, 0.9, 0.55) });
    items.push({ d: 0.67, f: () => this.land.drawHaze(ctx, v, w, 0.67, 0.4) });
    items.push({ d: 0.64, f: () => this.land.drawFog(ctx, v, w, time, 0) });
    items.push({ d: STREAM_DEPTH + 0.02, f: () => this.land.drawStream(ctx, v, w, time) });
    items.push({ d: 0.46, f: () => this.land.drawStumps(ctx, v, w) });
    items.push({ d: 0.47, f: () => this.land.drawSeedlings(ctx, v, w, inkIn) });
    items.push({
      d: FENCE_DEPTH,
      f: () => {
        const log = hero.logPoints();
        const tip = log.length ? log[log.length - 1].x : -1e4;
        this.land.drawFence(ctx, v, w, tip);
      },
    });
    items.push({ d: 0.41, f: () => this.land.drawHaze(ctx, v, w, 0.41, 0.18 * w.fog * 2) });
    items.push({ d: 0.33, f: () => this.land.drawStakes(ctx, v, w, time, hero.spec.x) });
    items.push({ d: 0.12, f: () => this.land.drawFog(ctx, v, w, time, 1) });
    items.sort((a, b) => b.d - a.d);
    for (const it of items) it.f();

    this.land.drawFogVeil(ctx, v, w);
    this.fg.draw(ctx, v, w, time, dt, this.pointer);
    this.life.drawBirds(ctx, v, w, time);
    this.life.drawLeaves(ctx, v, w, time, hero.crownX, hero.crownY);
    this.life.drawRain(ctx, v, w, reducedMotion ? 0 : time);
    this.land.drawGodRays(ctx, v, w, time);
    this.life.drawMotes(ctx, v, w, time);

    // Time-of-day grade, confined to drawn pixels.
    if (w.gradeAmount > 0.01) {
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = css(w.grade, w.gradeAmount);
      ctx.fillRect(0, 0, v.w, v.h);
      ctx.globalCompositeOperation = "source-over";
    }

    // The owl is drawn after the grade so its face stays readable at dusk.
    this.life.drawOwl(ctx, v, w, time, hero.snagX, hero.snagY, this.pointer.active ? this.pointer.x : v.w / 2, dt);
    this.life.drawGlowWorms(ctx, v, w, time);
    drawAnnotations(ctx, v, w, this.handFont, hero, trees);

    // Opening: the title page's rule runs out to become the horizon.
    if (intro < 1) {
      ctx.strokeStyle = css(INK, 1 - smoothstep(0.7, 1, intro));
      ctx.lineWidth = 1.4;
      const half = (v.w / 2) * rule;
      const x0 = v.mobile ? 16 : v.w * 0.08;
      ctx.beginPath();
      ctx.moveTo(Math.max(0, x0 + 120 - half * 1.2), v.horizon);
      ctx.lineTo(Math.min(v.w, x0 + 120 + half * 2), v.horizon);
      ctx.moveTo(Math.max(0, x0 + 120 - half * 1.2), v.horizon + 4);
      ctx.lineTo(Math.min(v.w, x0 + 120 + half * 2), v.horizon + 4);
      ctx.stroke();
    }
  }
}
