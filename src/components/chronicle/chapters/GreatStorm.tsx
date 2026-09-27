import { CHAPTERS, ENTRIES, KEEPERS } from "@/content/chronicle";
import { Chapter } from "../Chapter";
import { Barometer } from "../illustrations";
import { ChapterHeading, HandLines, KeeperLine, Leaf, vars } from "../primitives";

const meta = CHAPTERS[4];
const e = ENTRIES.storm;
/** Chapter-local moments each log line is written. The alder falls at 0.50 to 0.64. */
const WRITE_AT = [0.1, 0.27, 0.6];
/** On phones the log shows one entry at a time so the fall stays visible. */
const MOBILE_OUT = ["max-sm:[--out:0.26]", "max-sm:[--out:0.58]", ""];

/**
 * V. 1968. Tobias Wren's weather log. The needle falls as the reader
 * scrolls, his entries write themselves, and the diagonal hatching he
 * pencils in the margin becomes the rain driving across the wood.
 */
export function GreatStorm() {
  return (
    <Chapter index={4} meta={meta} length={340}>
      <div
        data-reveal=""
        className="absolute left-4 right-4 top-[7svh] [--in:-0.3] [--out:0.08] sm:left-[8vw] sm:right-auto lg:left-auto lg:right-[7vw] lg:top-[6svh] lg:[--out:0.95]"
      >
        <ChapterHeading
          meta={meta}
          align="right"
          className="max-lg:text-left max-lg:[&>div]:justify-start"
          titleClassName="italic lg:text-[clamp(4rem,6vw,6rem)]"
        />
      </div>

      <div
        data-reveal=""
        className="absolute left-4 right-4 top-[6svh] [--hs:0.02] [--in:0.08] sm:left-auto sm:right-[7vw] sm:w-[min(29rem,48vw)] lg:top-[33svh] lg:w-[min(29rem,32vw)] lg:[--hs:0] lg:[--in:0.04]"
      >
        <Leaf tilt={-1} ruled className="px-4 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-6">
          <div className="flex items-center gap-4">
            <Barometer className="w-20 shrink-0 text-ink sm:w-32" />
            <div>
              <p className="text-[0.92rem] italic text-ink-soft">{e.date}</p>
              <p className="font-display text-[1.3rem] leading-tight sm:text-[1.7rem]">Weather log, lower wood</p>
              <p className="typed mt-1 text-[0.8rem] text-ink-soft">
                Glass {e.pressureFrom} to {e.pressureTo} mb
              </p>
            </div>
          </div>

          <div className="relative mt-4">
          <ol className="grid gap-3 max-sm:grid-cols-1">
            {e.log.map((line, i) => (
              <li
                key={line.time}
                data-reveal=""
                className={`grid grid-cols-[4.1rem_1fr] gap-3 max-sm:col-start-1 max-sm:row-start-1 ${MOBILE_OUT[i]}`}
                style={vars({ "--in": WRITE_AT[i] - 0.01, "--fade": 0.03 })}
              >
                <span
                  data-reveal=""
                  className="typed pt-[0.3rem] text-[0.82rem]"
                  style={vars({ "--in": `calc(var(--hs, 0) + ${WRITE_AT[i]})`, "--fade": 0.03 })}
                >
                  {line.time}
                </span>
                <span className="text-[1rem] leading-snug sm:text-[1.2rem]">
                  <HandLines lines={[line.text]} start={WRITE_AT[i] + 0.02} step={0.07} />
                </span>
              </li>
            ))}
          </ol>
            {/* The pencilled rain sign, drawn just before the rain arrives. */}
            <svg
              aria-hidden
              viewBox="0 0 40 90"
              className="absolute -left-12 top-6 hidden w-8 text-pencil sm:block"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
            >
              {Array.from({ length: 7 }, (_, k) => (
                <line
                  key={k}
                  x1={30}
                  y1={6 + k * 11}
                  x2={10}
                  y2={20 + k * 11}
                  strokeWidth="1.3"
                  pathLength={1}
                  data-draw=""
                  style={vars({ "--s": 0.24 + k * 0.012, "--d": 0.02 })}
                />
              ))}
            </svg>
          </div>
          <KeeperLine keeper={KEEPERS.tobias} className="mt-3 sm:mt-4" />
        </Leaf>
      </div>
    </Chapter>
  );
}
