import {
  Suspense,
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  ARBORS,
  bellGeometry,
  crownGeometry,
  gearGeometry,
  materials as M,
} from "./geometry";
import {
  advance,
  type Simulation,
  type ViewMode,
  type Preset,
} from "./mechanism";
import { byId } from "./inventory";

export interface ExhibitOptions {
  mode: ViewMode;
  selected: string | null;
  isolate: boolean;
  labels: boolean;
  path: boolean;
  camera: { preset: Preset; version: number };
}
interface Props {
  options: ExhibitOptions;
  sim: Simulation;
  onSelect: (id: string | null) => void;
  onReady: () => void;
  onMetrics: (fps: number, triangles: number) => void;
}
const rounded = new RoundedBoxGeometry(1, 1, 1, 1, 0.035);
const sphere = new THREE.SphereGeometry(1, 12, 8);
const circle = new THREE.CylinderGeometry(1, 1, 1, 16);
function PiercedPlate({
  size,
  position,
  hole,
  material,
}: {
  size: [number, number, number];
  position: [number, number, number];
  hole: [number, number, number];
  material: THREE.Material;
}) {
  const geometry = useMemo(() => {
    const [w, t, d] = size;
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, -d / 2);
    shape.lineTo(w / 2, -d / 2);
    shape.lineTo(w / 2, d / 2);
    shape.lineTo(-w / 2, d / 2);
    shape.closePath();
    const cutout = new THREE.Path();
    cutout.absarc(hole[0], hole[1], hole[2], 0, Math.PI * 2, true);
    shape.holes.push(cutout);
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: t,
      bevelEnabled: true,
      bevelSize: 0.006,
      bevelThickness: 0.006,
      bevelSegments: 1,
      steps: 1,
      curveSegments: 16,
    });
    g.translate(0, 0, -t / 2);
    g.rotateX(Math.PI / 2);
    return g;
  }, [size[0], size[1], size[2], hole[0], hole[1], hole[2]]);
  return (
    <mesh
      geometry={geometry}
      position={position}
      material={material}
      castShadow
      receiveShadow
    />
  );
}
// Merge static hardware by material inside its selectable component only.
// Animated arbors and adjustable weights stay separate.
function StaticBatch({ children }: { children: ReactNode }) {
  const root = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    const group = root.current!;
    group.updateWorldMatrix(true, true);
    const inverse = group.matrixWorld.clone().invert();
    const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();
    const originals: THREE.Mesh[] = [];
    group.traverse((o) => {
      if (
        !(o instanceof THREE.Mesh) ||
        o instanceof THREE.InstancedMesh ||
        Array.isArray(o.material)
      )
        return;
      const geom = o.geometry.index
        ? o.geometry.toNonIndexed()
        : o.geometry.clone();
      for (const key of Object.keys(geom.attributes))
        if (!["position", "normal", "uv"].includes(key))
          geom.deleteAttribute(key);
      geom.applyMatrix4(inverse.clone().multiply(o.matrixWorld));
      const list = buckets.get(o.material) ?? [];
      list.push(geom);
      buckets.set(o.material, list);
      originals.push(o);
    });
    const added: THREE.Mesh[] = [];
    for (const [mat, geometries] of buckets) {
      const merged = mergeGeometries(geometries, false);
      geometries.forEach((g) => g.dispose());
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = "batched-hardware";
      group.add(mesh);
      added.push(mesh);
    }
    originals.forEach((o) => {
      o.visible = false;
    });
    return () => {
      originals.forEach((o) => {
        o.visible = true;
      });
      added.forEach((o) => {
        group.remove(o);
        o.geometry.dispose();
      });
    };
  }, []);
  return <group ref={root}>{children}</group>;
}
const phases: Record<string, string> = {
  great: "great",
  second: "second",
  third: "third",
  escape: "escape",
  drum: "great",
  dial: "dial",
  verge: "foliot",
  foliot: "foliot",
  sliders: "foliot",
  cam: "dial",
  hammer: "hammer",
};
function Box({
  size,
  position = [0, 0, 0],
  material = M.brass,
  rotation = [0, 0, 0],
}: {
  size: [number, number, number];
  position?: [number, number, number];
  material?: THREE.Material;
  rotation?: [number, number, number];
}) {
  return (
    <mesh
      geometry={rounded}
      scale={size}
      position={position}
      rotation={rotation}
      material={material}
      castShadow
      receiveShadow
    />
  );
}
function Cylinder({
  radius,
  length,
  position = [0, 0, 0],
  material = M.brass,
  axis = "y",
}: {
  radius: number;
  length: number;
  position?: [number, number, number];
  material?: THREE.Material;
  axis?: "x" | "y" | "z";
}) {
  return (
    <mesh
      geometry={circle}
      scale={[radius, length, radius]}
      position={position}
      rotation={
        axis === "z"
          ? [Math.PI / 2, 0, 0]
          : axis === "x"
            ? [0, 0, Math.PI / 2]
            : [0, 0, 0]
      }
      material={material}
      castShadow
      receiveShadow
    />
  );
}
function Ring({
  radius,
  tube = 0.018,
  position = [0, 0, 0],
  material = M.gold,
  rotation = [0, 0, 0],
}: {
  radius: number;
  tube?: number;
  position?: [number, number, number];
  material?: THREE.Material;
  rotation?: [number, number, number];
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      material={material}
      castShadow
    >
      <torusGeometry args={[radius, tube, 6, 40]} />
    </mesh>
  );
}
function Screw({
  position,
  axis = "z",
}: {
  position: [number, number, number];
  axis?: "z" | "x" | "y";
}) {
  return (
    <group
      position={position}
      rotation={
        axis === "x"
          ? [0, Math.PI / 2, 0]
          : axis === "y"
            ? [-Math.PI / 2, 0, 0]
            : [0, 0, 0]
      }
    >
      <Cylinder radius={0.036} length={0.022} axis="z" material={M.steel} />
      <Box
        size={[0.04, 0.006, 0.004]}
        position={[0, 0, 0.015]}
        material={M.black}
      />
    </group>
  );
}
function Rod({
  from,
  to,
  radius = 0.025,
  material = M.brass,
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius?: number;
  material?: THREE.Material;
}) {
  const a = new THREE.Vector3(...from),
    b = new THREE.Vector3(...to),
    q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      b.clone().sub(a).normalize(),
    );
  return (
    <mesh
      geometry={circle}
      position={a.add(b).multiplyScalar(0.5)}
      quaternion={q}
      scale={[
        radius,
        new THREE.Vector3(...from).distanceTo(new THREE.Vector3(...to)),
        radius,
      ]}
      material={material}
      castShadow
    />
  );
}

