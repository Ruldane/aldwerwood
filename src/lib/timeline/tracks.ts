import { type RGB, clamp, hex, lerp, mix, smooth } from "../math";

/**
 * Keyframe tracks. A key is [c, value] where c is the chapter coordinate:
 * the integer part is the chapter index (0 = 1887 ... 6 = present day) and
 * the fraction is how far the reader is through that chapter.
 * Interpolation is smoothstep between keys, so parameters ease into each
 * chapter's established state instead of flipping.
 */
export type Key<T> = readonly [number, T];

function locate<T>(keys: readonly Key<T>[], c: number): [number, number] {
  if (c <= keys[0][0]) return [0, 0];
  const last = keys.length - 1;
  if (c >= keys[last][0]) return [last, 0];
  let i = 0;
  while (i < last && keys[i + 1][0] <= c) i++;
  const [c0] = keys[i];
  const [c1] = keys[i + 1];
  return [i, (c - c0) / (c1 - c0)];
}

export function num(keys: readonly Key<number>[], ease: (t: number) => number = smooth) {
  return (c: number) => {
    const [i, t] = locate(keys, c);
    if (t === 0) return keys[i][1];
    return lerp(keys[i][1], keys[i + 1][1], ease(clamp(t)));
  };
}

export function col(keys: readonly Key<string>[]) {
  const parsed = keys.map(([k, v]) => [k, hex(v)] as const);
  return (c: number): RGB => {
    const [i, t] = locate(parsed, c);
    if (t === 0) return parsed[i][1];
    return mix(parsed[i][1], parsed[i + 1][1], smooth(t));
  };
}

const linear = (t: number) => t;

/* ------------------------------------------------------------------ */
/*  THE CHRONICLE TIMELINE                                            */
/* ------------------------------------------------------------------ */

/** Calendar year. Plateaus hold a year while its chapter is being read. */
export const year = num(
  [
    [0, 1887],
    [0.7, 1887],
    [1.5, 1906],
    [2.5, 1924],
    [3.12, 1939],
    [3.56, 1947],
    [4.12, 1968],
    [5.0, 1968],
    [5.55, 1989],
    [6.15, 2026],
    [7, 2026],
  ],
  linear,
);

/**
 * Hour of the reader's single day: the archivist opens the first notebook at
 * dawn and closes the last one after dark. 5.6 = 05:36, 22.8 = 22:48.
 */
export const hour = num([
  [0, 5.55],
  [0.7, 6.35],
  [1.5, 8.6],
  [2.5, 12.2],
  [3.5, 15.0],
  [4.15, 17.2],
  [4.7, 18.3],
  [5.0, 18.9],
  [5.55, 19.9],
  [6.2, 21.7],
  [7, 22.9],
]);

/** How much foliage the season carries (journal dates drive the season). */
export const leafiness = num([
  [0, 0.34], // April 1887
  [1.5, 0.72], // May 1906
  [2.5, 1.0], // June 1924
  [3.3, 0.36], // March 1947, buds only
  [3.75, 0.36],
  [4.14, 0.9], // October 1968
  [4.46, 0.8],
  [4.8, 0.42], // stripped by the storm
  [5.55, 0.34], // November 1989
  [6.15, 1.0], // July, present day
  [7, 1.0],
]);

export const leafColor = col([
  [0, "#a1ab6b"],
  [1.5, "#8a9a57"],
  [2.5, "#5f6e3d"],
  [3.3, "#7f8a55"],
  [3.8, "#7f8a55"],
  [4.2, "#9c7a45"],
  [4.9, "#86653d"],
  [5.55, "#7b5b37"],
  [6.15, "#4f5e38"],
  [7, "#4f5e38"],
]);

export const fog = num([
  [0, 0.42],
  [0.7, 0.22],
  [1.2, 0.06],
  [2.8, 0.05],
  [3.22, 0.78],
  [3.62, 0.72],
  [4.12, 0.08],
  [5.5, 0.28],
  [6.2, 0.1],
  [7, 0.14],
]);

export const wind = num([
  [0, 0.12],
  [4.14, 0.18],
  [4.34, 0.72],
  [4.5, 1.0],
  [4.7, 0.9],
  [4.95, 0.22],
  [7, 0.12],
]);

export const rain = num([
  [0, 0],
  [4.3, 0],
  [4.42, 0.75],
  [4.6, 1],
  [4.82, 0.55],
  [5.02, 0],
  [7, 0],
]);

