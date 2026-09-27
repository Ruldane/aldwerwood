/**
 * Edmund Ashcombe's 1887 traverse. Distances are in Gunter's chains and links
 * (1 chain = 100 links = 66 ft). The same computed shape is drawn in the
 * chapter I field book AND rises as a constellation in the final night sky.
 */

export interface Station {
  id: string;
  chains: number;
  links: number;
  /** Quadrant bearing, e.g. "N 64° E". */
  bearing: string;
  note: string;
}

export const STATIONS: Station[] = [
  { id: "A", chains: 0, links: 0, bearing: "origin", note: "alder seedling by the brook" },
  { id: "B", chains: 4, links: 20, bearing: "N 64° E", note: "felled oak stump" },
  { id: "C", chains: 3, links: 75, bearing: "N 18° E", note: "bramble thicket" },
  { id: "D", chains: 5, links: 5, bearing: "S 81° E", note: "old boundary bank" },
  { id: "E", chains: 2, links: 90, bearing: "S 22° E", note: "spring, wet ground" },
  { id: "F", chains: 4, links: 40, bearing: "S 70° W", note: "flat stone, marked" },
];

function bearingToRadians(b: string): number | null {
  const m = b.match(/([NS])\s*(\d+)°\s*([EW])/);
  if (!m) return null;
  const deg = parseInt(m[2], 10);
  // Azimuth clockwise from north.
  let az = deg;
  if (m[1] === "N" && m[3] === "W") az = 360 - deg;
  if (m[1] === "S" && m[3] === "E") az = 180 - deg;
  if (m[1] === "S" && m[3] === "W") az = 180 + deg;
  return (az * Math.PI) / 180;
}

/** Station positions normalised to a unit box (x east, y north-up flipped to screen-down). */
export const STATION_POINTS: { id: string; x: number; y: number }[] = (() => {
  let x = 0;
  let y = 0;
  const raw = STATIONS.map((s) => {
    const r = bearingToRadians(s.bearing);
    if (r !== null) {
      const d = s.chains + s.links / 100;
      x += Math.sin(r) * d;
      y -= Math.cos(r) * d; // screen y grows downward
    }
    return { id: s.id, x, y };
  });
  const xs = raw.map((p) => p.x);
  const ys = raw.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const span = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY);
  return raw.map((p) => ({ id: p.id, x: (p.x - minX) / span, y: (p.y - minY) / span }));
})();

export const formatChain = (s: Station) =>
  s.bearing === "origin" ? "0 ch. 00 lk." : `${s.chains} ch. ${String(s.links).padStart(2, "0")} lk.`;