function Part({
  id,
  position,
  explode,
  children,
  options,
  onSelect,
  label = false,
  suffix = "",
}: {
  id: string;
  position: [number, number, number];
  explode?: [number, number, number];
  children: ReactNode;
  options: ExhibitOptions;
  onSelect: Props["onSelect"];
  label?: boolean;
  suffix?: string;
}) {
  const ref = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const ownedMaterials = useRef(new Map<string, THREE.MeshStandardMaterial>());
  const alpha = useRef(1);
  const spread = useRef(0);
  const meta = byId[id];
  useLayoutEffect(() => {
    const mats: THREE.MeshStandardMaterial[] = [];
    let meshIndex = 0;
    ref.current?.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        const index = meshIndex++;
        if (!o.name || o.name === "batched-hardware")
          o.name = `${id}${suffix}-mesh-${index}`;
        const src = Array.isArray(o.material) ? o.material : [o.material];
        const cloned = src.map((m) => {
          const key = m.userData.sourceMaterial ?? m.uuid;
          let c = ownedMaterials.current.get(key);
          if (!c) {
            c = m.clone() as THREE.MeshStandardMaterial;
            c.userData.sourceMaterial = key;
            ownedMaterials.current.set(key, c);
          }
          mats.push(c);
          return c;
        });
        o.material = Array.isArray(o.material) ? cloned : cloned[0];
        o.userData.componentId = id;
      }
    });
    matRef.current = [...new Set(mats)];
  });
  useEffect(
    () => () => {
      ownedMaterials.current.forEach((m) => m.dispose());
      ownedMaterials.current.clear();
    },
    [],
  );
  useFrame((_, dt) => {
    if (!ref.current) return;
    const housing = ["panels", "dial", "pointer"].includes(id);
    let target =
      options.mode === "interior" && housing
        ? 0
        : options.mode === "xray" && housing
          ? 0.14
          : options.mode === "operating" && housing
            ? 0.06
            : 1;
    if (options.isolate) target = options.selected === id ? 1 : 0;
    alpha.current = THREE.MathUtils.damp(
      alpha.current,
      target,
      9,
      Math.min(dt, 0.2),
    );
    spread.current = THREE.MathUtils.damp(
      spread.current,
      options.mode === "exploded" ? 1 : 0,
      5,
      Math.min(dt, 0.2),
    );
    const e = explode ?? meta.explode;
    ref.current.position.set(
      position[0] + e[0] * spread.current,
      position[1] + e[1] * spread.current,
      position[2] + e[2] * spread.current,
    );
    ref.current.visible = alpha.current > 0.012;
    const active = options.selected === id;
    const power =
      options.path &&
      [
        "weight",
        "drum",
        "great",
        "second",
        "third",
        "escape",
        "verge",
        "foliot",
        "sliders",
        "dial",
        "display",
      ].includes(id);
    for (const mat of matRef.current) {
      mat.opacity = alpha.current;
      const transparent = alpha.current < 0.995;
      if (mat.transparent !== transparent) {
        mat.transparent = transparent;
        mat.needsUpdate = true;
      }
      mat.depthWrite = alpha.current > 0.95;
      if (mat.emissive) {
        mat.emissive.set(active ? "#c9a65e" : power ? "#5c461f" : "#000000");
        mat.emissiveIntensity = active ? 0.3 : power ? 0.15 : 0;
      }
    }
  });
  function select(e: ThreeEvent<MouseEvent>) {
    if (alpha.current < 0.2) return;
    e.stopPropagation();
    onSelect(id);
  }
  return (
    <group
      ref={ref}
      name={`${id}${suffix}`}
      position={position}
      onClick={select}
      onPointerOver={(e) => {
        if (alpha.current > 0.2) {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }
      }}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      {children}
      {options.labels &&
        label &&
        (!options.isolate || options.selected === id) && (
          <Html
            position={[0, 0.32, 0]}
            center
            zIndexRange={[10, 0]}
            style={{ pointerEvents: "none" }}
          >
            <span className="component-label">{meta.name.split(" ·")[0]}</span>
          </Html>
        )}
    </group>
  );
}

