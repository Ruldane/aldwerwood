import type { CSSProperties, ReactNode } from "react";
import type { ChapterMeta, Keeper } from "@/content/chronicle";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/**
 * Scroll-time reveal. `inn`/`out` are chapter-local progress values (see
 * globals.css): the element fades up at `inn` and away at `out`.
 */
export function reveal(inn: number, out = 3, fade = 0.08, extra?: Vars) {
  return {
    "data-reveal": "",
    style: { "--in": inn, "--out": out, "--fade": fade, ...extra } as Vars,
  };
}

export function vars(v: Record<`--${string}`, string | number>) {
  return v as Vars;
}

/**
 * Lines of a keeper's handwriting, written one after another. A parent may
 * set --hs to delay the whole passage (used where mobile reveals later).
 */
export function HandLines({
  lines,
  start,
  step = 0.045,
  className = "",
}: {
  lines: readonly string[];
  start: number;
  step?: number;
  className?: string;
}) {
  return (
    <span className={`hand block ${className}`}>
      {lines.map((line, i) => (
        <span
          key={line}
          data-write=""
          className="block w-fit"
          style={vars({ "--s": `calc(var(--hs, 0) + ${(start + i * step).toFixed(3)})`, "--d": step * 0.95 })}
        >
          {line}
        </span>
      ))}
    </span>
  );
}

export function Leaf({
  children,
  className = "",
  tilt = 0,
  ruled = false,
  tape = true,
}: {
  children: ReactNode;
  className?: string;
  tilt?: number;
  ruled?: boolean;
  tape?: boolean;
}) {
  return (
    <div className={`leaf ${ruled ? "leaf--ruled" : ""} ${className}`} style={{ rotate: `${tilt}deg` }}>
      {tape && (
        <>
          <span aria-hidden className="tape -top-2.5 left-6 -rotate-3" />
          <span aria-hidden className="tape -top-2 right-8 rotate-2" />
        </>
      )}
      {children}
    </div>
  );
}

export function KeeperLine({ keeper, className = "" }: { keeper: Keeper; className?: string }) {
  return (
    <p className={`small-caps text-[0.95rem] text-ink-soft ${className}`}>
      {keeper.name}
      {keeper.role ? <span className="italic normal-case tracking-normal">, {keeper.role}</span> : null}
    </p>
  );
}

/**
 * Chapter opening: roman numeral and year set like a book's chapter plate,
 * with the title in Fell. Type sits directly on the living scene.
 */
export function ChapterHeading({
  meta,
  className = "",
  titleClassName = "",
  align = "left",
}: {
  meta: ChapterMeta;
  className?: string;
  titleClassName?: string;
  align?: "left" | "right";
}) {
  const right = align === "right";
  return (
    <header className={`on-scene ${right ? "text-right" : ""} ${className}`}>
      <div aria-hidden className={`flex items-baseline gap-4 ${right ? "justify-end" : ""}`}>
        <span className="font-display text-[2.1rem] leading-none lg:text-[2.6rem]">{meta.numeral}</span>
        <span className="h-px w-12 translate-y-[-0.4rem] bg-current opacity-60" />
        <span className="font-book text-[1.35rem] italic lg:text-[1.6rem]">{meta.year}</span>
      </div>
      <h2
        id={`${meta.id}-title`}
        className={`mt-1 pb-2 font-display text-[2.7rem] leading-[1.02] tracking-[-0.01em] sm:text-[3.4rem] lg:text-[clamp(3.6rem,5.4vw,6rem)] text-balance ${titleClassName}`}
      >
        <span className="sr-only">
          Chapter {meta.numeral}, {meta.year}.{" "}
        </span>
        {meta.title}
      </h2>
    </header>
  );
}

/** Plain-language description of the drawn scene, for screen readers. */
export function SceneNote({ text }: { text: string }) {
  return <p className="sr-only">In the drawing: {text}</p>;
}
