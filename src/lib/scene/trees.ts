import { type RGB, clamp, css, easeOutCubic, hex, lerp, mix, rng, smoothstep } from "../math";
import { DEATH, INK } from "../timeline/tracks";
import type { WorldState } from "../timeline/world";
import { type FoliageKind, foliage } from "./sprites";
import { type View, project } from "./view";

export type Species = "alder" | "birch" | "oak" | "young";

interface SpeciesParams {
  trunkSegs: number;
  trunkHeight: number;
  trunkWidth: number;
  taper: number;
  wobble: number;
  branchStart: number;
  perSeg: number;
  lowAngle: number;
  highAngle: number;
  branchLen: number;
  lowLen: number;
  highLen: number;
  maxDepth: number;
  lenDecay: number;
  children: number;
  spread: number;
  clump: number;
  droop: number;
  upturn: number;
  foliage: FoliageKind;
  bark: RGB;
}

const P: Record<Species, SpeciesParams> = {
  alder: {
    trunkSegs: 7, trunkHeight: 0.8, trunkWidth: 0.036, taper: 0.8, wobble: 0.08,
    branchStart: 1, perSeg: 2, lowAngle: 1.2, highAngle: 0.62, branchLen: 0.3,
    lowLen: 1.0, highLen: 0.42, maxDepth: 3, lenDecay: 0.64, children: 2, spread: 0.62,
    clump: 0.085, droop: 0.05, upturn: 0.1, foliage: "alder", bark: hex("#d8d1b6"),
  },
  birch: {
    trunkSegs: 7, trunkHeight: 0.84, trunkWidth: 0.022, taper: 0.8, wobble: 0.06,
    branchStart: 2, perSeg: 2, lowAngle: 0.9, highAngle: 0.45, branchLen: 0.24,
    lowLen: 1.0, highLen: 0.5, maxDepth: 3, lenDecay: 0.68, children: 2, spread: 0.55,
    clump: 0.062, droop: 0.45, upturn: 0, foliage: "birch", bark: hex("#efeadb"),
  },
  oak: {
    trunkSegs: 4, trunkHeight: 0.42, trunkWidth: 0.058, taper: 0.55, wobble: 0.22,
    branchStart: 2, perSeg: 2, lowAngle: 1.05, highAngle: 0.5, branchLen: 0.46,
    lowLen: 1.0, highLen: 0.82, maxDepth: 4, lenDecay: 0.7, children: 3, spread: 0.8,
    clump: 0.085, droop: 0.02, upturn: 0.18, foliage: "oak", bark: hex("#d2caae"),
  },
  young: {
    trunkSegs: 5, trunkHeight: 0.78, trunkWidth: 0.026, taper: 0.75, wobble: 0.1,
    branchStart: 1, perSeg: 1, lowAngle: 0.8, highAngle: 0.5, branchLen: 0.28,
    lowLen: 1.0, highLen: 0.6, maxDepth: 3, lenDecay: 0.66, children: 2, spread: 0.6,
    clump: 0.075, droop: 0.2, upturn: 0.05, foliage: "birch", bark: hex("#e6e0cc"),
  },
};

/** Fraction of a tree's life over which one segment reaches full length. */
const GROW = 0.12;

interface Seg {
  p: number;
  at: number;
  a: number;
  l: number;
  w: number;
  we: number;
  b: number;
  d: number;
  trunk: boolean;
  upper: boolean;
  ph: number;
}

interface Clump {
  /** Random 0..1: sparse seasons keep only the lower-k clumps. */
  k: number;
  s: number;
  t: number;
  r: number;
  b: number;
  v: number;
  ox: number;
  oy: number;
}

export interface TreeSpec {
  species: Species;
  x: number;
  depth: number;
  born: number;
  /** Years to reach full size. */
  mature: number;
  /** Mature height as a fraction of view.unit at depth 0. */
  height: number;
  seed: number;
  /** The great alder at Station A. */
  hero?: boolean;
  /** Reduce recursion for distant trees. */
  detail?: number;
  /** Radians the whole crown leans (edge trees reach in toward the light). */
  lean?: number;
}

export class Tree {
  readonly spec: TreeSpec;
  readonly params: SpeciesParams;
  private segs: Seg[] = [];
  private clumps: Clump[] = [];
  private breakIndex = -1;
  private sx: Float32Array;
  private sy: Float32Array;
  private ex: Float32Array;
  private ey: Float32Array;
  private dir: Float32Array;
  private vis: Float32Array;
  private wpx: Float32Array;

