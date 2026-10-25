import * as THREE from "three";
export function gearGeometry(
  teeth: number,
  module = 0.025,
  thickness = 0.075,
  pinion = false,
) {
  const pitch = (teeth * module) / 2,
    root = pitch - module * 1.18,
    tip = pitch + module;
  const shape = new THREE.Shape();
  for (let i = 0; i < teeth; i++) {
    // Faceted trapezoidal teeth with narrow tips and visible root clearance.
    for (const [f, r] of [
      [-0.5, root],
      [-0.33, root],
      [-0.19, tip],
      [0.19, tip],
      [0.33, root],
      [0.5, root],
    ]) {
      const a = ((i + f) * Math.PI * 2) / teeth;
      const x = Math.cos(a) * r,
        y = Math.sin(a) * r;
      if (i === 0 && f === -0.5) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
  }
  shape.closePath();
  if (!pinion) {
    const n = 5;
    for (let i = 0; i < n; i++) {
      const a = (i * Math.PI * 2) / n + 0.17,
        b = ((i + 1) * Math.PI * 2) / n - 0.17;
      const hole = new THREE.Path();
      const ri = pitch * 0.26,
        ro = pitch * 0.72;
      hole.moveTo(Math.cos(a) * ri, Math.sin(a) * ri);
      hole.lineTo(Math.cos(a) * ro, Math.sin(a) * ro);
      hole.absarc(0, 0, ro, a, b, false);
      hole.lineTo(Math.cos(b) * ri, Math.sin(b) * ri);
      hole.absarc(0, 0, ri, b, a, true);
      shape.holes.push(hole);
    }
  }
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelSegments: 1,
    steps: 1,
    bevelSize: 0.004,
    bevelThickness: 0.004,
    curveSegments: 10,
  });
  g.translate(0, 0, -thickness / 2);
  g.computeVertexNormals();
  return g;
}
export function crownGeometry(teeth = 15, r = 0.34) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, r, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, r - 0.05, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: 0.065,
    bevelEnabled: true,
    bevelSize: 0.004,
    bevelThickness: 0.004,
    bevelSegments: 1,
    steps: 1,
    curveSegments: 48,
  });
  return g;
}
export function bellGeometry() {
  const profile: [[number, number], ...Array<[number, number]>] = [
    [0.03, 0.74],
    [0.16, 0.72],
    [0.3, 0.65],
    [0.4, 0.52],
    [0.47, 0.35],
    [0.51, 0.12],
    [0.55, 0.035],
    [0.58, 0],
    [0.58, -0.05],
    [0.51, -0.05],
    [0.48, 0.12],
    [0.43, 0.35],
    [0.36, 0.5],
    [0.26, 0.6],
    [0.1, 0.65],
    [0.03, 0.65],
  ];
  return new THREE.LatheGeometry(
    profile.map((p) => new THREE.Vector2(...p)),
    64,
  );
}
function canvasTexture(
  draw: (c: CanvasRenderingContext2D, w: number, h: number) => void,
  w = 512,
  h = 512,
) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
let seed = 17;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
export const woodTexture = canvasTexture((c, w, h) => {
  c.fillStyle = "#593b28";
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 1800; i++) {
    const x = random() * w,
      y = random() * h,
      len = 40 + random() * h;
    c.strokeStyle =
      random() > 0.5 ? "rgba(24,12,5,.12)" : "rgba(194,138,76,.1)";
    c.lineWidth = random() * 1.4 + 0.25;
    c.beginPath();
    c.moveTo(x, y);
    c.bezierCurveTo(
      x + 7,
      y + len * 0.3,
      x - 7,
      y + len * 0.7,
      x + random() * 4,
      y + len,
    );
    c.stroke();
  }
});
woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
woodTexture.repeat.set(2, 1);
export const brassTexture = canvasTexture((c, w, h) => {
  c.fillStyle = "#a58a50";
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 16000; i++) {
    const v = random();
    c.fillStyle = v > 0.5 ? "rgba(244,219,155,.05)" : "rgba(28,24,12,.04)";
    c.fillRect(random() * w, random() * h, 1 + random() * 2, 1);
  }
  for (let i = 0; i < 120; i++) {
    c.fillStyle = "rgba(36,45,29,.035)";
    c.beginPath();
    c.ellipse(
      random() * w,
      random() * h,
      3 + random() * 22,
      2 + random() * 20,
      random() * 3,
      0,
      Math.PI * 2,
    );
    c.fill();
  }
});
brassTexture.wrapS = brassTexture.wrapT = THREE.RepeatWrapping;
export const chapterTexture = canvasTexture(
  (c, w, h) => {
    const cx = w / 2,
      cy = h / 2;
    c.fillStyle = "#17231e";
    c.fillRect(0, 0, w, h);
    c.strokeStyle = "#ad975e";
    for (const r of [0.478, 0.459, 0.442, 0.336, 0.319, 0.275, 0.235]) {
      c.lineWidth = r === 0.459 ? 2 : 1;
      c.beginPath();
      c.arc(cx, cy, w * r, 0, Math.PI * 2);
      c.stroke();
    }
    const chars = [
      "九",
      "八",
      "七",
      "六",
      "五",
      "四",
      "九",
      "八",
      "七",
      "六",
      "五",
      "四",
    ];
    for (let i = 0; i < 120; i++) {
      const a = (i * Math.PI * 2) / 120;
      c.save();
      c.translate(cx, cy);
      c.rotate(a);
      c.strokeStyle = i % 10 === 0 ? "#ddc58c" : "#9a895a";
      c.lineWidth = i % 10 === 0 ? 2 : 1;
      c.beginPath();
      c.moveTo(0, -w * 0.438);
      c.lineTo(0, -w * (i % 10 === 0 ? 0.419 : 0.427));
      c.stroke();
      c.restore();
    }
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      c.save();
      c.translate(cx + Math.sin(a) * w * 0.377, cy - Math.cos(a) * w * 0.377);
      c.rotate(a);
      c.fillStyle = "#e2cc95";
      c.font = `${w * 0.067}px "Noto Serif JP","Yu Mincho",serif`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(chars[i], 0, 0);
      c.restore();
    }
    // The finer rings are decorative subdivisions, not additional historical claims.
    for (let i = 0; i < 48; i++) {
      const a = (i * Math.PI) / 24;
      c.save();
      c.translate(cx, cy);
      c.rotate(a);
      c.fillStyle = "#aa925c";
      c.fillRect(-0.5, -w * 0.31, 1, w * (i % 4 === 0 ? 0.025 : 0.014));
      c.restore();
    }
  },
  1024,
  1024,
);
export const materials = {
  wood: new THREE.MeshStandardMaterial({
    map: woodTexture,
    roughness: 0.7,
    color: "#cdb092",
  }),
  darkWood: new THREE.MeshStandardMaterial({
    map: woodTexture,
    roughness: 0.68,
    color: "#77624a",
  }),
  brass: new THREE.MeshStandardMaterial({
    map: brassTexture,
    metalness: 0.78,
    roughness: 0.34,
    color: "#d0bb8d",
  }),
  gold: new THREE.MeshStandardMaterial({
    color: "#dbc18a",
    metalness: 0.8,
    roughness: 0.3,
  }),
  bronze: new THREE.MeshStandardMaterial({
    map: brassTexture,
    color: "#9eaa8b",
    metalness: 0.8,
    roughness: 0.47,
  }),
  steel: new THREE.MeshStandardMaterial({
    color: "#8c928e",
    metalness: 0.85,
    roughness: 0.3,
  }),
  iron: new THREE.MeshStandardMaterial({
    color: "#393c37",
    metalness: 0.75,
    roughness: 0.67,
  }),
  cord: new THREE.MeshStandardMaterial({ color: "#b7a17c", roughness: 1 }),
  dial: new THREE.MeshStandardMaterial({
    map: chapterTexture,
    metalness: 0.32,
    roughness: 0.55,
  }),
  black: new THREE.MeshStandardMaterial({
    color: "#1d2420",
    metalness: 0.5,
    roughness: 0.45,
  }),
};
export const ARBORS: [number, number][] = [
  [-0.55, 4.35],
  [0.1, 4.7241657387],
  [-0.4, 5.0991657387],
  [0.04, 5.4692670762],
];