function Moving({
  sim,
  field,
  children,
  axis = "z",
  offset = 0,
}: {
  sim: Simulation;
  field: keyof Simulation;
  children: ReactNode;
  axis?: "z" | "y" | "x";
  offset?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current)
      ref.current.rotation[axis] = (sim[field] as number) + offset;
  });
  return <group ref={ref}>{children}</group>;
}
const gearCache = new Map<string, THREE.BufferGeometry>();
function Gear({
  name,
  teeth,
  z = 0,
  pinion = false,
  offset = 0,
  module = 0.025,
}: {
  name: string;
  teeth: number;
  z?: number;
  pinion?: boolean;
  offset?: number;
  module?: number;
}) {
  const key = `${teeth}:${pinion}:${module}`;
  if (!gearCache.has(key))
    gearCache.set(
      key,
      gearGeometry(teeth, module, pinion ? 0.12 : 0.07, pinion),
    );
  return (
    <group
      name={`${name}-assembly`}
      position={[0, 0, z]}
      rotation={[0, 0, offset]}
    >
      <mesh
        name={name}
        userData={{ teeth, module, role: pinion ? "pinion" : "wheel" }}
        geometry={gearCache.get(key)!}
        material={pinion ? M.steel : M.brass}
        castShadow
        receiveShadow
      />
      <Cylinder
        radius={pinion ? 0.07 : 0.105}
        length={pinion ? 0.15 : 0.12}
        axis="z"
        material={M.bronze}
      />
      {!pinion &&
        [0, 1, 2].map((i) => (
          <Screw
            key={i}
            position={[
              Math.cos((i * Math.PI * 2) / 3) * 0.07,
              Math.sin((i * Math.PI * 2) / 3) * 0.07,
              0.072,
            ]}
          />
        ))}
    </group>
  );
}

