import { CHAPTERS, ENTRIES, KEEPERS } from "@/content/chronicle";
import { Chapter } from "../Chapter";
import { OakSpecimen } from "../illustrations";
import { ChapterHeading, HandLines, KeeperLine, Leaf } from "../primitives";

const meta = CHAPTERS[2];
const e = ENTRIES.canopy;

/**
 * III. 1924. A herbarium sheet. The pressed oak leaf slowly regains its
 * green as the chapter is read, and all at once under the reader's hand.
 */
export function CanopyCloses() {
  return (
    <Chapter index={2} meta={meta} length={240}>
      <div
        data-reveal=""
        className="absolute left-4 right-4 top-[7svh] [--in:-0.3] [--out:0.28] sm:left-[8vw] sm:right-auto lg:left-auto lg:right-[8vw] lg:top-[9svh] lg:[--out:0.62]"
      >
        <ChapterHeading meta={meta} align="right" className="max-lg:text-left max-lg:[&>div]:justify-start" />
      </div>

      <div
        data-reveal=""
        className="absolute left-4 right-4 top-[8svh] [--hs:0.16] [--in:0.25] sm:left-auto sm:right-[6vw] sm:w-[min(36rem,64vw)] lg:top-[37svh] lg:w-[min(36rem,40vw)] lg:[--hs:0] lg:[--in:0.12]"
      >
        <Leaf tilt={-1.4} className="px-5 pb-5 pt-7 sm:px-7">
          <div className="grid grid-cols-[6.5rem_1fr] gap-4 sm:grid-cols-[7.5rem_1fr] sm:gap-5 lg:grid-cols-[9.5rem_1fr] lg:gap-6">
            <div
              className="specimen relative cursor-help"
              tabIndex={0}
              role="img"
              aria-label="Pressed oak leaf, collected at Station C in June 1924. Its colour returns as you read."
            >
              <OakSpecimen className="w-full drop-shadow-[0_2px_2px_rgba(60,50,20,0.25)]" />
              <span aria-hidden className="absolute left-1/2 top-[58%] h-3 w-7 -translate-x-1/2 rotate-6 bg-[rgb(222_210_170/0.8)]" />
            </div>
            <div>
              <p className="text-[0.92rem] italic text-ink-soft">{e.date}</p>
              <p className="mt-1 text-[1.02rem] sm:text-[1.3rem]">
                <HandLines lines={e.lines} start={0.18} step={0.028} />
              </p>
              <KeeperLine keeper={KEEPERS.margery} className="mt-3" />
            </div>
          </div>
          <dl className="typed mt-4 grid grid-cols-[auto_1fr] gap-x-3 border border-ink/50 px-3 py-2 text-[0.8rem] leading-snug sm:ml-[9rem] sm:text-[0.84rem] lg:ml-[11.5rem]">
            <dt className="text-ink-soft">No.</dt>
            <dd>ALD 1924.017</dd>
            <dt className="text-ink-soft">Taxon</dt>
            <dd>
              <i>Quercus robur</i> L., pedunculate oak
            </dd>
            <dt className="text-ink-soft">Locality</dt>
            <dd>Alderwood, Station C</dd>
          </dl>
          <p className="hand mt-3 text-right text-[1.05rem] text-pencil">{e.pencil}</p>
        </Leaf>
      </div>
    </Chapter>
  );
}
