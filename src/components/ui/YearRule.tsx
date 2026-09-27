"use client";

import { useEffect, useRef, useState } from "react";
import { CHAPTERS } from "@/content/chronicle";
import { clock } from "@/lib/timeline/clock";

const RINGS = 7;
const LAST = CHAPTERS.length - 1;

function yearLabel(year: number) {
  return year >= 2025.5 ? "Now" : String(Math.floor(year));
}

/**
 * The year rule: a surveyor's scale in the right margin with a tree-ring
 * disc that slides down it as the years pass (a ring is laid down every
 * couple of decades). On small screens it folds into a year stamp that
 * opens the list of chapters. Updated straight from the clock, never
 * through React state.
 */
export function YearRule() {
  const [open, setOpen] = useState(false);
  const marker = useRef<HTMLSpanElement>(null);
  const readouts = useRef<(HTMLSpanElement | null)[]>([]);
  const rings = useRef<SVGGElement>(null);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    let lastYear = -1;
    let lastChapter = -1;
    let lastY = -1;
    return clock.subscribe(({ world, rawC }) => {
      const y = Math.min(rawC, LAST) / LAST;
      if (marker.current && Math.abs(y - lastY) > 0.0005) {
        marker.current.style.setProperty("--y", y.toFixed(4));
        lastY = y;
      }
      const yr = Math.floor(world.year);
      if (yr !== lastYear) {
        const label = yearLabel(world.year);
        readouts.current.forEach((el) => {
          if (el) el.textContent = label;
        });
        const g = rings.current;
        if (g) {
          const shown = Math.round(((world.year - 1887) / (2026 - 1887)) * RINGS);
          Array.from(g.children).forEach((c, i) => c.setAttribute("opacity", i <= shown ? "1" : "0"));
        }
        lastYear = yr;
      }
      const ch = Math.min(LAST, Math.floor(rawC));
      if (ch !== lastChapter) {
        links.current.forEach((a, i) => {
          if (!a) return;
          if (i === ch) a.setAttribute("aria-current", "location");
          else a.removeAttribute("aria-current");
        });
        lastChapter = ch;
      }
    });
  }, []);

  // The mobile list closes on Escape or a tap anywhere else.
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const jump = (i: number) => (ev: React.MouseEvent<HTMLAnchorElement>) => {
    ev.preventDefault();
    const start = clock.anchorFor(i);
    const next = i < LAST ? clock.anchorFor(i + 1) : document.documentElement.scrollHeight - window.innerHeight;
    const top = i === 0 ? 0 : start + (next - start) * 0.14;
    window.scrollTo({ top, behavior: clock.reducedMotion ? "auto" : "smooth" });
    document.getElementById(CHAPTERS[i].id)?.focus({ preventScroll: true });
    setOpen(false);
  };

  return (
    <nav
      ref={navRef}
      id="years"
      aria-label="Years of the chronicle"
      tabIndex={-1}
      className="year-rule on-scene fixed right-3 top-3 z-[3] outline-none lg:bottom-[14svh] lg:right-6 lg:top-[14svh] lg:w-[6.5rem]"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="years-list"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-11 items-center gap-2 border border-current/40 bg-[var(--title-halo)] px-3 py-1.5 lg:hidden"
      >
        <RingIcon className="h-5 w-5" />
        <span className="sr-only">Chapters. Current year: </span>
        <span ref={(el) => { readouts.current[0] = el; }} className="font-display text-[1.15rem] leading-none">
          1887
        </span>
      </button>

      {/* Desktop: live year atop the rule. */}
      <p aria-hidden className="absolute -top-12 right-0 hidden text-right lg:block">
        <span ref={(el) => { readouts.current[1] = el; }} className="font-display text-[1.6rem] leading-none">
          1887
        </span>
      </p>

      <div className={`${open ? "block" : "hidden"} lg:relative lg:block lg:h-full`}>
        <span aria-hidden className="absolute bottom-0 right-[7px] top-0 hidden w-px bg-current opacity-50 lg:block" />
        <ol
          id="years-list"
          className="contents-sheet mt-2 min-w-[15rem] px-4 py-3 text-ink [text-shadow:none] lg:relative lg:mt-0 lg:h-full lg:min-w-0 lg:p-0 lg:text-[inherit] lg:[text-shadow:inherit]"
        >
          {CHAPTERS.map((c, i) => (
            <li
              key={c.id}
              className="lg:absolute lg:right-0 lg:-translate-y-1/2"
              style={{ top: `${(i / LAST) * 100}%` }}
            >
              <a
                ref={(el) => {
                  links.current[i] = el;
                }}
                href={`#${c.id}`}
                onClick={jump(i)}
                className="group flex min-h-11 items-center gap-3 py-1 lg:min-h-9 lg:justify-end lg:gap-2"
              >
                <span className="w-8 font-display text-[1.05rem] lg:hidden">{c.numeral}</span>
                <span className="flex-1 lg:hidden">{c.title}</span>
                <span className="tick-label typed text-[0.8rem]">{c.mark}</span>
                <span aria-hidden className="hidden h-px w-3.5 bg-current transition-all group-hover:w-5 lg:block" />
                <span className="sr-only hidden lg:block">, {c.title}</span>
              </a>
            </li>
          ))}
        </ol>
        <span
          ref={marker}
          aria-hidden
          className="pointer-events-none absolute right-0 hidden lg:block"
          style={{ top: "calc(var(--y, 0) * 100%)", translate: "0 -50%" }}
        >
          <svg viewBox="0 0 30 30" className="h-[15px] w-[15px]" fill="none" stroke="currentColor">
            <circle cx="15" cy="15" r="14" fill="var(--title-halo)" strokeWidth="1.6" />
            <g ref={rings}>
              {Array.from({ length: RINGS }, (_, i) => (
                <circle key={i} cx={15 + (i % 2) * 0.4} cy="15" r={2 + i * 1.7} strokeWidth="0.9" opacity={i === 0 ? 1 : 0} />
              ))}
            </g>
          </svg>
        </span>
      </div>
    </nav>
  );
}

function RingIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor">
      {[3, 6, 8.5, 10.5].map((r) => (
        <circle key={r} cx="12" cy="12" r={r} strokeWidth="1.1" />
      ))}
    </svg>
  );
}
