import { band, css, mix } from "../math";
import { BONE, PENCIL } from "../timeline/tracks";
import type { WorldState } from "../timeline/world";
import { STREAM_DEPTH } from "./cast";
import type { Tree } from "./trees";
import { type View, project } from "./view";

/**
 * Pencil marginalia drawn straight onto the living scene. They exist only
 * while a keeper is writing (world.observer), which is why they vanish in
 * the years of silence. The alder's label re-measures the tree as it grows.
 */
function label(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dxIn: number,
  dy: number,
  text: string,
  alpha: number,
  color: string,
) {
  if (alpha <= 0.02) return;
  let dx = dxIn;
  // Flip or nudge so the note never runs off the page or under the year rule.
  const width = ctx.measureText(text).width;
  const maxX = ctx.canvas.width / (ctx.getTransform().a || 1) - 120;
  if (dx >= 0 && x + dx + width > maxX) dx = -Math.abs(dx);
  if (dx < 0 && x + dx - width < 12) dx = Math.abs(dx);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 0.9;
  const tx = x + dx;
  const ty = y + dy;
  ctx.beginPath();
  ctx.moveTo(tx - Math.sign(dx) * 4, ty + 4);
  ctx.quadraticCurveTo(x + dx * 0.2, ty + 2, x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = dx >= 0 ? "left" : "right";
  ctx.fillText(text, tx, ty);
  ctx.textAlign = "left";
  ctx.globalAlpha = 1;
}

export function drawAnnotations(
  ctx: CanvasRenderingContext2D,
  v: View,
  w: WorldState,
  font: string,
  hero: Tree,
  trees: Tree[],
) {
  if (!font || w.observer <= 0.02) return;
  const color = css(mix(PENCIL, BONE, w.inverse));
  ctx.font = `${v.mobile ? 14 : 17}px ${font}`;
  const o = w.observer;
  const side = v.mobile ? 1 : 1;

  // The alder at Station A, measured by each keeper in turn.
  if (hero.alive && w.alderFall < 0.2) {
    const a = band(w.c, 0.15, 0.3, 4.36, 4.5) * o;
    label(ctx, hero.crownX, hero.crownY, 34 * side, -18, `Stn. A alder, ${hero.feet} ft`, a, color);
  }

  // Brook width, 1887.
  const brook = project(v, 0.62, STREAM_DEPTH);
  label(ctx, brook.x, brook.y, 30, 26, "brook, 4 ft across", band(w.c, 0.25, 0.4, 0.9, 1.1) * o, color);

  // First birch, 1906.
  const birch = trees.find((t) => t.spec.species === "birch" && t.alive && t.spec.depth < 0.45);
  if (birch) {
    label(ctx, birch.crownX, birch.crownY + birch.heightPx * 0.2, 36, -10, "birch, self-sown", band(w.c, 1.2, 1.38, 1.8, 1.98) * o, color);
  }

  // The oaks Edmund never noted, 1924.
  const oak = trees.find((t) => t.spec.species === "oak" && t.alive && t.spec.depth < 0.35);
  if (oak) {
    label(ctx, oak.crownX, oak.crownY + 8, -40, -6, "oak, coming through", band(w.c, 2.2, 2.38, 2.8, 2.98) * o, color);
  }

  // The storm's aftermath.
  if (w.alderFall >= 1) {
    label(ctx, hero.snagX, hero.snagY, -44, -30, "down, 6.10 pm", band(w.c, 4.66, 4.74, 4.95, 5.05) * o, color);
    label(ctx, hero.snagX, hero.snagY - 12, 44, -38, "hollow, owls nesting", band(w.c, 5.35, 5.5, 5.9, 6.02) * o, color);
  }
}
