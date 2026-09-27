import { lerp } from "../math";

/**
 * Screen-space model of the scene. Depth runs 0 (at the reader's feet) to
 * 1 (the far ridge). Everything is placed with project(), which applies the
 * slow century-long dolly into the wood and the pointer parallax.
 */
export interface View {
  w: number;
  h: number;
  dpr: number;
  horizon: number;
  groundSpan: number;
  mobile: boolean;
  /** 0 low, 1 medium, 2 full. */
  quality: 0 | 1 | 2;
  /** Century dolly, 0..1. */
  zoom: number;
  /** Pointer parallax, -1..1 each axis (0 on touch / reduced motion). */
  px: number;
  py: number;
  /**
   * Unit of tree height. Landscape screens scale by height; portrait tablets
   * are capped by width so the canopy leaves the night sky open.
   */
  unit: number;
}

export const HORIZON_DESKTOP = 0.64;
export const HORIZON_MOBILE = 0.6;

export function makeView(w: number, h: number, dpr: number, quality: 0 | 1 | 2): View {
  const mobile = w < 768;
  const horizon = Math.round(h * (mobile ? HORIZON_MOBILE : HORIZON_DESKTOP));
  return {
    w,
    h,
    dpr,
    horizon,
    groundSpan: h - horizon,
    mobile,
    quality,
    zoom: 0,
    px: 0,
    py: 0,
    unit: Math.min(h, w * (!mobile && h > w ? 1.02 : 1.35)),
  };
}

export const depthScale = (depth: number) => lerp(1, 0.2, depth);

/** Ground contact line for a given depth. */
export const groundY = (v: View, depth: number) =>
  v.horizon + Math.pow(1 - depth, 1.6) * v.groundSpan * 0.94;

/** Dolly magnification for a depth: near things grow as we walk in. */
export const zoomAt = (v: View, depth: number) => 1 + v.zoom * (1 - depth) * 0.28;

export function project(v: View, xNorm: number, depth: number) {
  const z = zoomAt(v, depth);
  const cx = v.w * 0.5;
  const par = 1 - depth;
  const x = cx + (xNorm * v.w - cx) * z + v.px * par * 16;
  const y = v.horizon + (groundY(v, depth) - v.horizon) * z + v.py * par * 5;
  return { x, y, s: depthScale(depth) * z };
}