  /* Per-frame outputs used by shadows, annotations and wildlife. */
  baseX = 0;
  baseY = 0;
  heightPx = 0;
  crownX = 0;
  crownY = 0;
  snagX = 0;
  snagY = 0;
  alive = false;
  scale = 0;
  /** Height in feet, for the pencil annotation. */
  feet = 0;
  private unitPx = 0;
  private ageNow = 0;
  private revealNow = 0;

  constructor(spec: TreeSpec) {
    this.spec = spec;
    this.params = P[spec.species];
    this.generate();
    const n = this.segs.length;
    this.sx = new Float32Array(n);
    this.sy = new Float32Array(n);
    this.ex = new Float32Array(n);
    this.ey = new Float32Array(n);
    this.dir = new Float32Array(n);
    this.vis = new Float32Array(n);
    this.wpx = new Float32Array(n);
  }

  private generate() {
    const R = rng(this.spec.seed);
    const p = this.params;
    const maxDepth = Math.max(2, p.maxDepth - (this.spec.detail ?? 0));
    const segs = this.segs;
    const clumps = this.clumps;
    const nT = p.trunkSegs;
    const breakAt = this.spec.hero ? 3 : -1;

    const grow = (parent: number, at: number, a: number, l: number, w: number, b: number, d: number, upper: boolean) => {
      const idx = segs.length;
      segs.push({ p: parent, at, a, l, w, we: w * 0.62, b: Math.min(0.96, b), d, trunk: false, upper, ph: R() * 6.28 });
      const tipGrowth = b + GROW * 0.5;
      if (d >= maxDepth || l < 0.035) {
        clumps.push({ k: R(), s: idx, t: 1, r: p.clump * (0.75 + R() * 0.55), b: tipGrowth, v: (R() * 6) | 0, ox: 0, oy: 0 });
        return;
      }
      if (d >= maxDepth - 1) {
        clumps.push({ k: R(), s: idx, t: 0.55, r: p.clump * (0.55 + R() * 0.4), b: tipGrowth, v: (R() * 6) | 0, ox: (R() - 0.5) * 0.3, oy: 0 });
      }
      const kids = d === 0 ? p.children : Math.max(2, p.children - (R() < 0.4 ? 1 : 0));
      for (let k = 0; k < kids; k++) {
        const cont = k === 0;
        const side = k % 2 === 0 ? 1 : -1;
        const ang = cont ? (R() - 0.5) * 0.4 : side * (p.spread * (0.6 + R() * 0.6));
        const cat = cont ? 1 : 0.45 + R() * 0.5;
        const cl = l * p.lenDecay * (cont ? 1 : 0.85) * (0.8 + R() * 0.4);
        grow(idx, cat, ang, cl, w * 0.62, b + GROW * cat + R() * 0.04, d + 1, upper);
      }
    };

    let parent = -1;
    for (let k = 0; k < nT; k++) {
      const rel = k / nT;
      const idx = segs.length;
      const upper = breakAt >= 0 && k >= breakAt;
      if (k === breakAt) this.breakIndex = idx;
      const w = p.trunkWidth * (1 - rel * p.taper);
      const we = p.trunkWidth * (1 - ((k + 1) / nT) * p.taper);
      segs.push({
        p: parent,
        at: 1,
        a: k === 0 ? (R() - 0.5) * 0.05 : (R() - 0.5) * p.wobble,
        l: p.trunkHeight / nT,
        w,
        we,
        b: rel * 0.6,
        d: 0,
        trunk: true,
        upper,
        ph: R() * 6.28,
      });
      if (k >= p.branchStart) {
        for (let j = 0; j < p.perSeg; j++) {
          const side = (k + j) % 2 === 0 ? 1 : -1;
          const angle = side * lerp(p.lowAngle, p.highAngle, rel) + (R() - 0.5) * 0.3;
          const len = p.branchLen * lerp(p.lowLen, p.highLen, rel) * (0.78 + R() * 0.44);
          const at = 0.25 + R() * 0.7;
          grow(idx, at, angle, len, w * 0.5, rel * 0.6 + GROW * at + 0.03 + R() * 0.05, 1, upper);
        }
      }
      parent = idx;
    }
    // Apex tuft for conical species.
    if (this.params.foliage !== "oak") {
      clumps.push({ k: 0, s: parent, t: 1, r: p.clump * 1.1, b: 0.5, v: 2, ox: 0, oy: -0.02 });
    }
  }

