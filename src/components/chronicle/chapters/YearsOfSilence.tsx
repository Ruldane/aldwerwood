import { CHAPTERS, ENTRIES, KEEPERS } from "@/content/chronicle";
import { Chapter } from "../Chapter";
import { ChapterHeading, HandLines, KeeperLine, Leaf, reveal, vars } from "../primitives";

const meta = CHAPTERS[3];
const e = ENTRIES.silence;

/**
 * IV. 1947. Nobody came. The notebook keeps its dated lines empty while the
 * wood grows on in fog, and every pencil mark on the scene fades away.
 */
export function YearsOfSilence() {
  return (
    <Chapter index={3} meta={meta} length={260}>
      <div
        data-reveal=""
        className="absolute left-4 right-4 top-[7svh] [--in:-0.3] [--out:0.1] sm:left-[8vw] sm:right-auto lg:top-[11svh] lg:[--out:0.6]"
      >
        <ChapterHeading meta={meta} />
      </div>

      <div
        data-reveal=""
        className="absolute left-4 right-4 top-[7svh] [--in:0.1] sm:left-auto sm:right-[10vw] sm:w-[25rem] lg:top-[12svh] lg:[--in:0.04]"
      >
        <Leaf tilt={0.6} ruled tape={false} className="px-6 pb-6 pt-5 sm:px-8">
          <p className="sr-only">No entries were made from 1939 to 1946.</p>
          <ol aria-hidden className="grid grid-cols-4 gap-x-3 leading-[1.9rem] sm:grid-cols-1 sm:gap-x-0">
            {e.blankYears.map((y, i) => (
              <li
                key={y}
                data-reveal=""
                className="flex items-baseline gap-4 text-[0.95rem] italic text-ink-soft/80"
                style={vars({ "--in": 0.12 + i * 0.055, "--fade": 0.04 })}
              >
                <span className="w-10 tabular-nums">{y}</span>
                <span className="hidden h-px flex-1 sm:block" />
              </li>
            ))}
          </ol>
          <div {...reveal(0.54, 3, 0.04)} className="mt-3">
            <p className="text-[0.92rem] italic text-ink-soft">{e.date}</p>
            <p className="mt-1 text-[1.12rem] sm:text-[1.3rem]">
              <HandLines lines={e.lines} start={0.56} step={0.012} />
            </p>
            <KeeperLine keeper={KEEPERS.margery} className="mt-3" />
          </div>
        </Leaf>
      </div>
    </Chapter>
  );
}
