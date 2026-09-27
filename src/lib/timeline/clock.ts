import { clamp } from "../math";
import { type WorldState, evaluateWorld, LAST_CHAPTER } from "./world";

/**
 * The Chronicle clock turns native scroll position into time.
 *
 * Each chapter <section data-chapter="i"> contributes an anchor: the scroll
 * offset at which its top meets the top of the viewport. The chapter
 * coordinate c is piecewise-linear between anchors, and the final anchor is
 * the bottom of the page, so c runs 0 at the top to 7 at the very end on any
 * viewport and any content height.
 *
 * There is no scroll listener. One requestAnimationFrame loop reads scrollY
 * (a cheap read, no forced layout), advances a softly smoothed copy of c for
 * the scene, and hands the evaluated world to subscribers. Nothing here
 * touches React state.
 */

export interface Frame {
  world: WorldState;
  /** Raw, unsmoothed chapter coordinate (exactly tracks the scrollbar). */
  rawC: number;
  /** Seconds since start; frozen at 0 for reduced motion. */
  time: number;
  dt: number;
  reducedMotion: boolean;
  /** True when c moved this frame. */
  moving: boolean;
}

type Listener = (f: Frame) => void;

class ChronicleClock {
  private anchors: number[] = [0, 1];
  private sections: HTMLElement[] = [];
  private listeners = new Set<Listener>();
  private raf = 0;
  private running = false;
  private smoothC = 0;
  private lastT = 0;
  private startT = 0;
  private ro: ResizeObserver | null = null;
  private mq: MediaQueryList | null = null;
  reducedMotion = false;
  lastFrame: Frame | null = null;

  start() {
    if (this.running || typeof window === "undefined") return;
    this.running = true;
    this.mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.reducedMotion = this.mq.matches;
    this.mq.addEventListener("change", this.onMotionPref);
    this.measure();
    this.ro = new ResizeObserver(() => this.measure());
    this.ro.observe(document.documentElement);
    this.ro.observe(document.body);
    window.addEventListener("resize", this.measure);
    this.smoothC = this.readC();
    this.startT = performance.now();
    this.lastT = this.startT;
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    this.mq?.removeEventListener("change", this.onMotionPref);
    window.removeEventListener("resize", this.measure);
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    if (this.lastFrame) fn(this.lastFrame);
    return () => {
      this.listeners.delete(fn);
    };
  }

  /** Scroll offset for the start of a chapter (used by the year rule). */
  anchorFor(chapter: number) {
    return this.anchors[clamp(chapter, 0, LAST_CHAPTER)] ?? 0;
  }

  private onMotionPref = (e: MediaQueryListEvent) => {
    this.reducedMotion = e.matches;
  };

  measure = () => {
    this.sections = Array.from(document.querySelectorAll<HTMLElement>("section[data-chapter]"));
    const y = window.scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const tops = this.sections.map((s) => clamp(s.getBoundingClientRect().top + y, 0, max));
    if (tops.length === 0) {
      this.anchors = [0, max];
      return;
    }
    tops[0] = 0;
    // Guarantee strictly increasing anchors ending at the page bottom.
    const anchors = [...tops, max];
    for (let i = 1; i < anchors.length; i++) {
      anchors[i] = Math.max(anchors[i], anchors[i - 1] + 1);
    }
    this.anchors = anchors;
  };

  private readC() {
    const y = window.scrollY;
    const a = this.anchors;
    const n = a.length - 1;
    if (y <= a[0]) return 0;
    if (y >= a[n]) return n;
    let i = 0;
    while (i < n - 1 && y >= a[i + 1]) i++;
    return i + clamp((y - a[i]) / (a[i + 1] - a[i]));
  }

  private tick = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.1, (now - this.lastT) / 1000);
    this.lastT = now;

    const rawC = this.readC();
    const prev = this.smoothC;
    if (this.reducedMotion) {
      this.smoothC = rawC;
    } else {
      // Critically-damped-ish follow: world growth feels organic, never laggy.
      const k = 1 - Math.exp(-dt * 7.5);
      this.smoothC += (rawC - this.smoothC) * k;
      if (Math.abs(rawC - this.smoothC) < 0.0002) this.smoothC = rawC;
    }

    const frame: Frame = {
      world: evaluateWorld(this.smoothC),
      rawC,
      time: this.reducedMotion ? 0 : (now - this.startT) / 1000,
      dt,
      reducedMotion: this.reducedMotion,
      moving: Math.abs(this.smoothC - prev) > 1e-5 || this.lastFrame === null,
    };
    this.lastFrame = frame;
    // Schedule first, and isolate listeners: one failure never stops time.
    this.raf = requestAnimationFrame(this.tick);
    this.listeners.forEach((fn) => {
      try {
        fn(frame);
      } catch (err) {
        console.error("[alderwood] frame listener failed", err);
      }
    });
  };
}

export const clock = new ChronicleClock();