export const storm = num([
  [0, 0],
  [4.12, 0],
  [4.34, 0.6],
  [4.52, 1],
  [4.8, 0.8],
  [5.12, 0],
  [7, 0],
]);

/** Brook swelling after the storm. */
export const flood = num([
  [0, 0],
  [4.5, 0],
  [4.82, 1],
  [5.6, 0],
  [7, 0],
]);

/** Pencil annotations exist only while someone is keeping the notebook. */
export const observer = num([
  [0, 1],
  [3.02, 1],
  [3.16, 0],
  [3.55, 0],
  [3.66, 1],
  [6.05, 1],
  [6.2, 0],
  [7, 0],
]);

/* Event windows (chapter-local choreography) --------------------------- */

/** The great alder's fall: chapter V local progress 0.50 to 0.64. */
export const FALL_START = 4.5;
export const FALL_END = 4.64;
/** Branches of the fallen tree begin to die back as it goes over. */
export const DEATH = [4.52, 4.7] as const;

/** Rooks leave the wood before the storm. */
export const ROOKS_START = 4.1;
export const ROOKS_END = 4.36;

/** Songbirds cross the young grove. */
export const BIRDS_START = 1.1;
export const BIRDS_END = 2.9;

/** The owl sits in the hollow snag, then crosses the moon. */
export const OWL_IN = 5.25;
export const OWL_FLIGHT_START = 6.02;
export const OWL_FLIGHT_END = 6.32;

/** Glow-worms and the survey constellation. */
export const GLOW_IN = [6.05, 6.35] as const;
export const CONSTELLATION = [6.34, 6.78] as const;

/* Sky by hour ----------------------------------------------------------- */

const skyZenith = col([
  [5.0, "#6c7890"],
  [5.9, "#8d98ab"],
  [6.6, "#a4b1bd"],
  [9.0, "#a8bcc7"],
  [12.3, "#a2bac8"],
  [15.0, "#adbac0"],
  [17.3, "#b3a488"],
  [18.5, "#71697a"],
  [19.5, "#3d4768"],
  [20.6, "#1b2a4b"],
  [22.0, "#101c36"],
  [24.0, "#0c1629"],
]);

const skyHorizon = col([
  [5.0, "#b59c9a"],
  [5.9, "#dcb9a4"],
  [6.6, "#e7d2b5"],
  [9.0, "#e2e1cf"],
  [12.3, "#e5e5d4"],
  [15.0, "#e2dcc3"],
  [17.3, "#e8b572"],
  [18.5, "#cd8a57"],
  [19.5, "#8a6c7b"],
  [20.6, "#3d4c72"],
  [22.0, "#1d2e50"],
  [24.0, "#152440"],
]);

/** Colour grade laid over the land by hour (applied source-atop). */
const gradeColor = col([
  [5.0, "#5c6684"],
  [6.4, "#9a8f9a"],
  [8.5, "#e8e2cc"],
  [15.0, "#e8e2cc"],
  [17.3, "#c9853b"],
  [18.6, "#8a5a4a"],
  [19.6, "#34406a"],
  [21.0, "#0f1b36"],
  [24.0, "#0b1428"],
]);

const gradeAmount = num([
  [5.0, 0.42],
  [6.4, 0.16],
  [8.5, 0.0],
  [15.0, 0.0],
  [17.3, 0.22],
  [18.6, 0.34],
  [19.6, 0.5],
  [21.0, 0.62],
  [24.0, 0.66],
]);

export const sky = {
  zenith: (h: number) => skyZenith(h),
  horizon: (h: number) => skyHorizon(h),
  grade: (h: number) => gradeColor(h),
  gradeAmount: (h: number) => gradeAmount(h),
};

export const STORM_SKY: RGB = hex("#4b5159");
export const STORM_HORIZON: RGB = hex("#77706a");
export const FOG_COLOR: RGB = hex("#d9d7c9");
export const STORM_GRADE: RGB = hex("#39424e");

/* Palette tokens used by the renderer ----------------------------------- */

export const INK: RGB = hex("#25282a"); // iron-gall blue-black
export const PAPER: RGB = hex("#e4dfca"); // laid paper, faintly green
export const PAPER_SHADE: RGB = hex("#cfc8ad");
export const BONE: RGB = hex("#ebe5d1");
export const PENCIL: RGB = hex("#56544f");
export const STAMP: RGB = hex("#a83a2c");
export const GLOW: RGB = hex("#d9f07a");
export const NIGHT_DEEP: RGB = hex("#0e1a33");
