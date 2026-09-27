/**
 * The Chronicle of Alderwood. All of it is fiction: the wood, the keepers and
 * their notebooks are imagined. Each chapter is one <section>; its index is the
 * integer part of the timeline's chapter coordinate.
 */

export interface Keeper {
  name: string;
  role: string;
  years: string;
}

export const KEEPERS = {
  edmund: { name: "Edmund Ashcombe", role: "surveyor", years: "1887 to 1919" },
  margery: { name: "Margery Ashcombe", role: "his daughter, schoolteacher", years: "1919 to 1958" },
  tobias: { name: "Tobias Wren", role: "forester", years: "1958 to 1994" },
  archive: { name: "The Alderwood Archive", role: "", years: "since 1995" },
} satisfies Record<string, Keeper>;

export interface ChapterMeta {
  id: string;
  numeral: string;
  /** Label for the year rule navigation. */
  mark: string;
  year: string;
  title: string;
  /** Plain description of the drawn scene, for screen readers. */
  scene: string;
}

export const CHAPTERS: ChapterMeta[] = [
  {
    id: "first-observation",
    numeral: "I",
    mark: "1887",
    year: "1887",
    title: "First Observation",
    scene:
      "Dawn over a cleared meadow. Old stumps, a narrow brook, and a scatter of alder seedlings no higher than a knee. Six survey stakes stand in the grass.",
  },
  {
    id: "the-young-grove",
    numeral: "II",
    mark: "1906",
    year: "1906",
    title: "The Young Grove",
    scene:
      "Morning. The alders are young trees now, birches have seeded on the dry ground, and a new fence runs along the east side. Small birds cross the clearing.",
  },
  {
    id: "the-canopy-closes",
    numeral: "III",
    mark: "1924",
    year: "1924",
    title: "The Canopy Closes",
    scene:
      "Noon in high summer. Oaks rise among the alders and the crowns have met overhead. Shafts of light fall through gaps onto the shaded floor.",
  },
  {
    id: "years-of-silence",
    numeral: "IV",
    mark: "1947",
    year: "1947",
    title: "Years of Silence",
    scene:
      "A foggy March afternoon. Bare, grown branches stand in the mist. The survey stakes have rotted away and no one is writing anything down.",
  },
  {
    id: "the-great-storm",
    numeral: "V",
    mark: "1968",
    year: "1968",
    title: "The Great Storm",
    scene:
      "An October evening turning violent. Wind bends the whole wood, rain drives across it, and the great alder at Station A snaps and falls across the fence.",
  },
  {
    id: "return-of-the-owls",
    numeral: "VI",
    mark: "1989",
    year: "1989",
    title: "Return of the Owls",
    scene:
      "Blue dusk in November. The broken alder stands as a hollow stump, its fallen trunk green with moss and fungus. A tawny owl sits in the hollow.",
  },
  {
    id: "the-living-archive",
    numeral: "VII",
    mark: "Now",
    year: "Present day",
    title: "The Living Archive",
    scene:
      "A July night. The wood is fully grown. Glow-worms shine where the fence used to be, an owl crosses the moon, and six stars trace the shape of the 1887 survey.",
  },
];

export const ENTRIES = {
  first: {
    date: "9 April 1887",
    lines: [
      "Walked the lower meadow at first light.",
      "Where the old wood was felled there",
      "is nothing above my knee, save alder",
      "seedlings along the brook, some dozens.",
    ],
    coda: "I have set six stakes, so that whoever comes after may find the same ground.",
  },
  grove: {
    date: "2 May 1906",
    lines: [
      "The alders are over my head now.",
      "Birch has come in on the dry side,",
      "and a blackbird nests at Station C.",
    ],
    coda: "Nineteen years, and I must part the bracken to find my own stakes.",
    margin: "Fence put up on the east side, to keep the sheep off the young trees.",
  },
  canopy: {
    date: "11 June 1924",
    lines: [
      "Father's stakes are lost in the bracken.",
      "By noon no sun reaches the ferns.",
      "The oaks he never wrote down",
      "are pushing up through the alders.",
    ],
    pencil: "crowns met overhead, 58 ft",
  },
  silence: {
    blankYears: ["1939", "1940", "1941", "1942", "1943", "1944", "1945", "1946"],
    date: "March 1947",
    lines: [
      "Back at last. The path has gone,",
      "and my father's stakes with it.",
      "The wood did not wait for me,",
      "and I find I am glad of it.",
    ],
  },
  storm: {
    date: "3 October 1968",
    log: [
      { time: "5.05 pm", text: "Glass falling since noon. Air very still." },
      { time: "5.40 pm", text: "Wind backing south-west and rising. The rooks have gone quiet." },
      { time: "6.10 pm", text: "The great alder at Station A is down, eighty-one years after Edmund first measured it. I heard it go over the wind." },
    ],
    pressureFrom: 1004,
    pressureTo: 976,
  },
  owls: {
    date: "14 November 1989",
    lines: [
      "The alder's stump has gone hollow,",
      "the fallen trunk thick with fungus.",
      "Tonight, for the first time in my",
      "thirty-one years here, a pair of tawny",
      "owls, calling to each other across it.",
    ],
    aside: "What the storm brought down, the wood has made into a nursery.",
  },
  archive: {
    glow: "July. Glow-worms along the line where the fence used to be.",
    stars:
      "Edmund's six stakes rotted into the ground long ago. Tonight their shape is in the sky, where nobody can lose it.",
    closing: "Since first light you have been reading the lifetime of one wood.",
    after: "Four keepers filled this book. The next page is blank.",
  },
} as const;
