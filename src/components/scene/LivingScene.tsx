"use client";

import { useEffect, useRef } from "react";
import { SceneRenderer } from "@/lib/scene/renderer";
import { clock } from "@/lib/timeline/clock";
import { bindTimelineToDom } from "@/lib/timeline/dom";

/**
 * The living wood behind the whole chronicle. Two fixed canvases; one
 * renderer; one clock. Decorative (aria-hidden): every scene has a text
 * description inside its chapter.
 */
export function LivingScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLCanvasElement>(null);
  const landRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = wrap.current;
    const sky = skyRef.current;
    const land = landRef.current;
    if (!el || !sky || !land) return;

    const renderer = new SceneRenderer(sky, land);
    const size = () => renderer.resize(el.clientWidth, el.clientHeight);
    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);

    clock.start();
    const unbindDom = bindTimelineToDom();
    renderer.startIntro(clock.reducedMotion || window.scrollY > 40);
    const unsub = clock.subscribe((f) => renderer.render(f));

    // Pointer: parallax for fine pointers, bracken and the owl answer any pointer.
    const onMove = (e: PointerEvent) => {
      renderer.pointer.x = e.clientX;
      renderer.pointer.y = e.clientY;
      renderer.pointer.active = true;
      renderer.pointer.fine = e.pointerType === "mouse" || e.pointerType === "pen";
    };
    const onLeave = () => {
      renderer.pointer.active = false;
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") renderer.pointer.active = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onLeave, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    // The keepers' handwriting in canvas needs the web font resolved first.
    const family = getComputedStyle(document.documentElement).getPropertyValue("--font-cedarville").trim();
    if (family && document.fonts) {
      document.fonts
        .load(`16px ${family}`)
        .then(() => renderer.setHandFont(family))
        .catch(() => renderer.setHandFont(family));
    }

    return () => {
      unsub();
      unbindDom();
      clock.stop();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onLeave);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={wrap} aria-hidden className="pointer-events-none fixed inset-0 z-0 h-[100lvh]">
      <canvas ref={skyRef} className="absolute inset-0 h-full w-full" />
      <canvas ref={landRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
