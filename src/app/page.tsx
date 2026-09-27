import { CanopyCloses } from "@/components/chronicle/chapters/CanopyCloses";
import { FirstObservation } from "@/components/chronicle/chapters/FirstObservation";
import { GreatStorm } from "@/components/chronicle/chapters/GreatStorm";
import { LivingArchive } from "@/components/chronicle/chapters/LivingArchive";
import { ReturnOfTheOwls } from "@/components/chronicle/chapters/ReturnOfTheOwls";
import { YearsOfSilence } from "@/components/chronicle/chapters/YearsOfSilence";
import { YoungGrove } from "@/components/chronicle/chapters/YoungGrove";
import { LivingScene } from "@/components/scene/LivingScene";
import { YearRule } from "@/components/ui/YearRule";

export default function Home() {
  return (
    <>
      <a
        href="#top"
        className="sr-only-focusable fixed left-3 top-3 z-[4] bg-paper px-4 py-2 font-display text-[1.1rem] text-ink shadow-md"
      >
        Skip to the chronicle
      </a>
      <LivingScene />
      <div aria-hidden className="paper-veil" />
      <YearRule />
      <main id="top" tabIndex={-1} className="relative outline-none">
        <article aria-label="The Chronicle of Alderwood">
          <FirstObservation />
          <YoungGrove />
          <CanopyCloses />
          <YearsOfSilence />
          <GreatStorm />
          <ReturnOfTheOwls />
          <LivingArchive />
        </article>
      </main>
    </>
  );
}