function Stand() {
  return (
    <>
      <Box
        size={[3.25, 0.2, 2.7]}
        position={[0, 0.18, 0]}
        material={M.darkWood}
      />
      <Box size={[3.1, 0.09, 2.58]} position={[0, 0.31, 0]} material={M.wood} />
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => (
          <group key={`${x}${z}`}>
            <Box
              size={[0.24, 3.08, 0.24]}
              position={[x * 1.26, 1.91, z * 1.04]}
              rotation={[0, 0, -x * 0.055]}
              material={M.wood}
            />
            <Box
              size={[0.34, 0.18, 0.34]}
              position={[x * 1.34, 0.48, z * 1.04]}
              material={M.darkWood}
            />
            <Box
              size={[0.31, 0.13, 0.31]}
              position={[x * 1.18, 3.32, z * 1.04]}
              material={M.darkWood}
            />
            {[0.79, 3.08].map((y) => (
              <Screw key={y} position={[x * 1.28, y, z * 1.17]} />
            ))}
          </group>
        )),
      )}
      {[-1, 1].map((z) => (
        <group key={z}>
          <Box
            size={[2.65, 0.22, 0.14]}
            position={[0, 0.91, z * 1.04]}
            material={M.wood}
          />
          <Box
            size={[2.5, 0.3, 0.18]}
            position={[0, 3.14, z * 1.04]}
            material={M.wood}
          />
          {[-1, 1].map((x) => (
            <Box
              key={x}
              size={[0.48, 0.09, 0.16]}
              position={[x * 0.95, 2.91, z * 1.04]}
              rotation={[0, 0, x * 0.65]}
              material={M.wood}
            />
          ))}
        </group>
      ))}
      {[-1, 1].map((x) => (
        <Box
          key={x}
          size={[0.15, 0.18, 2.08]}
          position={[x * 1.26, 0.91, 0]}
          material={M.wood}
        />
      ))}
      <PiercedPlate
        size={[2.94, 0.18, 2.38]}
        position={[0, 3.47, 0]}
        hole={[-0.33, -0.55, 0.06]}
        material={M.darkWood}
      />
      <PiercedPlate
        size={[3.06, 0.07, 2.48]}
        position={[0, 3.59, 0]}
        hole={[-0.33, -0.55, 0.06]}
        material={M.wood}
      />
    </>
  );
}
function Frame() {
  return (
    <>
      {[3.72, 6.23].map((y) => (
        <group key={y}>
          <PiercedPlate
            size={[2.6, 0.11, 2.04]}
            position={[0, y, 0]}
            hole={y < 5 ? [-0.33, -0.55, 0.06] : [0.04, 0.69, 0.045]}
            material={M.bronze}
          />
          <PiercedPlate
            size={[2.68, 0.05, 2.12]}
            position={[0, y - 0.07, 0]}
            hole={y < 5 ? [-0.33, -0.55, 0.06] : [0.04, 0.69, 0.045]}
            material={M.brass}
          />
          {[-1, 1].flatMap((x) =>
            [-1, 1].map((z) => (
              <Screw
                key={`${x}${z}`}
                axis="y"
                position={[x * 1.17, y + 0.07, z * 0.88]}
              />
            )),
          )}
        </group>
      ))}
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => (
          <group key={`${x}${z}`} position={[x * 1.17, 4.97, z * 0.88]}>
            <Cylinder radius={0.063} length={2.5} material={M.brass} />
            {[-1.17, -1.05, 0.98, 1.14].map((y) => (
              <Cylinder
                key={y}
                radius={0.105}
                length={0.065}
                position={[0, y, 0]}
                material={M.gold}
              />
            ))}
            <Cylinder
              radius={0.1}
              length={0.14}
              position={[0, 1.36, 0]}
              material={M.bronze}
            />
            <mesh
              position={[0, 1.47, 0]}
              geometry={sphere}
              scale={0.12}
              material={M.gold}
              castShadow
            />
          </group>
        )),
      )}
      <Box
        size={[0.1, 0.58, 0.12]}
        position={[0.04, 6.49, 0.8]}
        material={M.bronze}
      />
      <Ring
        radius={0.055}
        tube={0.018}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0.04, 6.78, 0.69]}
        material={M.gold}
      />
    </>
  );
}
function Flower({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh geometry={sphere} scale={[0.055, 0.055, 0.027]} material={M.gold} />
      {Array.from({ length: 5 }, (_, i) => (
        <mesh
          key={i}
          geometry={sphere}
          position={[
            Math.sin((i * Math.PI * 2) / 5) * 0.09,
            Math.cos((i * Math.PI * 2) / 5) * 0.09,
            0,
          ]}
          scale={[0.055, 0.08, 0.018]}
          rotation={[0, 0, (-i * Math.PI * 2) / 5]}
          material={M.bronze}
        />
      ))}
    </group>
  );
}
function Lattice() {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    let n = 0;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 6; i++) {
      const x = -0.53 + i * 0.21;
      for (const y of [-0.55, 0, 0.55]) {
        for (const [dx, dy, sx, sy] of [
          [0, 0.13, 0.26, 0.025],
          [0.13, 0, 0.025, 0.26],
          [0, -0.13, 0.26, 0.025],
          [-0.13, 0, 0.025, 0.26],
        ]) {
          dummy.position.set(
            x + (dx - dy) / Math.sqrt(2),
            y + (dx + dy) / Math.sqrt(2),
            0,
          );
          dummy.rotation.set(0, 0, Math.PI / 4);
          dummy.scale.set(sx, sy, 0.025);
          dummy.updateMatrix();
          ref.current?.setMatrixAt(n++, dummy.matrix);
        }
      }
    }
    if (ref.current) {
      ref.current.instanceMatrix.needsUpdate = true;
      ref.current.computeBoundingSphere();
    }
  }, []);
  return (
    <instancedMesh
      ref={ref}
      args={[rounded, M.gold, 72]}
      castShadow
      receiveShadow
    />
  );
}
function Shutter() {
  return (
    <>
      <Box size={[0.055, 2.22, 0.18]} position={[0, 0, -0.77]} />
      <Box size={[0.055, 2.22, 0.18]} position={[0, 0, 0.77]} />
      <Box size={[0.055, 0.2, 1.6]} position={[0, 1.02, 0]} />
      <Box size={[0.055, 0.2, 1.6]} position={[0, -1.02, 0]} />
      <group rotation={[0, Math.PI / 2, 0]}>
        {[-0.62, 0.62].map((x) => (
          <Box
            key={x}
            size={[0.025, 1.8, 0.025]}
            position={[x, 0, 0]}
            material={M.gold}
          />
        ))}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Box
            key={i}
            size={[0.027, 1.8, 0.028]}
            position={[-0.53 + i * 0.21, 0, 0]}
            material={M.bronze}
          />
        ))}
        <Lattice />
        <Flower position={[-0.4, 0.92, 0.018]} scale={0.6} />
        <Flower position={[0.35, -0.93, 0.018]} scale={0.6} />
      </group>
      {[-0.78, 0.78].map((z) => (
        <group key={z} position={[0, -0.4, z]}>
          <Cylinder radius={0.055} length={0.2} material={M.bronze} />
          <Screw axis="x" position={[0.04, 0, 0]} />
        </group>
      ))}
    </>
  );
}
function Dial({ sim }: { sim: Simulation }) {
  return (
    <>
      <Box
        size={[2.28, 2.36, 0.075]}
        position={[0, 0, -0.13]}
        material={M.bronze}
      />
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((y) => (
          <Screw key={`${x}${y}`} position={[x * 1.02, y * 1.06, -0.07]} />
        )),
      )}
      {[
        [-0.83, 0.86],
        [0.83, 0.86],
        [-0.83, -0.86],
        [0.83, -0.86],
      ].map(([x, y], i) => (
        <Flower key={i} position={[x, y, -0.055]} scale={0.75} />
      ))}
      <Moving sim={sim} field="dial">
        <Cylinder radius={0.968} length={0.075} axis="z" material={M.black} />
        <mesh rotation={[0, 0, 0]} position={[0, 0, 0.041]} material={M.dial}>
          <circleGeometry args={[0.965, 96]} />
        </mesh>
        <Ring radius={0.973} tube={0.017} />
        <Ring radius={0.51} position={[0, 0, 0.05]} tube={0.012} />
        <Cylinder radius={0.15} length={0.12} axis="z" material={M.brass} />
      </Moving>
    </>
  );
}
function Pointer() {
  return (
    <>
      <Cylinder radius={0.115} length={0.14} axis="z" material={M.bronze} />
      <Box
        size={[0.055, 0.66, 0.022]}
        position={[0, 0.34, 0.075]}
        material={M.gold}
      />
      <Box
        size={[0.15, 0.15, 0.028]}
        position={[0, 0.69, 0.075]}
        rotation={[0, 0, Math.PI / 4]}
        material={M.gold}
      />
      <Cylinder
        radius={0.055}
        length={0.04}
        position={[0, 0, 0.1]}
        axis="z"
        material={M.steel}
      />
    </>
  );
}
function DriveWeight({ sim }: { sim: Simulation }) {
  const ref = useRef<THREE.Group>(null),
    cord = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ref.current) ref.current.position.y = -sim.travel;
    if (cord.current) {
      const len = 2 + sim.travel;
      cord.current.scale.set(0.018, len, 0.018);
      cord.current.position.y = 2.25 - len / 2;
    }
  });
  return (
    <>
      <mesh ref={cord} geometry={circle} material={M.cord} />
      <group ref={ref}>
        <Cylinder
          radius={0.21}
          length={0.78}
          position={[0, -0.25, 0]}
          material={M.iron}
        />
        <Cylinder
          radius={0.23}
          length={0.065}
          position={[0, -0.63, 0]}
          material={M.bronze}
        />
        <Cylinder
          radius={0.225}
          length={0.06}
          position={[0, 0.14, 0]}
          material={M.bronze}
        />
        <Ring
          radius={0.087}
          tube={0.018}
          position={[0, 0.25, 0]}
          material={M.iron}
        />
        {Array.from({ length: 8 }, (_, i) => (
          <Box
            key={i}
            size={[0.018, 0.58, 0.014]}
            position={[
              Math.cos((i * Math.PI) / 4) * 0.208,
              -0.25,
              Math.sin((i * Math.PI) / 4) * 0.208,
            ]}
            material={M.bronze}
          />
        ))}
      </group>
      <Ring
        radius={0.04}
        tube={0.013}
        position={[0, 1.55, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        material={M.steel}
      />
    </>
  );
}
function Drum({ sim }: { sim: Simulation }) {
  return (
    <Moving sim={sim} field="great">
      <Cylinder radius={0.22} length={0.34} axis="z" material={M.darkWood} />
      {[-0.19, 0.19].map((z) => (
        <Cylinder
          key={z}
          radius={0.26}
          length={0.045}
          axis="z"
          position={[0, 0, z]}
          material={M.bronze}
        />
      ))}
      {Array.from({ length: 13 }, (_, i) => (
        <Ring
          key={i}
          radius={0.223}
          tube={0.008}
          position={[0, 0, -0.16 + i * 0.026]}
          material={M.cord}
        />
      ))}
      <Cylinder radius={0.068} length={0.5} axis="z" material={M.steel} />
      <Box
        size={[0.045, 0.24, 0.04]}
        position={[0, 0.12, -0.29]}
        material={M.steel}
      />
      <Cylinder
        radius={0.05}
        length={0.12}
        axis="z"
        position={[0, 0.23, -0.31]}
        material={M.wood}
      />
    </Moving>
  );
}
function Bearings() {
  return (
    <>
      {ARBORS.map(([x, y], i) => (
        <group key={i}>
          <Cylinder
            radius={0.035}
            length={1.56}
            position={[x, y, 0]}
            axis="z"
            material={M.steel}
          />
          {[-0.77, 0.77].map((z) => (
            <group key={z}>
              <Box
                size={[1.78, 0.1, 0.055]}
                position={[-0.04, y, z]}
                material={M.bronze}
              />
              <Cylinder
                radius={0.08}
                length={0.08}
                axis="z"
                position={[x, y, z]}
                material={M.gold}
              />
              <Screw position={[x - 0.13, y, z + 0.036]} />
              <Screw position={[x + 0.13, y, z + 0.036]} />
            </group>
          ))}
        </group>
      ))}
      {[-0.79, 0.79].map((z) => (
        <group key={z}>
          {[-0.87, 0.78].map((x) => (
            <Box
              key={x}
              size={[0.085, 2.18, 0.065]}
              position={[x, 4.88, z]}
              material={M.bronze}
            />
          ))}
          <Box
            size={[1.75, 0.08, 0.07]}
            position={[-0.02, 5.87, z]}
            material={M.bronze}
          />
        </group>
      ))}
    </>
  );
}
function Crown() {
  const g = useMemo(() => crownGeometry(), []);
  return (
    <>
      <mesh
        name="crown-escape-wheel-15"
        userData={{ teeth: 15, role: "crown" }}
        geometry={g}
        material={M.brass}
        castShadow
      />
      {Array.from({ length: 15 }, (_, i) => {
        const a = (i * Math.PI * 2) / 15;
        return (
          <group key={i} rotation={[0, 0, a]}>
            <Box
              size={[0.034, 0.075, 0.12]}
              position={[0, 0.32, 0.11]}
              rotation={[0, 0.12, 0]}
              material={M.steel}
            />
          </group>
        );
      })}
      {[0, 1, 2, 3].map((i) => (
        <Box
          key={i}
          size={[0.52, 0.035, 0.045]}
          rotation={[0, 0, (i * Math.PI) / 4]}
          position={[0, 0, 0.02]}
          material={M.bronze}
        />
      ))}
      <Cylinder radius={0.07} length={0.12} axis="z" material={M.steel} />
    </>
  );
}
function Verge() {
  return (
    <>
      <Cylinder
        radius={0.022}
        length={1.8}
        position={[0, 0, 0]}
        material={M.steel}
      />
      <Box
        size={[0.19, 0.045, 0.09]}
        position={[-0.07, -0.16, 0]}
        rotation={[0, 0, 0.12]}
        material={M.steel}
      />
      <Box
        size={[0.19, 0.045, 0.09]}
        position={[0.04, -0.84, 0]}
        rotation={[0, Math.PI / 2, 0]}
        material={M.steel}
      />
      {[0.59, -0.72].map((y) => (
        <Cylinder
          key={y}
          radius={0.047}
          length={0.07}
          position={[0, y, 0]}
          material={M.gold}
        />
      ))}
    </>
  );
}
function Foliot() {
  return (
    <>
      <Box size={[2.17, 0.05, 0.075]} material={M.steel} />
      <Cylinder radius={0.095} length={0.16} material={M.brass} />
      {Array.from({ length: 30 }, (_, i) => (
        <Box
          key={i}
          size={[0.01, 0.006, 0.085]}
          position={[-1.015 + i * 0.07, 0.028, 0]}
          material={M.gold}
        />
      ))}
      <Screw axis="y" position={[0, 0.1, 0]} />
    </>
  );
}
function Sliders({ sim }: { sim: Simulation }) {
  const left = useRef<THREE.Group>(null),
    right = useRef<THREE.Group>(null);
  useFrame(() => {
    if (left.current) left.current.position.x = -sim.radius;
    if (right.current) right.current.position.x = sim.radius;
  });
  return (
    <>
      {[left, right].map((r, i) => (
        <group key={i} ref={r}>
          <Box size={[0.15, 0.21, 0.17]} material={M.bronze} />
          <Box
            size={[0.18, 0.04, 0.2]}
            position={[0, -0.1, 0]}
            material={M.gold}
          />
          <Screw axis="y" position={[0, 0.125, 0]} />
          <Ring
            radius={0.042}
            tube={0.012}
            position={[0, -0.18, 0]}
            material={M.iron}
          />
          <Cylinder
            radius={0.105}
            length={0.17}
            position={[0, -0.31, 0]}
            material={M.bronze}
          />
          <Cylinder
            radius={0.12}
            length={0.035}
            position={[0, -0.4, 0]}
            material={M.gold}
          />
        </group>
      ))}
    </>
  );
}
function Bell() {
  const g = useMemo(() => bellGeometry(), []);
  return (
    <>
      <mesh geometry={g} material={M.bronze} castShadow receiveShadow />
      {[0.02, 0.1].map((y) => (
        <Ring
          key={y}
          radius={0.56}
          tube={0.015}
          position={[0, y, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={M.brass}
        />
      ))}
      <Ring
        radius={0.085}
        tube={0.023}
        position={[0, 0.79, 0]}
        material={M.bronze}
      />
      <Ring
        radius={0.085}
        tube={0.023}
        position={[0, 0.79, 0]}
        rotation={[0, Math.PI / 2, 0]}
        material={M.bronze}
      />
    </>
  );
}
function BellSupport() {
  const pts = Array.from(
    { length: 25 },
    (_, i) =>
      new THREE.Vector3(
        Math.cos((i / 24) * Math.PI) * 0.73,
        Math.sin((i / 24) * Math.PI) * 0.92,
        0,
      ),
  );
  const geo = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(pts),
        24,
        0.028,
        8,
        false,
      ),
    [],
  );
  return (
    <>
      <Rod
        from={[0, 7.44, -0.91]}
        to={[0, 7.44, 0.21]}
        radius={0.025}
        material={M.iron}
      />
      {[-0.56, 0.56].map((z) => (
        <group key={z}>
          <mesh
            geometry={geo}
            position={[0, 6.52, z - 0.35]}
            material={M.iron}
          />
          {[-0.73, 0.73].map((x) => (
            <Cylinder
              key={x}
              radius={0.03}
              length={0.28}
              position={[x, 6.38, z - 0.35]}
              material={M.iron}
            />
          ))}
        </group>
      ))}
    </>
  );
}
function Hammer({ sim }: { sim: Simulation }) {
  const lift = useRef<THREE.Group>(null);
  useFrame(() => {
    if (lift.current) lift.current.position.y = sim.hammer * 0.12;
  });
  return (
    <>
      <group ref={lift}>
        <Rod
          from={[0, -0.84, 1.12]}
          to={[-0.12, 0.3, 0]}
          material={M.iron}
          radius={0.016}
        />
        <Cylinder
          radius={0.065}
          length={0.06}
          axis="z"
          position={[-0.12, -0.84, 1.12]}
          material={M.steel}
        />
        <Rod
          from={[0, -0.84, 1.12]}
          to={[-0.12, -0.84, 1.12]}
          material={M.iron}
          radius={0.018}
        />
      </group>
      <group position={[0, 0.22, 0]}>
        <Moving sim={sim} field="hammer">
          <Rod
            from={[0, 0, 0]}
            to={[-0.24, 0.42, 0]}
            radius={0.025}
            material={M.steel}
          />
          <Cylinder
            radius={0.085}
            length={0.17}
            axis="x"
            position={[-0.24, 0.42, 0]}
            material={M.iron}
          />
        </Moving>
      </group>
      <Box
        size={[0.08, 0.22, 0.1]}
        position={[0, 0.32, -0.1]}
        material={M.bronze}
      />
      <Cylinder
        radius={0.065}
        length={0.16}
        position={[0, 0.22, 0]}
        axis="z"
        material={M.bronze}
      />
    </>
  );
}

function Environment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04);
    scene.environment = env.texture;
    scene.environmentIntensity = 0.38;
    return () => {
      scene.environment = null;
      env.dispose();
      room.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}