  /** Shared per-frame context from the renderer. */
  draw(
    ctx: CanvasRenderingContext2D,
    v: View,
    w: WorldState,
    time: number,
    shade: -1 | 0 | 1,
    reveal: number,
    lineScale: number,
  ) {
    const spec = this.spec;
    const p = this.params;
    const age = clamp((w.year - spec.born) / spec.mature);
    this.alive = age > 0;
    if (!this.alive) return;

    const proj = project(v, spec.x, spec.depth);
    const S = 0.16 + 0.84 * (1 - Math.pow(1 - age, 1.8));
    const unit = spec.height * v.unit * proj.s * S;
    const r = Math.min(1, age * 2.3) * reveal;
    this.unitPx = unit;
    this.ageNow = age;
    this.revealNow = r;
    this.baseX = proj.x;
    this.baseY = proj.y;
    this.scale = proj.s;

    const fallen = spec.hero ? w.alderFall : 0;
    const dead = spec.hero ? smoothstep(DEATH[0], DEATH[1], w.c) : 0;
    const afterYears = spec.hero ? Math.max(0, w.year - 1968) * (w.c > 4.8 ? 1 : 0) : 0;
    const decay = smoothstep(0, 22, afterYears);

    // Wind: sway grows with gusts; the storm leans the whole wood east.
    const swayAmp = 0.012 + w.wind * 0.07;
    const swayFreq = 1.1 + w.wind * 2.6;
    // Gusts: the storm lean breathes rather than holding still.
    const gust = 0.75 + 0.25 * Math.sin(time * 0.9 + spec.x * 3) * Math.sin(time * 2.3);
    const lean = w.wind * w.wind * 0.2 * gust;
    const segs = this.segs;
    const n = segs.length;
    let top = Infinity;
    let topX = proj.x;

    for (let i = 0; i < n; i++) {
      const s = segs[i];
      let f = clamp((r - s.b) / GROW);
      if (s.p >= 0 && this.vis[s.p] <= 0) f = 0;
      // Dead wood: fine twigs fall off first, limbs later.
      if (dead > 0 && !s.trunk) {
        const loss = s.d >= 2 ? decay * 1.6 : decay * 0.9;
        f *= clamp(1 - loss);
      }
      this.vis[i] = f;
      if (f <= 0) continue;

      const pd = s.p < 0 ? -Math.PI / 2 + (spec.lean ?? 0) * 0.35 : this.dir[s.p];
      const still = s.upper && fallen > 0;
      const weight = s.trunk ? 0.35 : 0.3 + s.d * 0.35;
      const sway = still ? 0 : (Math.sin(time * swayFreq + s.ph + spec.x * 5) * swayAmp + lean * 0.45) * weight;
      let d = pd + s.a + sway + (s.trunk ? 0 : (spec.lean ?? 0) * 0.25);
      if (!s.trunk) {
        const depthFrac = s.d / p.maxDepth;
        d += (Math.PI / 2 - d) * p.droop * depthFrac * 0.5;
        d += (-Math.PI / 2 - d) * p.upturn * (1 - depthFrac) * 0.4;
      }
      this.dir[i] = d;

      let x0: number;
      let y0: number;
      if (s.p < 0) {
        x0 = proj.x;
        y0 = proj.y;
      } else {
        const pp = s.p;
        x0 = this.sx[pp] + (this.ex[pp] - this.sx[pp]) * s.at;
        y0 = this.sy[pp] + (this.ey[pp] - this.sy[pp]) * s.at;
      }
      const len = s.l * f * unit;
      this.sx[i] = x0;
      this.sy[i] = y0;
      this.ex[i] = x0 + Math.cos(d) * len;
      this.ey[i] = y0 + Math.sin(d) * len;
      this.wpx[i] = s.w * unit * (0.45 + 0.55 * f) * (0.55 + 0.45 * age);
    }

    // The great alder snaps at its fourth trunk joint and goes over eastward.
    if (spec.hero && this.breakIndex >= 0 && fallen > 0) {
      const bi = this.breakIndex;
      const bx = this.sx[bi];
      const by = this.sy[bi];
      const hb = Math.max(1, proj.y - by);
      const lu = Math.max(hb * 1.2, (this.params.trunkHeight - (this.breakIndex / p.trunkSegs) * p.trunkHeight) * unit * 1.25);
      const thetaHit = Math.acos(clamp(-hb / lu, -1, 1));
      let theta: number;
      let px = bx;
      let py = by;
      if (fallen < 0.78) {
        theta = thetaHit * (fallen / 0.78);
      } else {
        const t = (fallen - 0.78) / 0.22;
        const e = easeOutCubic(t);
        theta = lerp(thetaHit, Math.PI / 2 + 0.03, e);
        px = bx + hb * 0.35 * e;
        py = lerp(by, proj.y - this.wpx[bi] * 0.45 + decay * this.wpx[bi] * 0.25, e);
      }
      const cs = Math.cos(theta);
      const sn = Math.sin(theta);
      for (let i = 0; i < n; i++) {
        if (!segs[i].upper || this.vis[i] <= 0) continue;
        let dx = this.sx[i] - bx;
        let dy = this.sy[i] - by;
        this.sx[i] = px + dx * cs - dy * sn;
        this.sy[i] = py + dx * sn + dy * cs;
        dx = this.ex[i] - bx;
        dy = this.ey[i] - by;
        this.ex[i] = px + dx * cs - dy * sn;
        this.ey[i] = py + dx * sn + dy * cs;
        // Branches pressed into the ground stay above it.
        if (this.ey[i] > proj.y + 2) this.ey[i] = proj.y + 2;
        if (this.sy[i] > proj.y + 2) this.sy[i] = proj.y + 2;
      }
      this.snagX = bx;
      this.snagY = by;
    } else if (spec.hero && this.breakIndex >= 0) {
      this.snagX = this.sx[this.breakIndex];
      this.snagY = this.sy[this.breakIndex];
    }

    for (let i = 0; i < n; i++) {
      if (this.vis[i] <= 0) continue;
      if (spec.hero && fallen > 0 && segs[i].upper) continue;
      if (this.ey[i] < top) {
        top = this.ey[i];
        topX = this.ex[i];
      }
    }
    this.crownX = topX;
    this.crownY = top === Infinity ? proj.y : top;
    this.heightPx = proj.y - this.crownY;
    // Measured against the journal: 3 ft when Edmund first saw it in 1887.
    const since = clamp((w.year - 1887) / 75);
    this.feet = Math.round(3 + 69 * (1 - Math.pow(1 - since, 1.6)));

    this.render(ctx, w, shade, lineScale, dead);
  }

