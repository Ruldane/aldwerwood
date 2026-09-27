# The Chronicle of Alderwood

A naturalist's field journal kept by four generations on one wood, from its first saplings in 1887 to tonight. Scroll is time: every position on the page is one moment in the life of the place, and scrolling back returns the wood to seed.

The wood, the keepers and their notebooks are fiction.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run check      # lint, typecheck, production build, browser tests
```

Browser tests (`npm run test:e2e`) run against `next start` on port 3218, so run `npm run build` before them if you're not using `check`.

## How it works

One number drives everything: the **chapter coordinate** `c`, from 0 (top of the page) to 7 (bottom).

| Layer | File | Role |
|---|---|---|
| Clock | `src/lib/timeline/clock.ts` | One rAF loop reads `scrollY` (no scroll listeners) and maps it through each chapter section's anchor to `c`. It smooths `c` for the scene only, and turns smoothing off under reduced motion. |
| Timeline | `src/lib/timeline/tracks.ts` | Readable keyframe tracks over `c`: year, hour of the reader's single day, leafiness, fog, wind, rain, storm, flood, and event windows (the alder's fall, rooks, owl, glow-worms, constellation). |
| World | `src/lib/timeline/world.ts` | A pure `evaluateWorld(c)` that returns the full environmental state: sun and moon, sky colours, grade, shadows and so on. |
| DOM | `src/lib/timeline/dom.ts` | Writes `--p` (local chapter progress) onto each section plus a few root variables. All text choreography is plain CSS reading `--p` (`globals.css`). |
| Scene | `src/lib/scene/*` | Canvas 2D engraving on two layers. Trees are seeded skeletons whose segments have germination times, so branches really extend over the years. `cast.ts` is the census of every tree and its birth year. |

Chapters live in `src/components/chronicle/chapters/`, one layout family each. The content is in `src/content/`. The 1887 survey traverse in `survey.ts` is drawn in chapter I's field book and rises as the night-sky constellation in chapter VII.

## Accessibility and motion

- Every drawn scene has a text description inside its chapter. The canvases are `aria-hidden`.
- Under `prefers-reduced-motion`: no scroll smoothing, no dolly or parallax, no ambient animation (a still world makes no redraws), handwriting fades instead of wiping, and the alder crossfades from standing to fallen instead of toppling.
- Without JavaScript, every passage is visible in reading order.
