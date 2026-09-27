import { CHAPTERS, ENTRIES, KEEPERS } from "@/content/chronicle";
import { Chapter } from "../Chapter";
import { ChapterHeading, HandLines, reveal } from "../primitives";
import { BeginAgain } from "@/components/ui/BeginAgain";

const meta = CHAPTERS[6];
const e = ENTRIES.archive;

/**
 * VII. Present day, night. Edmund's traverse rises as a constellation in
 * the sky (drawn by the scene), and the reader is told what they have done.
 */
export function LivingArchive() {
  return (
    <Chapter index={6} meta={meta} length={300} after={<Colophon />}>
      <div
        data-reveal=""
        className="absolute left-4 right-4 top-[7svh] [--in:-0.3] [--out:0.2] sm:left-[8vw] sm:right-auto lg:top-[10svh] lg:[--out:0.36]"
      >
        <ChapterHeading meta={meta} />
      </div>

      <p
        data-reveal=""
        className="on-scene absolute left-4 right-4 top-[62svh] [--hs:0.02] [--in:0.14] [--out:0.4] text-[1.25rem] sm:left-auto sm:right-[10vw] sm:w-[24rem] lg:top-[64svh] lg:text-[1.4rem] lg:[--hs:0]"
      >
        <HandLines lines={[e.glow]} start={0.16} step={0.06} />
      </p>

      <p
        data-reveal=""
        className="on-scene absolute left-4 right-4 top-[34svh] text-[1.15rem] italic leading-snug [--in:0.44] [--out:0.58] sm:left-auto sm:right-[8vw] sm:w-[22rem] lg:top-[16svh] lg:text-[1.3rem] lg:[--out:3]"
      >
        {e.stars}
      </p>

      <div
        {...reveal(0.6)}
        className="on-scene absolute left-4 right-4 top-[42svh] sm:left-[8vw] sm:right-auto sm:w-[min(46rem,70vw)] lg:top-[54svh]"
      >
        <p className="font-display text-[2.3rem] leading-[1.05] sm:text-[3.2rem] lg:text-[clamp(3.2rem,4.6vw,4.8rem)]">
          {e.closing}
        </p>
        <p className="mt-5 max-w-[30rem] text-[1.15rem] italic sm:text-[1.3rem]">{e.after}</p>
      </div>
    </Chapter>
  );
}

function Colophon() {
  return (
    <footer className="relative z-[2] px-4 pb-16 pt-[18svh] text-bone sm:px-[8vw]">
      <div className="grid max-w-[64rem] gap-10 border-t border-bone/35 pt-8 sm:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="font-display text-[1.9rem] leading-tight">Colophon</h2>
          <p className="mt-3 max-w-[34rem] text-[1.05rem] leading-relaxed text-bone/90">
            The Chronicle of Alderwood is a work of fiction. The wood, its keepers and their notebooks are imagined, and
            no real place or person is described.
          </p>
          <p className="mt-3 max-w-[34rem] text-[1.05rem] leading-relaxed text-bone/90">
            The wood is drawn live in your browser from a single timeline. Every tree has the year it germinated,
            every storm its hour, and scrolling back returns them all to seed.
          </p>
          <div className="mt-8">
            <BeginAgain />
          </div>
        </div>
        <dl className="grid content-start gap-x-6 gap-y-2 text-[1rem] text-bone/85 sm:grid-cols-[auto_1fr]">
          <dt className="small-caps">Keepers</dt>
          <dd>
            {[KEEPERS.edmund, KEEPERS.margery, KEEPERS.tobias].map((k) => (
              <span key={k.name} className="block">
                {k.name}, {k.years}
              </span>
            ))}
          </dd>
          <dt className="small-caps mt-3 sm:mt-0">Type</dt>
          <dd>IM Fell English, EB Garamond, Cedarville Cursive and Special Elite</dd>
          <dt className="small-caps mt-3 sm:mt-0">Drawn with</dt>
          <dd>Canvas, SVG and one scroll</dd>
        </dl>
      </div>
    </footer>
  );
}
