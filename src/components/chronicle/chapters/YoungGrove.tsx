import { CHAPTERS, ENTRIES, KEEPERS } from "@/content/chronicle";
import { Chapter } from "../Chapter";
import { BirchSketch } from "../illustrations";
import { ChapterHeading, HandLines, KeeperLine, reveal } from "../primitives";

const meta = CHAPTERS[1];
const e = ENTRIES.grove;

/** II. 1906. A giant year set like a chapter numeral, a narrow column of hand. */
export function YoungGrove() {
  return (
    <Chapter index={1} meta={meta} length={230}>
      <div {...reveal(-0.3, 0.9, 0.15)} aria-hidden className="pointer-events-none absolute -left-[2vw] top-[30svh] select-none sm:top-[4svh] lg:top-[-5svh]">
        <p className="font-display text-[42vw] leading-none text-[var(--title-ink)] opacity-[0.09] sm:text-[30vw] lg:text-[25vw]">
          1906
        </p>
      </div>

      <div
        data-reveal=""
        className="absolute left-4 right-4 top-[7svh] [--in:-0.3] [--out:0.3] sm:left-[8vw] sm:right-auto lg:top-[12svh] lg:[--out:0.62]"
      >
        <ChapterHeading meta={meta} />
      </div>

      <div
        data-reveal=""
        className="on-scene absolute left-4 right-4 top-[8svh] [--hs:0.18] [--in:0.27] lg:[--hs:0] sm:left-auto sm:right-[9vw] sm:w-[min(27rem,40vw)] lg:top-[14svh] lg:[--in:0.1]"
      >
        <p className="text-[0.95rem] italic">{e.date}</p>
        <p className="mt-2 text-[1.15rem] sm:text-[1.5rem]">
          <HandLines lines={e.lines} start={0.14} step={0.03} />
        </p>
        <p className="mt-4 text-[1.08rem] leading-snug sm:text-[1.15rem]">{e.coda}</p>
        <KeeperLine keeper={KEEPERS.edmund} className="mt-3 !text-current" />
        <p className="hand mt-6 max-w-[20rem] -rotate-2 text-[1.08rem] leading-snug lg:hidden">
          {e.margin}
        </p>
      </div>

      <figure {...reveal(0.28)} className="absolute right-[10vw] top-[56svh] hidden w-[15rem] text-ink lg:block">
        <BirchSketch start={0.3} className="w-full" />
        <figcaption className="hand -mt-2 ml-6 text-[1.05rem] text-pencil">Betula pendula, catkins</figcaption>
      </figure>

      <p
        {...reveal(0.4)}
        className="on-scene hand absolute left-[48vw] top-[74svh] hidden w-[17rem] -rotate-3 text-[1.12rem] leading-snug lg:block"
      >
        {e.margin}
      </p>
    </Chapter>
  );
}
