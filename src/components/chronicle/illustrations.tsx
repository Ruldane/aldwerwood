import { STATION_POINTS, STATIONS } from "@/content/survey";
import { vars } from "./primitives";

/* ------------------------------------------------------------------ */
/*  Archive stamp                                                     */
/* ------------------------------------------------------------------ */

export function ArchiveStamp({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden>
      <defs>
        <filter id="stamp-wear" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.55" result="m" />
          <feComposite in="SourceGraphic" in2="m" operator="in" />
        </filter>
        <path id="stamp-top" d="M 26 80 A 54 54 0 0 1 134 80" />
        <path id="stamp-bottom" d="M 30 86 A 50 50 0 0 0 130 86" />
      </defs>
      <g filter="url(#stamp-wear)" fill="currentColor" stroke="currentColor">
        <circle cx="80" cy="80" r="74" fill="none" strokeWidth="3" />
        <circle cx="80" cy="80" r="66" fill="none" strokeWidth="1.2" />
        <circle cx="80" cy="80" r="38" fill="none" strokeWidth="1.2" />
        <text fontFamily="var(--font-typed)" fontSize="13" letterSpacing="2.2" stroke="none">
          <textPath href="#stamp-top" startOffset="50%" textAnchor="middle">
            ALDERWOOD ARCHIVE
          </textPath>
        </text>
        <text fontFamily="var(--font-typed)" fontSize="10.5" letterSpacing="2" stroke="none">
          <textPath href="#stamp-bottom" startOffset="50%" textAnchor="middle">
            FIELD JOURNALS
          </textPath>
        </text>
        <text x="80" y="76" textAnchor="middle" fontFamily="var(--font-typed)" fontSize="11" stroke="none">
          ACC. NO.
        </text>
        <text x="80" y="94" textAnchor="middle" fontFamily="var(--font-typed)" fontSize="16" stroke="none">
          1887/1
        </text>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Edmund's traverse, 1887                                           */
/* ------------------------------------------------------------------ */

export function TraverseMap({ start = 0.5, className = "" }: { start?: number; className?: string }) {
  const pad = 22;
  const W = 240;
  const H = 180;
  const pts = STATION_POINTS.map((p) => ({ x: pad + p.x * (W - pad * 2), y: pad + p.y * (H - pad * 2) * 1.05 }));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden fill="none" stroke="currentColor">
      {pts.slice(1).map((p, i) => (
        <line
          key={`chain-${STATIONS[i + 1].id}`}
          x1={pts[i].x}
          y1={pts[i].y}
          x2={p.x}
          y2={p.y}
          pathLength={1}
          data-draw=""
          strokeWidth="1"
          strokeDasharray="1"
          style={vars({ "--s": start + i * 0.035, "--d": 0.035 })}
        />
      ))}
      {pts.map((p, i) => (
        <g key={STATIONS[i].id}>
          <path d={`M ${p.x} ${p.y - 5} L ${p.x + 4.5} ${p.y + 3} L ${p.x - 4.5} ${p.y + 3} Z`} strokeWidth="1" />
          <circle cx={p.x} cy={p.y} r="0.9" fill="currentColor" />
          <text
            x={p.x + 7}
            y={p.y - 5}
            fill="currentColor"
            stroke="none"
            fontFamily="var(--font-hand)"
            fontSize="13"
          >
            {STATIONS[i].id}
          </text>
        </g>
      ))}
      {/* Meridian */}
      <g transform={`translate(${W - 20} 34)`} strokeWidth="0.9">
        <line x1="0" y1="18" x2="0" y2="-14" />
        <path d="M -4 -8 L 0 -16 L 4 -8" />
        <text x="0" y="-19" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="var(--font-display)" fontSize="11">
          N
        </text>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Birch catkins, 1906                                               */
/* ------------------------------------------------------------------ */

export function BirchSketch({ start = 0.3, className = "" }: { start?: number; className?: string }) {
  const catkin = (x: number, y: number, n: number, sway: number) =>
    Array.from({ length: n }, (_, i) => {
      const t = i / n;
      return { cx: x + Math.sin(t * 2.2) * sway, cy: y + i * 6.2, rx: 3.4 - t * 1.1, ry: 3.6 };
    });
  const a = catkin(62, 44, 11, 6);
  const b = catkin(96, 38, 9, -5);
  return (
    <svg viewBox="0 0 180 150" className={className} aria-hidden fill="none" stroke="currentColor" strokeLinecap="round">
      <path
        d="M 6 30 C 40 26, 70 36, 104 30 S 150 20, 176 26"
        pathLength={1}
        data-draw=""
        strokeWidth="1.3"
        style={vars({ "--s": start, "--d": 0.08 })}
      />
      <path d="M 62 34 L 62 44 M 96 30 L 96 38" strokeWidth="1" />
      {[...a, ...b].map((e, i) => (
        <ellipse
          key={`cat-${i}`}
          cx={e.cx}
          cy={e.cy}
          rx={e.rx}
          ry={e.ry}
          strokeWidth="0.9"
          pathLength={1}
          data-draw=""
          style={vars({ "--s": start + 0.06 + i * 0.006, "--d": 0.03 })}
        />
      ))}
      {/* Leaf: triangular-ovate, doubly serrate. */}
      <path
        d="M 136 27 C 146 36, 160 52, 150 74 C 146 82, 138 86, 132 84 C 122 78, 120 58, 124 44 C 127 36, 131 30, 136 27 Z"
        pathLength={1}
        data-draw=""
        strokeWidth="1.1"
        style={vars({ "--s": start + 0.1, "--d": 0.08 })}
      />
      <path
        d="M 136 27 L 136 82 M 136 40 L 146 46 M 136 50 L 150 58 M 136 60 L 149 68 M 136 45 L 127 50 M 136 56 L 124 62 M 136 67 L 126 73"
        strokeWidth="0.7"
        opacity="0.8"
        pathLength={1}
        data-draw=""
        style={vars({ "--s": start + 0.16, "--d": 0.06 })}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Pressed oak leaf, 1924                                            */
/* ------------------------------------------------------------------ */

function catmull(points: [number, number][]) {
  let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

const OAK = (() => {
  const cx = 80;
  const base = 196;
  const L = 170;
  const N = 60;
  const right: [number, number][] = [];
  const left: [number, number][] = [];
  const veins: string[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const y = base - t * L;
    const env = Math.sin(Math.PI * Math.pow(t, 0.72)) * 44;
    const lobe = 0.52 + 0.48 * Math.pow(Math.abs(Math.cos(t * Math.PI * 4.6 + 0.3)), 0.7);
    const auricle = t < 0.07 ? 9 * (1 - t / 0.07) : 0;
    const w = env * lobe + auricle;
    right.push([cx + w + Math.sin(t * 9) * 1.2, y]);
    left.push([cx - w * 0.94 + Math.sin(t * 7) * 1.2, y - 1.5]);
  }
  for (let k = 0; k < 5; k++) {
    const t = (k + 0.1) / 4.6;
    if (t <= 0.05 || t >= 0.95) continue;
    const i = Math.round(t * N);
    const my = base - t * L;
    veins.push(`M ${cx} ${my + 6} Q ${cx + 10} ${my + 2}, ${right[i][0] - 4} ${right[i][1]}`);
    veins.push(`M ${cx} ${my + 8} Q ${cx - 10} ${my + 4}, ${left[i][0] + 4} ${left[i][1]}`);
  }
  const outline = catmull([[cx, base + 14], ...right, ...left.reverse(), [cx - 1, base + 2]]);
  return { outline, veins, cx, base };
})();

export function OakSpecimen({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 220" className={className} aria-hidden>
      <g className="specimen-leaf">
        <path d={OAK.outline} fill="currentColor" fillOpacity="0.55" stroke="#2b2a24" strokeWidth="1.1" />
        <path d={`M ${OAK.cx} ${OAK.base + 14} L ${OAK.cx} ${OAK.base - 166}`} stroke="#2b2a24" strokeWidth="1.1" fill="none" />
        {OAK.veins.map((d) => (
          <path key={d} d={d} stroke="#2b2a24" strokeWidth="0.7" fill="none" opacity="0.8" />
        ))}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Banjo barometer, 1968                                             */
/* ------------------------------------------------------------------ */

const angleFor = (mb: number) => -18 + (mb - 1004) * 2.07;

export function Barometer({ className = "" }: { className?: string }) {
  const ticks = [];
  for (let mb = 960; mb <= 1040; mb += 2) {
    const a = (angleFor(mb) * Math.PI) / 180;
    const major = mb % 10 === 0;
    const r0 = major ? 70 : 74;
    ticks.push(
      <line
        key={mb}
        x1={100 + Math.sin(a) * r0}
        y1={100 - Math.cos(a) * r0}
        x2={100 + Math.sin(a) * 79}
        y2={100 - Math.cos(a) * 79}
        strokeWidth={major ? 1.1 : 0.6}
      />,
    );
  }
  const words: [string, number][] = [
    ["Stormy", 972],
    ["Rain", 989],
    ["Change", 1005],
    ["Fair", 1021],
    ["Very Dry", 1036],
  ];
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden fill="none" stroke="currentColor">
      <circle cx="100" cy="100" r="92" strokeWidth="2" />
      <circle cx="100" cy="100" r="86" strokeWidth="0.7" />
      <circle cx="100" cy="100" r="80" strokeWidth="0.7" />
      {ticks}
      {words.map(([w, mb]) => {
        const a = (angleFor(mb) * Math.PI) / 180;
        return (
          <text
            key={w}
            x={100 + Math.sin(a) * 55}
            y={100 - Math.cos(a) * 55 + 4}
            textAnchor="middle"
            fill="currentColor"
            stroke="none"
            fontFamily="var(--font-display)"
            fontSize="11.5"
            fontStyle="italic"
          >
            {w}
          </text>
        );
      })}
      <text x="100" y="140" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="var(--font-typed)" fontSize="8" letterSpacing="1.5">
        MILLIBARS
      </text>
      {/* The brass set hand, left where the glass stood at noon. */}
      <g transform={`rotate(${angleFor(1004)} 100 100)`} stroke="#9a7a3c" strokeWidth="1.4">
        <line x1="100" y1="100" x2="100" y2="26" />
      </g>
      <g className="needle" strokeWidth="1.6" strokeLinecap="round">
        <line x1="100" y1="116" x2="100" y2="22" />
        <path d="M 96 30 L 100 20 L 104 30" fill="currentColor" />
        <circle cx="100" cy="100" r="5" fill="currentColor" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Tawny owl duet as a sonogram, 1989                                */
/* ------------------------------------------------------------------ */

const kHz = (f: number) => 132 - f * 42;
const sec = (s: number) => 42 + s * 172;

export function Sonogram({ start = 0.3, className = "" }: { start?: number; className?: string }) {
  const female = [
    `M ${sec(0.18)} ${kHz(1.45)} Q ${sec(0.24)} ${kHz(2.1)}, ${sec(0.3)} ${kHz(1.9)}`,
    `M ${sec(0.42)} ${kHz(1.2)} L ${sec(0.52)} ${kHz(2.5)} Q ${sec(0.58)} ${kHz(2.2)}, ${sec(0.66)} ${kHz(1.55)}`,
  ];
  const tremolo = Array.from({ length: 26 }, (_, i) => {
    const s = 2.28 + i * 0.038;
    return `${i === 0 ? "M" : "L"} ${sec(s).toFixed(1)} ${kHz(0.82 + Math.sin(i * 1.6) * 0.05 - i * 0.004).toFixed(1)}`;
  }).join(" ");
  const male = [
    `M ${sec(1.05)} ${kHz(0.78)} Q ${sec(1.25)} ${kHz(0.86)}, ${sec(1.45)} ${kHz(0.8)}`,
    `M ${sec(1.82)} ${kHz(0.8)} L ${sec(1.9)} ${kHz(0.84)}`,
    `M ${sec(2.0)} ${kHz(0.8)} L ${sec(2.08)} ${kHz(0.84)}`,
    `M ${sec(2.16)} ${kHz(0.8)} L ${sec(2.22)} ${kHz(0.84)}`,
    tremolo,
  ];
  const all = [...female.map((d) => ({ d, w: 3.4 })), ...male.map((d) => ({ d, w: 5 }))];
  return (
    <svg viewBox="0 0 640 170" className={className} aria-hidden fill="none" stroke="currentColor" strokeLinecap="round">
      {[0, 1, 2, 3].map((f) => (
        <g key={`f${f}`} opacity="0.55">
          <line x1="36" x2="620" y1={kHz(f)} y2={kHz(f)} strokeWidth="0.5" strokeDasharray={f === 0 ? undefined : "2 4"} />
          <text x="28" y={kHz(f) + 4} textAnchor="end" fill="currentColor" stroke="none" fontFamily="var(--font-typed)" fontSize="10">
            {f}
          </text>
        </g>
      ))}
      <text x="8" y="12" fill="currentColor" stroke="none" fontFamily="var(--font-typed)" fontSize="9" opacity="0.7">
        kHz
      </text>
      {[0, 1, 2, 3].map((s) => (
        <text key={`s${s}`} x={sec(s)} y="152" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="var(--font-typed)" fontSize="10" opacity="0.7">
          {s}s
        </text>
      ))}
      {all.map((p, i) => (
        <g key={p.d}>
          {/* Faint first harmonic above each call. */}
          <path d={p.d} transform="translate(0 -38)" strokeWidth={p.w * 0.35} opacity="0.35" />
          <path
            d={p.d}
            strokeWidth={p.w}
            pathLength={1}
            data-draw=""
            style={vars({ "--s": start + i * 0.03, "--d": 0.05 })}
          />
        </g>
      ))}
      <text x={sec(0.42)} y={kHz(2.72)} textAnchor="middle" fill="currentColor" stroke="none" fontFamily="var(--font-hand)" fontSize="17">
        she: ke-wick
      </text>
      <text x={sec(1.9)} y={kHz(1.5)} textAnchor="middle" fill="currentColor" stroke="none" fontFamily="var(--font-hand)" fontSize="17">
        he: hoo ... hu, hu-hu-hooooo
      </text>
    </svg>
  );
}
