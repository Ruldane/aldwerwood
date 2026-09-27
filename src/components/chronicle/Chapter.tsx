import type { ReactNode } from "react";
import type { ChapterMeta } from "@/content/chronicle";
import { SceneNote } from "./primitives";

/**
 * One chapter of the chronicle. The section's top is a timeline anchor
 * (data-chapter). Its stage is sticky for the chapter's run, so a
 * composition holds on screen while the wood behind it lives through the
 * years; then it scrolls away naturally. No scroll is ever hijacked.
 */
export function Chapter({
  index,
  meta,
  length,
  children,
  after,
}: {
  index: number;
  meta: ChapterMeta;
  /** Scroll length of the chapter in small-viewport heights. */
  length: number;
  children: ReactNode;
  after?: ReactNode;
}) {
  return (
    <section
      id={meta.id}
      data-chapter={index}
      aria-labelledby={`${meta.id}-title`}
      tabIndex={-1}
      className="relative z-[2] outline-none"
    >
      <div style={{ height: `${length}svh` }}>
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          <SceneNote text={meta.scene} />
          {children}
        </div>
      </div>
      {after}
    </section>
  );
}
