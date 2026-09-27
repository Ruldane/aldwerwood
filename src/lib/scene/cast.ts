import { rng } from "../math";
import { Tree, type TreeSpec } from "./trees";

/**
 * The census of Alderwood: every tree, with the year it germinated.
 *
 * Composition follows the engraved landscapes the journal imitates: great
 * oaks frame the edges (coulisses) and, as they mature, arch inward to close
 * the canopy; a glade runs along the brook with the Station A alder as its
 * specimen tree; a wall of wood rises along the horizon. When the alder
 * falls in 1968 it opens a window in the canopy, and that is where the
 * night sky is seen at the end.
 *
 * Succession follows real woodland ecology: alders pioneer the wet ground by
 * the brook, birch seeds onto the dry side, slow oaks come up beneath them,
 * and after the storm ash and birch race into the gap.
 */

export const HERO_X = 0.33;
export const HERO_DEPTH = 0.3;
export const STREAM_DEPTH = 0.56;
export const FENCE_DEPTH = 0.44;
/** The glade stays open between these x positions (fraction of width). */
export const GLADE: readonly [number, number] = [0.22, 0.66];

export interface Cast {
  hero: Tree;
  trees: Tree[];
}

const inGlade = (x: number) => x > GLADE[0] && x < GLADE[1];

export function buildCast(aspect: number, quality: 0 | 1 | 2, mobile: boolean): Cast {
  const R = rng(1887);
  const specs: TreeSpec[] = [];
  const wide = Math.max(0.75, Math.min(2.2, aspect / 1.6));
  const q = quality === 2 ? 1 : quality === 1 ? 0.75 : 0.55;

  specs.push({
    species: "alder",
    x: mobile ? 0.36 : HERO_X,
    depth: HERO_DEPTH,
    born: 1882,
    mature: 72,
    height: mobile ? 0.8 : 0.9,
    seed: 11,
    hero: true,
  });

  // Coulisse oaks at both edges: they tower, and their crowns lean inward.
  const edges = mobile ? [-0.12, 1.1] : [-0.1, 0.07, 0.93, 1.1];
  edges.forEach((x, i) => {
    specs.push({
      species: "oak",
      x,
      depth: 0.08 + (i % 2) * 0.1,
      born: 1888 + i * 3,
      mature: 120,
      height: (i === 0 || i === edges.length - 1 ? 0.74 : 0.6) + R() * 0.06,
      seed: 300 + i,
      lean: x < 0.5 ? 0.22 : -0.22,
    });
  });

  // Alders along the brook, thinned inside the glade.
  const brook = Math.round((mobile ? 5 : 8) * wide * q);
  for (let i = 0; i < brook; i++) {
    const x = -0.05 + ((i + R() * 0.7) / brook) * 1.1;
    const glade = inGlade(x);
    if (glade && R() < 0.55) continue;
    specs.push({
      species: "alder",
      x,
      depth: 0.5 + R() * 0.12,
      born: 1881 + Math.floor(R() * 9),
      mature: 60,
      height: glade ? 0.34 + R() * 0.08 : 0.42 + R() * 0.12,
      seed: 100 + i,
      detail: 1,
    });
  }

  // Birch on the dry, eastern side.
  const birches = Math.round((mobile ? 2 : 4) * wide * q);
  for (let i = 0; i < birches; i++) {
    specs.push({
      species: "birch",
      x: 0.66 + ((i + R()) / birches) * 0.3,
      depth: 0.24 + R() * 0.3,
      born: 1893 + Math.floor(R() * 12),
      mature: 45,
      height: 0.44 + R() * 0.12,
      seed: 200 + i,
      detail: R() < 0.5 ? 1 : 0,
    });
  }

  // Oaks coming up among the alders (the ones Edmund never wrote down).
  const understorey = Math.round((mobile ? 2 : 3) * wide * q);
  for (let i = 0; i < understorey; i++) {
    let x = 0.05 + ((i + R()) / understorey) * 0.9;
    if (inGlade(x)) x = x < 0.44 ? GLADE[0] - 0.04 : GLADE[1] + 0.04;
    specs.push({
      species: "oak",
      x,
      depth: 0.36 + R() * 0.14,
      born: 1892 + Math.floor(R() * 10),
      mature: 120,
      height: 0.44 + R() * 0.1,
      seed: 320 + i,
      detail: 1,
    });
  }

  // The wall of wood along the horizon.
  const back = Math.round((mobile ? 7 : 14) * wide * q);
  for (let i = 0; i < back; i++) {
    const r = R();
    specs.push({
      species: r < 0.45 ? "alder" : r < 0.75 ? "oak" : "birch",
      x: -0.05 + ((i + R()) / back) * 1.1,
      depth: 0.7 + R() * 0.18,
      born: 1882 + Math.floor(R() * 28),
      mature: 75,
      height: 0.4 + R() * 0.14,
      seed: 400 + i,
      detail: 2,
    });
  }

  // The storm gap: pioneers that seed in after 1968.
  const gap = mobile ? 2 : 3;
  for (let i = 0; i < gap; i++) {
    specs.push({
      species: "young",
      x: (mobile ? 0.36 : HERO_X) + 0.08 + i * 0.08 + R() * 0.02,
      depth: 0.32 + R() * 0.1,
      born: 1970 + i * 3,
      mature: 55,
      height: 0.36 + R() * 0.08,
      seed: 500 + i,
      detail: 1,
    });
  }

  const trees = specs.map((s) => new Tree(s)).sort((a, b) => b.spec.depth - a.spec.depth);
  return { hero: trees.find((t) => t.spec.hero)!, trees };
}