function Director({ options }: { options: ExhibitOptions }) {
  const { camera, controls } = useThree();
  const target = useRef(new THREE.Vector3(0, 3.55, 0));
  const dest = useRef(new THREE.Vector3(8.8, 7.2, 13.1));
  const moving = useRef(true);
  useEffect(() => {
    const preset = options.camera.preset;
    const aim = new THREE.Vector3(0, 3.55, 0);
    let pos: [number, number, number] = [8.8, 7.2, 13.1];
    if (preset === "front") pos = [0, 4.1, 15.3];
    if (preset === "side") pos = [15.3, 4.4, 0];
    if (preset === "rear") pos = [0, 4.8, -15.3];
    if (preset === "top") pos = [0.01, 18, 0.01];
    if (preset === "focus" && options.selected) {
      aim.set(...byId[options.selected].position);
      if (options.mode === "exploded")
        aim.add(new THREE.Vector3(...byId[options.selected].explode));
      pos = [aim.x + 3, aim.y + 1.6, aim.z + 4.2];
    }
    if (options.mode === "exploded" && preset === "home") pos = [11.5, 9, 16.8];
    dest.current.set(...pos);
    target.current.copy(aim);
    moving.current = true;
  }, [options.camera, options.mode]);
  useFrame((_, dt) => {
    const c = controls as unknown as {
      target: THREE.Vector3;
      update: () => void;
    } | null;
    if (!moving.current || !c) return;
    camera.position.lerp(dest.current, 1 - Math.exp(-dt * 5));
    c.target.lerp(target.current, 1 - Math.exp(-dt * 5));
    c.update();
    if (camera.position.distanceTo(dest.current) < 0.015) {
      moving.current = false;
    }
  });
  return null;
}
function Assembly({ options, sim, onSelect, onReady, onMetrics }: Props) {
  const resume = useRef(true);
  const count = useRef(0);
  const elapsed = useRef(0);
  const metrics = useRef(0);
  const { gl, scene, camera, size } = useThree();
  useEffect(() => {
    const debugWindow = window as typeof window & {
      __wadokeiScene?: () => unknown;
    };
    debugWindow.__wadokeiScene = () => {
      const parts = Object.keys(byId).flatMap((id) => {
        const names =
          id === "panels"
            ? ["panels-right", "panels-left", "panels-rear"]
            : [id];
        return names.map((name) => {
          const object = scene.getObjectByName(name);
          if (!object) return { name, missing: true };
          let meshes = 0,
            opacity = 1;
          object.traverse((o) => {
            if (o instanceof THREE.Mesh) {
              meshes++;
              opacity = (o.material as THREE.Material).opacity;
            }
          });
          return {
            name,
            visible: object.visible,
            position: object.position.toArray(),
            rotation: object.children[0]?.rotation.toArray(),
            meshes,
            opacity,
          };
        });
      });
      const projected = Object.fromEntries(
        Object.entries(byId).map(([id, c]) => {
          const v = new THREE.Vector3(...c.position).project(camera);
          return [
            id,
            [((v.x + 1) / 2) * size.width, ((-v.y + 1) / 2) * size.height],
          ];
        }),
      );
      const gears: Array<{ name: string; teeth: number; role: string }> = [];
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh && o.userData.teeth)
          gears.push({
            name: o.name,
            teeth: o.userData.teeth,
            role: o.userData.role,
          });
      });
      return {
        parts,
        gears,
        camera: camera.position.toArray(),
        projected,
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
      };
    };
    return () => {
      delete debugWindow.__wadokeiScene;
    };
  }, [scene, camera, gl, size]);
  useEffect(() => {
    const changed = () => {
      resume.current = true;
    };
    document.addEventListener("visibilitychange", changed);
    onReady();
    return () => document.removeEventListener("visibilitychange", changed);
  }, []);
  useFrame((_, dt) => {
    if (resume.current) {
      resume.current = false;
    } else advance(sim, dt);
    count.current++;
    elapsed.current += dt;
    metrics.current += dt;
    if (metrics.current > 0.8) {
      onMetrics(
        Math.round(count.current / elapsed.current),
        gl.info.render.triangles,
      );
      count.current = 0;
      elapsed.current = 0;
      metrics.current = 0;
    }
  }, -2);
  const shared = { options, onSelect };
  return (
    <>
      <Part id="stand" position={[0, 0, 0]} {...shared}>
        <StaticBatch>
          <Stand />
        </StaticBatch>
      </Part>
      <Part id="frame" position={[0, 0, 0]} {...shared}>
        <StaticBatch>
          <Frame />
          <BellSupport />
        </StaticBatch>
      </Part>
      {[-1, 1].map((s) => (
        <Part
          key={s}
          id="panels"
          suffix={s === 1 ? "-right" : "-left"}
          position={[s * 1.18, 4.97, 0]}
          explode={[s * 2, 0.1, 0]}
          {...shared}
        >
          <StaticBatch>
            <Shutter />
          </StaticBatch>
        </Part>
      ))}
      <Part
        id="panels"
        suffix="-rear"
        position={[0, 4.97, -0.89]}
        explode={[0, 0, -2.2]}
        {...shared}
      >
        <group rotation={[0, Math.PI / 2, 0]}>
          <StaticBatch>
            <Shutter />
          </StaticBatch>
        </group>
      </Part>
      <Part id="dial" position={[0, 4.92, 1.01]} {...shared}>
        <Dial sim={sim} />
      </Part>
      <Part id="pointer" position={[0, 4.92, 1.15]} {...shared}>
        <Pointer />
      </Part>
      <Part id="weight" position={[-0.33, 2.1, -0.55]} {...shared} label>
        <DriveWeight sim={sim} />
      </Part>
      <Part id="drum" position={[-0.55, 4.35, -0.55]} {...shared}>
        <Drum sim={sim} />
      </Part>
      <Part id="great" position={[...ARBORS[0], 0]} {...shared} label>
        <Moving sim={sim} field="great">
          <Gear name="going-great-wheel-48" teeth={48} z={0.3} />
          <Gear
            name="dial-motion-driver-32"
            teeth={32}
            z={0.58}
            module={Math.hypot(0.55, 0.57) / 32}
          />
        </Moving>
      </Part>
      <Part id="second" position={[...ARBORS[1], 0]} {...shared} label>
        <Moving sim={sim} field="second">
          <Gear name="second-arbor-pinion-12" teeth={12} z={0.3} pinion />
          <Gear
            name="second-arbor-wheel-40"
            teeth={40}
            z={0.02}
            offset={Math.PI / 40}
          />
        </Moving>
      </Part>
      <Part id="third" position={[...ARBORS[2], 0]} {...shared}>
        <Moving sim={sim} field="third">
          <Gear name="third-arbor-pinion-10" teeth={10} z={0.02} pinion />
          <Gear name="third-arbor-wheel-36" teeth={36} z={-0.26} />
        </Moving>
      </Part>
      <Part id="escape" position={[...ARBORS[3], 0]} {...shared} label>
        <Moving sim={sim} field="escape">
          <Gear name="escape-arbor-pinion-10" teeth={10} z={-0.26} pinion />
          <group position={[0, 0, 0.48]}>
            <Crown />
          </group>
        </Moving>
      </Part>
      <Part id="bearings" position={[0, 0, 0]} {...shared}>
        <StaticBatch>
          <Bearings />
        </StaticBatch>
      </Part>
      <Part id="verge" position={[0.04, 5.97, 0.69]} {...shared}>
        <Moving sim={sim} field="foliot" axis="y">
          <Verge />
        </Moving>
      </Part>
      <Part id="foliot" position={[0.04, 6.85, 0.69]} {...shared} label>
        <Moving sim={sim} field="foliot" axis="y">
          <Foliot />
        </Moving>
      </Part>
      <Part id="sliders" position={[0.04, 6.85, 0.69]} {...shared}>
        <Moving sim={sim} field="foliot" axis="y">
          <Sliders sim={sim} />
        </Moving>
      </Part>
      <Part id="bell" position={[0, 6.56, -0.35]} {...shared} label>
        <StaticBatch>
          <Bell />
        </StaticBatch>
      </Part>
      <Part id="display" position={[0, 4.92, 0.58]} {...shared}>
        <Moving sim={sim} field="dial">
          <Gear
            name="dial-motion-wheel-32"
            teeth={32}
            module={Math.hypot(0.55, 0.57) / 32}
          />
          <Cylinder
            radius={0.04}
            length={0.74}
            axis="z"
            position={[0, 0, 0.1]}
            material={M.steel}
          />
        </Moving>
      </Part>
      <Part id="cam" position={[0, 4.92, 0.77]} {...shared}>
        <Moving sim={sim} field="dial">
          <Cylinder radius={0.22} length={0.045} axis="z" material={M.bronze} />
          <Ring radius={0.56} tube={0.034} material={M.bronze} />
          {Array.from({ length: 12 }, (_, i) => (
            <group key={i} rotation={[0, 0, (i * Math.PI) / 6]}>
              <Box
                size={[0.065, 0.16, 0.055]}
                position={[0.58, 0, 0]}
                material={M.bronze}
              />
              <Rod
                from={[0.17, 0, 0]}
                to={[0.58, 0, 0]}
                radius={0.018}
                material={M.bronze}
              />
            </group>
          ))}
        </Moving>
      </Part>
      <Part id="hammer" position={[0.79, 5.8, -0.35]} {...shared}>
        <Hammer sim={sim} />
      </Part>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.04, 0]}
        receiveShadow
      >
        <circleGeometry args={[3.6, 96]} />
        <meshStandardMaterial color="#252a25" roughness={0.92} />
      </mesh>
      <mesh position={[0, -0.045, 0]} receiveShadow>
        <cylinderGeometry args={[3.6, 3.68, 0.18, 96]} />
        <meshStandardMaterial color="#101713" metalness={0.2} roughness={0.7} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.15, 0]}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#1a201c" roughness={1} />
      </mesh>
    </>
  );
}
function WadokeiScene(props: Props) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [8.8, 7.2, 13.1], fov: 35, near: 0.1, far: 90 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      onPointerMissed={() => props.onSelect(null)}
    >
      <color attach="background" args={["#1a201c"]} />
      <fog attach="fog" args={["#1a201c", 24, 55]} />
      <Environment />
      <hemisphereLight args={["#efe5cb", "#304034", 0.7]} />
      <directionalLight
        position={[4, 10, 7]}
        intensity={3.5}
        color="#ffe7bd"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={9}
        shadow-camera-bottom={-3}
        shadow-normalBias={0.03}
        shadow-bias={-0.0001}
      />
      <directionalLight
        position={[-6, 7, -3]}
        intensity={2.1}
        color="#9daea5"
      />
      <pointLight position={[-3, 4, 5]} intensity={8} color="#f6ba75" />
      <Suspense fallback={null}>
        <Assembly {...props} />
      </Suspense>
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        target={[0, 3.9, 0]}
        minDistance={2}
        maxDistance={30}
        maxPolarAngle={Math.PI * 0.91}
        enablePan
      />
      <Director options={props.options} />
    </Canvas>
  );
}
export default memo(WadokeiScene);