  private render(
    ctx: CanvasRenderingContext2D,
    w: WorldState,
    shade: -1 | 0 | 1,
    lineScale: number,
    dead: number,
  ) {
    const p = this.params;
    const baseA = ctx.globalAlpha;
    const segs = this.segs;
    const n = segs.length;
    const depthAlpha = 1 - this.spec.depth * 0.3;
    const ink = css(INK, depthAlpha);
    const night = w.night;
    const barkFill = css(mix(mix(p.bark, w.horizon, this.spec.depth * 0.35), INK, 0.1 + night * 0.5 + dead * 0.18));

    const quads = new Path2D();
    const outline = new Path2D();
    const hatch = new Path2D();
    const buckets = new Map<number, Path2D>();
    const lenticels = p.foliage === "birch" ? new Path2D() : null;

    for (let i = 0; i < n; i++) {
      const f = this.vis[i];
      if (f <= 0) continue;
      const x0 = this.sx[i];
      const y0 = this.sy[i];
      const x1 = this.ex[i];
      const y1 = this.ey[i];
      const w0 = this.wpx[i];
      const s = segs[i];
      const w1 = s.trunk ? (w0 * s.we) / s.w : w0 * 0.66;
      if (w0 > 2.4) {
        const dx = x1 - x0;
        const dy = y1 - y0;
        const L = Math.hypot(dx, dy) || 1;
        const nx = -dy / L;
        const ny = dx / L;
        const ax = x0 + nx * w0 * 0.5;
        const ay = y0 + ny * w0 * 0.5;
        const bx = x1 + nx * w1 * 0.5;
        const by = y1 + ny * w1 * 0.5;
        const cx = x1 - nx * w1 * 0.5;
        const cy = y1 - ny * w1 * 0.5;
        const ddx = x0 - nx * w0 * 0.5;
        const ddy = y0 - ny * w0 * 0.5;
        quads.moveTo(ax, ay);
        quads.lineTo(bx, by);
        quads.lineTo(cx, cy);
        quads.lineTo(ddx, ddy);
        quads.closePath();
        outline.moveTo(ax, ay);
        outline.lineTo(bx, by);
        outline.moveTo(ddx, ddy);
        outline.lineTo(cx, cy);
        // Hatch the side turned away from the sun.
        const sideSign = shade === 0 ? (nx > 0 ? 1 : -1) : nx * shade > 0 ? 1 : -1;
        const lines = w0 > 14 ? 5 : w0 > 9 ? 4 : w0 > 5 ? 2 : 1;
        for (let k = 1; k <= lines; k++) {
          const o = (0.5 - k * (0.42 / (lines + 1))) * sideSign;
          hatch.moveTo(x0 + nx * w0 * o, y0 + ny * w0 * o);
          hatch.lineTo(x1 + nx * w1 * o, y1 + ny * w1 * o);
        }
        if (lenticels && s.trunk) {
          const marks = Math.max(1, Math.floor(L / 9));
          for (let k = 0; k < marks; k++) {
            const t = (k + 0.5) / marks;
            const mx = x0 + dx * t;
            const my = y0 + dy * t;
            const ww = lerp(w0, w1, t) * (0.2 + ((k * 37) % 5) / 12);
            const o = ((k * 53) % 7) / 7 - 0.5;
            lenticels.moveTo(mx + nx * (o * w0 - ww * 0.5), my + ny * (o * w0 - ww * 0.5));
            lenticels.lineTo(mx + nx * (o * w0 + ww * 0.5), my + ny * (o * w0 + ww * 0.5));
          }
        }
      } else {
        const q = Math.max(0.5, Math.round(w0 * 2) / 2);
        let path = buckets.get(q);
        if (!path) {
          path = new Path2D();
          buckets.set(q, path);
        }
        path.moveTo(x0, y0);
        path.lineTo(x1, y1);
      }
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = barkFill;
    ctx.fill(quads);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.15 * lineScale;
    ctx.stroke(outline);
    ctx.lineWidth = 0.8 * lineScale;
    ctx.globalAlpha = baseA * 0.85;
    ctx.stroke(hatch);
    if (lenticels) {
      ctx.lineWidth = 1.6 * lineScale;
      ctx.stroke(lenticels);
    }
    ctx.globalAlpha = baseA * 1;
    buckets.forEach((path, wq) => {
      ctx.lineWidth = Math.max(0.55, wq * 0.9) * lineScale;
      ctx.stroke(path);
    });

    // Foliage.
    const leaf = w.leafiness * (1 - dead);
    if (leaf <= 0.02) return;
    const sprites = foliage(p.foliage, w.leafColor, shade, night);
    const age = this.ageNow;
    const reveal = this.revealNow;
    const leafScale = this.unitPx * (0.2 + 0.8 * leaf) * 2;
    ctx.globalAlpha = baseA * depthAlpha;

    // A young tree carries a leading tuft at whatever height it has reached.
    if (age < 0.45) {
      let tx = this.baseX;
      let ty = this.baseY;
      for (let i = 0; i < n; i++) {
        if (segs[i].trunk && this.vis[i] > 0 && this.ey[i] < ty) {
          tx = this.ex[i];
          ty = this.ey[i];
        }
      }
      const tuft = p.clump * leafScale * 1.2 * (1 - age / 0.45) + 3 * this.scale;
      if (tuft > 1.5) ctx.drawImage(sprites[1], tx - tuft / 2, ty - tuft * 0.62, tuft, tuft);
    }

    for (let i = 0; i < this.clumps.length; i++) {
      const c = this.clumps[i];
      const f = this.vis[c.s];
      if (f <= 0 || c.k > leaf * 1.1) continue;
      const cf = clamp((reveal - c.b) / 0.14);
      if (cf <= 0) continue;
      const t = c.t * f;
      const x = this.sx[c.s] + (this.ex[c.s] - this.sx[c.s]) * t;
      const y = this.sy[c.s] + (this.ey[c.s] - this.sy[c.s]) * t;
      const px = c.r * leafScale * cf;
      if (px < 1.5) continue;
      ctx.drawImage(sprites[c.v], x - px / 2 + c.ox * px, y - px / 2 + c.oy * px, px, px);
    }
    ctx.globalAlpha = baseA * 1;
  }

  /** Points along the fallen trunk, for moss, fungi and ferns. */
  logPoints(): { x: number; y: number; w: number }[] {
    if (!this.spec.hero || this.breakIndex < 0) return [];
    const out: { x: number; y: number; w: number }[] = [];
    for (let i = this.breakIndex; i < this.segs.length; i++) {
      const s = this.segs[i];
      if (!s.trunk || this.vis[i] <= 0) continue;
      out.push({ x: (this.sx[i] + this.ex[i]) / 2, y: (this.sy[i] + this.ey[i]) / 2, w: this.wpx[i] });
    }
    return out;
  }

  /** Top of the snapped trunk, where the owls nest. */
  snagWidth() {
    return this.breakIndex > 0 ? this.wpx[this.breakIndex - 1] : 0;
  }
}
