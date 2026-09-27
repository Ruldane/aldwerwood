import { CHAPTERS, ENTRIES, KEEPERS } from "@/content/chronicle";
import { Chapter } from "../Chapter";
import { Sonogram } from "../illustrations";
import { ChapterHeading, HandLines, KeeperLine } from "../primitives";

const meta = CHAPTERS[5];
const e = ENTRIES.owls;

/**
 * VI. 1989. Blue dusk. The owls' duet, written down the way a 1980s
 * naturalist would: as a sonogram, drawn call by call.
 */
export function ReturnOfTheOwls() {
  return (
    <Chapter index={5} meta={meta} length={250}>
      <div
        data-reveal=""
        className="absolute left-4 right-4 top-[7svh] [--in:-0.3] [--out:0.12] sm:left-[8vw] sm:right-auto lg:top-[9svh] lg:[--out:0.62]"
      >
        <ChapterHeading meta={meta} />
      </div>

      <figure
        data-reveal=""
        className="on-scene absolute left-4 right-4 top-[7svh] [--in:0.12] sm:left-auto sm:right-[7vw] sm:w-[min(40rem,62vw)] lg:top-[27svh] lg:w-[min(40rem,42vw)] lg:[--in:0.08]"
      >
        <Sonogram start={0.14} className="w-full" />
        <figcaption className="typed mt-1 text-[0.8rem] tracking-wide">
          Strix aluco, tawny owl. Duet at the hollow alder, 14 November 1989
        </figcaption>
      </figure>

      <div
        data-reveal=""
        className="on-scene absolute left-4 right-4 top-[40svh] [--hs:0.1] [--in:0.3] sm:left-auto sm:right-[7vw] sm:top-[44svh] sm:w-[min(34rem,58vw)] lg:top-[56svh] lg:w-[min(30rem,36vw)] lg:[--hs:0] lg:[--in:0.26]"
      >
        <p className="text-[0.95rem] italic">{e.date}</p>
        <p className="mt-1 text-[1.05rem] sm:text-[1.3rem]">
          <HandLines lines={e.lines} start={0.28} step={0.04} />
        </p>
        <KeeperLine keeper={KEEPERS.tobias} className="mt-3 !text-current" />
        <p className="hand mt-5 max-w-[22rem] -rotate-2 text-[1.08rem]">{e.aside}</p>
      </div>
    </Chapter>
  );
}
