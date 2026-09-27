import {
  type RGB,
  band,
  clamp,
  easeInCubic,
  easeInOut,
  invLerp,
  luminance,
  mix,
  smoothstep,
} from "../math";
import * as T from "./tracks";

/**
 * The complete environmental state of Alderwood at one chapter coordinate.
 * Pure data: the renderer draws it, the DOM bindings read a few fields.
 */
export interface WorldState {
  c: number;
  chapter: number;
  year: number;
  hour: number;

  sunX: number; // 0..1 across the sky
  sunElev: number; // -1..1, 0 = horizon
  sunVisible: number;
  moonX: number;
  moonElev: number;
  moonVisible: number;

  zenith: RGB;
  horizon: RGB;
  grade: RGB;
  gradeAmount: number;
  night: number;

  leafiness: number;
  leafColor: RGB;
  fog: number;
  wind: number;
  rain: number;
  storm: number;
  flood: number;

  shadow: number; // cast-shadow strength
  shadowDir: number; // -1 shadows fall left, +1 right
  shadowLen: number; // relative length
  godRays: number;

  alderFall: number; // 0 standing .. 1 lying on the ground
  rooks: number; // 0..1 progress of the rooks' departure (0 = not flying)
  birds: number; // 0..1 progress of songbird crossing
  owl: number; // presence in the hollow
  owlFlight: number; // 0..1 flight across the moon
  glow: number;
  stars: number;
  constellation: number;
  observer: number;
  dolly: number;

  /** Halo colours for type set on the scene, for dark-ink and bone-ink states. */
  haloDay: RGB;
  haloNight: RGB;
  /** Luminance of the sky behind titles, 0..1. */
  titleSkyLum: number;
  /** Continuous 0..1 blend toward light-on-dark, for canvas marks. */
  inverse: number;
}

export const LAST_CHAPTER = 6;

export function evaluateWorld(c: number): WorldState {
  const year = T.year(c);
  const hour = T.hour(c);
  const storm = T.storm(c);
  const fog = T.fog(c);

  // Sun: rises 06:00 at the left (east), sets 19:05 at the right (west).
  const dayT = (hour - 6.0) / 13.1;
  const sunElev = Math.sin(Math.PI * clamp(dayT, -0.08, 1.08));
  const sunX = 0.08 + 0.84 * clamp(dayT, -0.05, 1.05);
  const sunUp = smoothstep(-0.06, 0.08, sunElev) * (dayT > -0.1 && dayT < 1.1 ? 1 : 0);
  const sunVisible = sunUp * (1 - storm * 0.92) * (1 - fog * 0.55);

  // Moon: rises around 19:20, a waxing crescent in the south-west.
  const moonT = (hour - 19.3) / 9;
  const moonElev = Math.sin(Math.PI * clamp(moonT, 0, 1));
  const moonX = 0.18 + 0.55 * clamp(moonT, 0, 1);
  const moonVisible = smoothstep(0.02, 0.22, moonElev) * (1 - storm);

  const night = smoothstep(18.9, 21.2, hour);

  let zenith = T.sky.zenith(hour);
  let horizon = T.sky.horizon(hour);
  zenith = mix(zenith, T.STORM_SKY, storm * 0.85);
  horizon = mix(horizon, T.STORM_HORIZON, storm * 0.8);
  horizon = mix(horizon, T.FOG_COLOR, fog * 0.55 * (1 - night));

  let grade = T.sky.grade(hour);
  let gradeAmount = T.sky.gradeAmount(hour);
  grade = mix(grade, T.STORM_GRADE, storm * 0.7);
  gradeAmount = Math.max(gradeAmount, storm * 0.42);

  const leafiness = T.leafiness(c);
  const shadow = sunVisible * smoothstep(0.02, 0.2, sunElev) * (1 - fog * 0.8);
  const shadowDir = sunX < 0.5 ? 1 : -1;
  const shadowLen = clamp(0.25 / Math.max(0.12, sunElev), 0.3, 2.2);
  const godRays =
    sunVisible * leafiness * smoothstep(0.1, 0.35, sunElev) * (1 - storm) * (1 - fog * 0.7);

  const fallT = invLerp(T.FALL_START, T.FALL_END, c);
  const alderFall = fallT <= 0 ? 0 : fallT >= 1 ? 1 : easeInCubic(fallT) * 0.94 + fallT * 0.06;

  const rooksT = invLerp(T.ROOKS_START, T.ROOKS_END, c);
  const birdsT = invLerp(T.BIRDS_START, T.BIRDS_END, c);
  const owl = band(c, T.OWL_IN, T.OWL_IN + 0.12, T.OWL_FLIGHT_START, T.OWL_FLIGHT_START + 0.02);
  const owlFlightT = invLerp(T.OWL_FLIGHT_START, T.OWL_FLIGHT_END, c);

  const stars = smoothstep(19.6, 21.6, hour) * (1 - storm);
  const glow = smoothstep(T.GLOW_IN[0], T.GLOW_IN[1], c);
  const constellation = smoothstep(T.CONSTELLATION[0], T.CONSTELLATION[1], c);

  // Type set straight onto the sky: choose dark ink or bone by the sky
  // luminance a third of the way down, crossing over a narrow window.
  const titleSky = mix(zenith, horizon, 0.35);
  const lum = luminance(titleSky);
  const inverse = 1 - smoothstep(0.16, 0.24, lum);
  const haloDay = mix(titleSky, T.PAPER, 0.45);
  const haloNight = mix(titleSky, T.NIGHT_DEEP, 0.5);

  return {
    c,
    chapter: clamp(Math.floor(c), 0, LAST_CHAPTER),
    year,
    hour,
    sunX,
    sunElev,
    sunVisible,
    moonX,
    moonElev,
    moonVisible,
    zenith,
    horizon,
    grade,
    gradeAmount,
    night,
    leafiness,
    leafColor: T.leafColor(c),
    fog,
    wind: T.wind(c),
    rain: T.rain(c),
    storm,
    flood: T.flood(c),
    shadow,
    shadowDir,
    shadowLen,
    godRays,
    alderFall,
    rooks: rooksT > 0 && rooksT < 1 ? rooksT : 0,
    birds: birdsT > 0 && birdsT < 1 ? birdsT : 0,
    owl,
    owlFlight: owlFlightT > 0 && owlFlightT < 1 ? easeInOut(owlFlightT) : 0,
    glow,
    stars,
    constellation,
    observer: T.observer(c),
    dolly: easeInOut(clamp(c / 7)),
    haloDay,
    haloNight,
    titleSkyLum: lum,
    inverse,
  };
}
