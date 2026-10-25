export const sources = [
  {
    id: "jcwa",
    title: "Japan Clock & Watch Association",
    detail:
      "Early single-foliot lantern clock; rotating dial, fixed indicator, bell, temporal hours and regulator adjustment.",
    url: "https://www.jcwa.or.jp/en/etc/wadokei.html",
  },
  {
    id: "seiko",
    title: "The Seiko Museum Ginza",
    detail:
      "Double-foliot lantern clock. Used for comparison only: its automatic day/night selector is not included in this single-foliot exhibit.",
    url: "https://museum.seiko.co.jp/en/collections/traditional_Japanese_clock/collect001/",
  },
  {
    id: "oxford",
    title: "University of Oxford · Cabinet",
    detail:
      "Crown wheel, alternating verge pallets and foliot: the operating principle of the escapement.",
    url: "https://www.cabinet.ox.ac.uk/key-innovation-escapement-0",
  },
  {
    id: "galileo",
    title: "Museo Galileo",
    detail:
      "Verge escapement with a horizontal crown-wheel arbor and a vertical shaft with two blades.",
    url: "https://mostre.museogalileo.it/motoperpetuo/en/after-leonardo/between-uncertainty-and-fraud/mechanism-for-a-bell-tower-clock-with-verge-escapement-and-foliot.html",
  },
  {
    id: "asset",
    title: "Petaru · Japanese clock / Wadokei",
    detail:
      "User-supplied visual reference on Sketchfab. Public metadata reports 16,970 vertices, 31,605 faces and isDownloadable=false. No geometry or textures were extracted or reused.",
    url: "https://sketchfab.com/3d-models/japanese-clock-wadokei-f14aacb496bc41619c3c522e1fc26bdf",
  },
];
export type ComponentId = (typeof components)[number]["id"];
export interface ComponentRecord {
  id: string;
  name: string;
  japanese: string;
  system: string;
  purpose: string;
  input: string;
  output: string;
  evidence: string;
  source: string;
  position: [number, number, number];
  explode: [number, number, number];
  motion?: string;
}
export const components: ComponentRecord[] = [
  {
    id: "stand",
    name: "Timber display stand",
    japanese: "台",
    system: "Housing & structure",
    purpose:
      "An open timber support gives the weights a clear descent beneath the movement. Joinery and carved rails make the load path visible.",
    input: "The mass of the movement",
    output: "Carries the movement above the falling weights",
    evidence:
      "Estimated geometry · educational stand, not a copy of a surviving object.",
    source: "jcwa",
    position: [0, 1.8, 0],
    explode: [0, -0.3, 0],
  },
  {
    id: "frame",
    name: "Pillars & movement frame",
    japanese: "機枠",
    system: "Housing & structure",
    purpose:
      "Four brass pillars tie the upper and lower plates together. Pinned collars hold the movement square while bearings locate its arbors.",
    input: "Bearing reactions and the suspended load",
    output: "A rigid reference for the gear train",
    evidence:
      "Lantern construction documented; pillar profiles and dimensions inferred.",
    source: "jcwa",
    position: [0, 5, 0],
    explode: [0, 0, 0],
  },
  {
    id: "panels",
    name: "Pierced brass shutters",
    japanese: "側板",
    system: "Housing & structure",
    purpose:
      "Hinged, pierced side shutters protect the movement. The floral relief is an original decorative interpretation.",
    input: "Hinges fixed to the pillars",
    output: "Protection, ventilation and access",
    evidence:
      "Panel enclosure documented; openwork, engraving and hinges newly modeled. No glass claimed.",
    source: "jcwa",
    position: [1.2, 5, 0],
    explode: [2.1, 0.1, 0],
  },
  {
    id: "dial",
    name: "Rotating chapter ring",
    japanese: "文字盤",
    system: "Reading the time",
    purpose:
      "The chapter ring rotates beneath a fixed pointer. The repeated sequence 九 八 七 六 五 四 represents the traditional numbered hours; six marks sunrise and sunset.",
    input: "32:32 motion-work on the great-wheel arbor",
    output: "Twelve temporal-hour divisions in one model day",
    evidence:
      "Rotating dial and fixed indicator documented for the early single-foliot type. Typography and divisions are reconstructed.",
    source: "jcwa",
    position: [0, 4.92, 1.2],
    explode: [0, 0, 2.2],
    motion: "dial",
  },
  {
    id: "display",
    name: "Dial motion-work · 32 / 32",
    japanese: "",
    system: "Reading the time",
    purpose:
      "Equal 32-tooth wheels transfer the great-wheel rotation to the dial shaft at a 1:1 speed ratio with opposite rotation. The shaft also carries the demonstration cam.",
    input: "Great-wheel arbor",
    output: "Rotating chapter ring and demonstration cam",
    evidence:
      "Newly designed explanatory motion-work; tooth counts and center spacing are illustrative.",
    source: "oxford",
    position: [0, 4.92, 0.58],
    explode: [0.2, 0, 1.6],
    motion: "dial",
  },
  {
    id: "pointer",
    name: "Fixed hour indicator",
    japanese: "指針",
    system: "Reading the time",
    purpose:
      "A stationary, shaped pointer reads the moving chapter ring. This selected type does not have modern hour and minute hands.",
    input: "Fixed to the front dial bridge",
    output: "A reference against the rotating numbered ring",
    evidence: "Fixed indicator documented; shape inferred.",
    source: "jcwa",
    position: [0, 4.92, 1.32],
    explode: [0, 0, 2.7],
  },
  {
    id: "weight",
    name: "Going-train weight",
    japanese: "錘",
    system: "Gravity & transmission",
    purpose:
      "The falling iron weight pulls the cord from the winding drum. Its descent is computed from the drum angle and radius, so it stops whenever the train stops.",
    input: "Gravity (represented kinematically)",
    output: "Cord tension at the winding drum",
    evidence:
      "Weight power documented; mass and proportions estimated. No force model.",
    source: "jcwa",
    position: [-0.33, 1.92, -0.55],
    explode: [-1.7, -0.2, -0.4],
    motion: "weight",
  },
  {
    id: "drum",
    name: "Winding drum & cord",
    japanese: "巻胴",
    system: "Gravity & transmission",
    purpose:
      "A grooved drum winds the cord on the great-wheel arbor. Descent = drum radius × arbor angle. Reset rewinds the demonstration.",
    input: "Cord pulled by the weight",
    output: "Torque to the 48-tooth great wheel",
    evidence:
      "Inferred layout; illustrative drum radius 0.22 model units. Cord follows the tangent and a guide eye.",
    source: "oxford",
    position: [-0.55, 4.35, -0.55],
    explode: [-1.2, 0, -1.1],
    motion: "great",
  },
  {
    id: "great",
    name: "Great wheel · 48 teeth",
    japanese: "一番車",
    system: "Gravity & transmission",
    purpose:
      "The slowest wheel transmits motion from the drum to the 12-leaf pinion on the second arbor. A separate 32-tooth wheel on this arbor drives the dial motion-work.",
    input: "Winding drum",
    output: "Second-arbor pinion · 48:12",
    evidence:
      "Train required by the mechanism; this tooth count and layout are illustrative, not measured from an artifact.",
    source: "oxford",
    position: [-0.55, 4.35, 0.3],
    explode: [-0.8, -0.4, 1],
    motion: "great",
  },
  {
    id: "second",
    name: "Second wheel · 40 / 12",
    japanese: "二番車",
    system: "Gravity & transmission",
    purpose:
      "A 12-leaf pinion meshes with the great wheel. A 40-tooth wheel on this same arbor drives the next pinion in a separate depth plane.",
    input: "48-tooth great wheel",
    output: "Third-arbor 10-leaf pinion · 40:10",
    evidence:
      "Illustrative compound arbor. Centers set by pitch radii with module 0.025.",
    source: "oxford",
    position: [0.1, 4.724, 0.08],
    explode: [1.2, 0, 0.6],
    motion: "second",
  },
  {
    id: "third",
    name: "Third wheel · 36 / 10",
    japanese: "三番車",
    system: "Gravity & transmission",
    purpose:
      "The third arbor carries a 10-leaf pinion and a 36-tooth wheel. It turns opposite to the second arbor and drives the escape-arbor pinion.",
    input: "40-tooth second wheel",
    output: "Escape-arbor 10-leaf pinion · 36:10",
    evidence: "Illustrative ratio and estimated construction.",
    source: "oxford",
    position: [-0.4, 5.099, -0.18],
    explode: [-1.2, 0.5, -0.5],
    motion: "third",
  },
  {
    id: "escape",
    name: "Crown escape wheel · 15 teeth",
    japanese: "冠形脱進車",
    system: "Escapement & regulator",
    purpose:
      "Axially projecting crown teeth alternately meet the upper and lower verge pallets. Each half swing releases half a tooth pitch; one full oscillation advances one tooth.",
    input: "36-tooth third wheel through a 10-leaf pinion",
    output: "Alternating impulses and releases at the verge",
    evidence:
      "Verge/crown-wheel principle documented. Fifteen teeth, contact profiles and placement are illustrative; collision forces and recoil are omitted.",
    source: "galileo",
    position: [0.04, 5.469, 0.48],
    explode: [0.7, 1.15, 1],
    motion: "escape",
  },
  {
    id: "verge",
    name: "Verge shaft & two pallets",
    japanese: "冠形脱進機",
    system: "Escapement & regulator",
    purpose:
      "Two blades set approximately a quarter turn apart arrest opposite sides of the crown wheel in alternation. The shaft shares the foliot’s angle.",
    input: "Crown-wheel teeth",
    output: "Impulses to the foliot; alternating locks back to the crown",
    evidence:
      "Documented operating principle. Shapes and clearances are explanatory approximations, not a contact-dynamics solution.",
    source: "oxford",
    position: [0.04, 5.9, 0.69],
    explode: [1.5, 0.8, 1.4],
    motion: "foliot",
  },
  {
    id: "foliot",
    name: "Single foliot balance",
    japanese: "棒天符",
    system: "Escapement & regulator",
    purpose:
      "The weighted horizontal bar oscillates with the verge. It is driven alternately by the escape wheel; it has no pendulum and no balance spring.",
    input: "Alternating escapement impulses",
    output: "Sets the rate at which the train is released",
    evidence:
      "Single foliot documented for the selected early type. Motion is a prescribed visual cycle, not validated dynamics.",
    source: "jcwa",
    position: [0.04, 6.85, 0.69],
    explode: [0, 1.4, 0.6],
    motion: "foliot",
  },
  {
    id: "sliders",
    name: "Adjustable regulator weights",
    japanese: "分銅",
    system: "Escapement & regulator",
    purpose:
      "Moving both weights outward increases rotational inertia and generally slows the beat. Historically this single balance was adjusted at dawn and dusk for temporal hours.",
    input: "Manual weight-position adjustment",
    output: "Changes the illustrative beat period",
    evidence:
      "Adjustment principle documented. The inertia-to-period curve is a teaching approximation; no historical calibration is asserted.",
    source: "jcwa",
    position: [0.8, 6.85, 0.69],
    explode: [1.4, 1.4, 0.6],
    motion: "foliot",
  },
  {
    id: "bearings",
    name: "Bridges, bearings & arbors",
    japanese: "軸受",
    system: "Housing & structure",
    purpose:
      "Brass bridges and steel shafts keep compound wheels in their correct depth planes. Collars and bushings locate each arbor axially.",
    input: "Frame and gear reactions",
    output: "Support for every moving arbor",
    evidence:
      "Necessary mechanical structure; dimensions, bridge shapes and fasteners inferred.",
    source: "jcwa",
    position: [0, 5, -0.8],
    explode: [0, 0.2, -1.8],
  },
  {
    id: "bell",
    name: "Cast bell & suspension",
    japanese: "鐘",
    system: "Bell demonstration",
    purpose:
      "A cast bell sits above the movement on a two-arch support. The early reference has a bell; its exact acoustic properties are not reproduced.",
    input: "Hammer impact",
    output: "An audible signal when sound is enabled",
    evidence:
      "Bell visible in JCWA early single-foliot reference; profile and acoustic synthesis are original.",
    source: "jcwa",
    position: [0, 6.96, -0.35],
    explode: [0, 2, -0.8],
  },
  {
    id: "cam",
    name: "Twelve-lobe demonstration cam",
    japanese: "",
    system: "Bell demonstration",
    purpose:
      "This deliberately simplified cam follows the dial phase. Near each numbered-hour boundary it lifts the rod, then allows the hammer to fall.",
    input: "Model dial phase",
    output: "Hammer lifting rod",
    evidence:
      "Newly designed educational linkage. Not an authenticated historical striking/count-wheel train; no automatic historical strike count or alarm is claimed.",
    source: "jcwa",
    position: [0, 4.92, 0.77],
    explode: [1.5, 0, 1.5],
    motion: "dial",
  },
  {
    id: "hammer",
    name: "Bell hammer & lifting rod",
    japanese: "撞木",
    system: "Bell demonstration",
    purpose:
      "A slender rod links the demonstration cam to a pivoted hammer. It rises before each model hour and falls at the boundary.",
    input: "Demonstration cam",
    output: "One bell impact per numbered-hour boundary",
    evidence:
      "Bell function documented; linkage is newly designed and simplified. The manual audition is a separate exhibit control.",
    source: "jcwa",
    position: [0.79, 5.8, -0.35],
    explode: [1.9, 0.4, -0.7],
    motion: "hammer",
  },
];
export const byId = Object.fromEntries(components.map((c) => [c.id, c]));
export const tour = [
  {
    id: "weight",
    title: "A small descent. A day of time.",
    text: "Gravity pulls the suspended weight. Its cord unwinds the drum. Pause the clock and both the weight and the gears stop together.",
  },
  {
    id: "great",
    title: "Motion travels through the train.",
    text: "Three compound stages multiply rotation by 4 × 4 × 3.6. Every meshing pair turns in opposite directions. These ratios are illustrative.",
  },
  {
    id: "escape",
    title: "The wheel is allowed to escape.",
    text: "The crown wheel advances only when the verge changes its lock. Two pallet releases make one tooth of advance per complete foliot swing.",
  },
  {
    id: "foliot",
    title: "Inertia sets the rhythm.",
    text: "The crown wheel impulses the bar in alternation. Move the weights outward to slow its beat. This is a visual kinematic model, with no simulated forces.",
  },
  {
    id: "dial",
    title: "Read a moving face.",
    text: "A fixed pointer reads the rotating ring. Day and night each had six temporal hours. Their real durations changed with the season.",
  },
  {
    id: "bell",
    title: "Make time audible.",
    text: "The historical reference has a bell. This exhibit uses a clearly labeled demonstration cam and one strike per model hour, rather than claiming an authentic striking train.",
  },
];
