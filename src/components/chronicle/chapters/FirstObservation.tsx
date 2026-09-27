import { CHAPTERS, ENTRIES, KEEPERS } from "@/content/chronicle";
import { formatChain, STATIONS } from "@/content/survey";
import { Chapter } from "../Chapter";
import { ArchiveStamp, TraverseMap } from "../illustrations";
import { ChapterHeading, HandLines, KeeperLine, Leaf, reveal } from "../primitives";

const meta = CHAPTERS[0];
const e = ENTRIES.first;
const frontispiece = reveal(-1, 0.2, 0.1);

/**
 * I. 1887. The title page. Its double rule sits exactly on the horizon of
 * the drawn wood and, on first load, runs out to become it.
 */
export function FirstObservation() {
  return (
    <Chapter index={0} meta={meta} length={300}>
      {/* Frontispiece */}
      <div
        data-reveal=""
        className="absolute left-4 right-4 sm:left-[8vw] sm:right-auto sm:w-[min(48rem,62vw)]"
        style={{ ...frontispiece.style, bottom: "calc(100svh - var(--horizon) * 100lvh - 6px)" }}
      >
        <div className="on-scene">
          <h1
            className="intro-ink font-display text-[3.2rem] leading-[0.94] tracking-[-0.015em] text-balance sm:text-[4.8rem] lg:text-[clamp(4.8rem,6.6vw,6rem)]"
            style={{ animationDelay: "0.25s" }}
          >
            The Chronicle of Alderwood
          </h1>
          <p
            className="intro-ink mt-4 max-w-[34rem] text-[1.12rem] italic leading-snug sm:text-[1.3rem]"
            style={{ animationDelay: "0.5s" }}
          >
            A field journal kept by four keepers upon one wood, from its first saplings in 1887 until tonight.
          </p>
        </div>
        <div aria-hidden className="intro-rule mt-6 h-[6px] border-y-[1.4px] border-[var(--title-ink)]" />
      </div>

      <div {...reveal(-1, 0.2, 0.1)} className="absolute right-5 top-16 w-24 sm:right-[14vw] sm:top-[10svh] sm:w-36 lg:w-40">
        <ArchiveStamp className="intro-stamp stamp w-full" />
      </div>

      {/* Chapter plate */}
      <div
        data-reveal=""
        className="absolute left-4 right-4 top-[7svh] [--in:0.24] [--out:0.37] sm:left-[8vw] sm:right-auto lg:top-[10svh] lg:[--out:0.66]"
      >
        <ChapterHeading meta={meta} />
      </div>

      {/* Edmund's first entry */}
      <div
        data-reveal=""
        className="absolute left-4 right-4 top-[8svh] [--in:0.38] [--out:0.53] sm:left-auto sm:right-[8vw] sm:w-[min(31rem,44vw)] lg:top-[12svh] lg:[--in:0.3]"
      >
        <Leaf tilt={1.2} className="px-6 pb-6 pt-7 sm:px-8 sm:pt-9">
          <p className="text-[0.95rem] italic text-ink-soft">{e.date}</p>
          <p className="mt-2 text-[1.1rem] sm:text-[1.45rem]">
            <HandLines lines={e.lines} start={0.4} step={0.022} />
          </p>
          <p className="mt-4 text-[1.05rem] leading-snug sm:text-[1.12rem]">{e.coda}</p>
          <KeeperLine keeper={KEEPERS.edmund} className="mt-4" />
        </Leaf>
      </div>

      {/* The field book: six stations, the ground he wanted found again */}
      <div
        {...reveal(0.56)}
        className="absolute left-4 right-4 top-[8svh] sm:left-auto sm:right-[8vw] sm:w-[min(34rem,46vw)] lg:top-[11svh]"
      >
        <Leaf tilt={-0.8} ruled className="px-5 pb-5 pt-7 sm:px-7">
          <div className="grid gap-4 sm:grid-cols-[1fr_11rem] sm:gap-5">
            <table className="w-full border-collapse text-left text-[0.98rem] leading-tight">
              <caption className="mb-2 text-left font-display text-[1.35rem]">
                Field book. Stations set out, April 1887
              </caption>
              <thead>
                <tr className="small-caps text-[0.85rem] text-ink-soft">
                  <th scope="col" className="pb-1 pr-3 font-normal">Stn.</th>
                  <th scope="col" className="pb-1 pr-3 font-normal">Chain</th>
                  <th scope="col" className="pb-1 font-normal">Bearing</th>
                </tr>
              </thead>
              <tbody>
                {STATIONS.map((s) => (
                  <tr key={s.id}>
                    <th scope="row" className="py-[0.2rem] pr-3 font-display text-[1.1rem] font-normal">
                      {s.id}
                    </th>
                    <td className="py-[0.2rem] pr-3 tabular-nums">{formatChain(s)}</td>
                    <td className="py-[0.2rem] italic">{s.bearing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <figure className="hidden sm:block">
              <TraverseMap start={0.58} className="w-full text-ink" />
              <figcaption className="hand mt-1 text-[1rem] leading-tight text-pencil">
                so that whoever comes after may find the same ground
              </figcaption>
            </figure>
          </div>
        </Leaf>
      </div>
    </Chapter>
  );
}
