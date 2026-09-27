import { type RGB, css } from "../math";
import { BONE, INK } from "./tracks";
import { clock, type Frame } from "./clock";

declare global {
  interface Window {
    /** Exposed for browser tests: the live state of the chronicle. */
    __alderwood?: { c: number; rawC: number; year: number; hour: number; chapter: number };
  }
}

/**
 * Writes the timeline into CSS so typography can be choreographed in
 * stylesheets instead of React:
 *   --p           on each [data-chapter] section: rawC - index (-1..2)
 *   --title-ink   on :root, colour for type set straight on the scene
 *   --title-halo  on :root, its legibility halo
 *   data-year / data-current / data-inverse on <html>
 * Values are only written when they change meaningfully.
 */
export function bindTimelineToDom() {
  const root = document.documentElement;
  let sections: HTMLElement[] = [];
  const lastP = new Map<HTMLElement, number>();
  let lastInk = "";
  let lastHalo: RGB | null = null;
  let dark = false;
  let lastYear = -1;
  let lastChapter = -1;
  let lastInverse = -1;

  const collect = () => {
    sections = Array.from(document.querySelectorAll<HTMLElement>("section[data-chapter]"));
  };
  collect();
  root.classList.add("timeline-live");

  const onFrame = (f: Frame) => {
    const { world, rawC } = f;
    if (sections.length === 0 || !sections[0].isConnected) collect();

    for (let i = 0; i < sections.length; i++) {
      const el = sections[i];
      const p = Math.max(-1, Math.min(2, rawC - i));
      const prev = lastP.get(el);
      if (prev === undefined || Math.abs(prev - p) > 0.0004) {
        // Sections far from the reader keep a pinned value, not re-written every frame.
        el.style.setProperty("--p", p.toFixed(4));
        lastP.set(el, p);
      }
    }

    // Ink flips in one step, with hysteresis, so type never passes through a
    // low-contrast grey while the sky darkens (or brightens on the way back).
    if (!dark && world.titleSkyLum < 0.18) dark = true;
    else if (dark && world.titleSkyLum > 0.22) dark = false;
    const ink = dark ? css(BONE) : css(INK);
    const inkChanged = ink !== lastInk;
    if (inkChanged) {
      root.style.setProperty("--title-ink", ink);
      lastInk = ink;
    }
    const halo = dark ? world.haloNight : world.haloDay;
    // The halo follows the sky, but only restyles the page on a visible change.
    if (
      !lastHalo ||
      inkChanged ||
      Math.abs(halo[0] - lastHalo[0]) + Math.abs(halo[1] - lastHalo[1]) + Math.abs(halo[2] - lastHalo[2]) > 12
    ) {
      root.style.setProperty("--title-halo", css(halo));
      lastHalo = halo;
    }
    const inv = dark ? 1 : 0;
    if (inv !== lastInverse) {
      root.dataset.inverse = String(inv);
      lastInverse = inv;
    }
    const year = Math.round(world.year);
    if (year !== lastYear) {
      root.dataset.year = String(year);
      lastYear = year;
    }
    const chapter = Math.min(sections.length - 1, Math.max(0, Math.floor(rawC)));
    if (chapter !== lastChapter) {
      root.dataset.current = String(chapter);
      lastChapter = chapter;
    }

    window.__alderwood = {
      c: world.c,
      rawC,
      year: world.year,
      hour: world.hour,
      chapter,
    };
  };

  const unsub = clock.subscribe(onFrame);
  return () => {
    unsub();
  };
}
