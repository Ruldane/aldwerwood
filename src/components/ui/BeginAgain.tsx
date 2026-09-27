"use client";

import { clock } from "@/lib/timeline/clock";

/** The one call to action: rewind the wood to its first dawn. */
export function BeginAgain() {
  return (
    <a
      href="#top"
      onClick={(ev) => {
        ev.preventDefault();
        window.scrollTo({ top: 0, behavior: clock.reducedMotion ? "auto" : "smooth" });
        document.getElementById("top")?.focus({ preventScroll: true });
      }}
      className="inline-flex min-h-12 items-center gap-3 border border-bone/70 px-5 py-2 font-display text-[1.2rem] text-bone transition-colors duration-300 hover:bg-bone hover:text-night active:translate-y-px"
    >
      {/* A small engraved ray of the rising sun, not a glyph. */}
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M3 17h18" />
        <path d="M7 17a5 5 0 0 1 10 0" />
        <path d="M12 9V5M7.2 11.2 5 9M16.8 11.2 19 9M4.5 14H2.5M21.5 14h-2" />
      </svg>
      Begin again at first light
    </a>
  );
}
