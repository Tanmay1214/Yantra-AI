import { useEffect, useMemo, useRef } from "react";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  type Conditions,
  surfaceTemperature,
  temperature,
} from "./environment";
import { basinMask, rasterize } from "./assetGeometry";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  addStoneSurface,
  addWaterSurface,
  createHeritageTextures,
  createSurfaceUniforms,
} from "./heritageMaterials";
export type ViewMode =
  | "Explore"
  | "Water"
  | "Temperature"
  | "Cross-section"
  | "Environmental"
  | "Architecture";
export type CameraPreset =
  | "Overview"
  | "Front"
  | "Top"
  | "Interior"
  | "Lower levels";
export interface Selection {
  name: string;
  elevation: number;
  position: number[];
}
interface Props {
  asset: THREE.Group | null;
  conditions: Conditions;
  mode: ViewMode;
  preset: { name: CameraPreset; version: number };
  onSelect: (s: Selection) => void;
  onArea: (area: number | null) => void;
}
const color = (t: number) => new THREE.Color().setRGB(...thermalRGB(t));
export function thermalRGB(t: number): [number, number, number] {
  const u = Math.max(0, Math.min(1, (t - 15) / 35));
  return u < 0.5
    ? [0.16 + u * 1.5, 0.58 + u * 0.45, 0.75 - u * 0.9]
    : [0.91, 0.805 - (u - 0.5) * 1.02, 0.3 - (u - 0.5) * 0.3];
}
function CameraDirector({
  preset,
  width,
  depth,
  lower,
}: {
  preset: Props["preset"];
  width: number;
  depth: number;
  lower: [number, number, number];
}) {
  const { camera, controls, size } = useThree();
  const target = useRef(new THREE.Vector3()),
    dest = useRef(new THREE.Vector3());
  const moving = useRef(true);
  useEffect(() => {
    const w =
        Math.max(width, depth * 1.5) *
        Math.max(1, 0.95 / (size.width / size.height)),
      p = preset.name;
    dest.current.fromArray(
      p === "Top"
        ? [0, w * 1.4, 0.001]
        : p === "Front"
          ? [0, w * 0.25, w * 1.5]
          : p === "Interior"
            ? [w * 0.22, -depth * 0.15, w * 0.35]
            : p === "Lower levels"
              ? [w * 0.1, -depth * 0.65, w * 0.15]
              : [w, w * 0.65, w],
    );
    target.current.set(0, -depth * 0.35, 0);
    if (p === "Lower levels") {
      dest.current.set(lower[0], lower[1] + depth * 0.58, lower[2] + 0.3);
      target.current.fromArray(lower);
    }
    if (p === "Interior") {
      dest.current.set(lower[0], lower[1] + depth * 0.95, lower[2] + 0.3);
      target.current.fromArray(lower);
    }
    moving.current = true;
  }, [preset, width, depth, size.width, size.height, lower]);
  useFrame((_, dt) => {
    if (!moving.current || !controls) return;
    const c = controls as unknown as {
      target: THREE.Vector3;
      update: () => void;
    };
    camera.position.lerp(dest.current, 1 - Math.exp(-dt * 4));
    c.target.lerp(target.current, 1 - Math.exp(-dt * 4));
    c.update();
    if (camera.position.distanceTo(dest.current) < 0.03) moving.current = false;
  });
  return null;
}
function SceneContent({
  asset,
  conditions: c,
  mode,
  preset,
  onSelect,
  onArea,
}: Props) {
  const { gl, camera } = useThree();
  const surfaceTextures = useMemo(createHeritageTextures, []);
  const surfaceUniforms = useMemo(
    () => createSurfaceUniforms(surfaceTextures.surface),
    [surfaceTextures],
  );
  useEffect(() => () => surfaceTextures.dispose(), [surfaceTextures]);
  const prepared = useMemo(() => {
    if (!asset) return null;
    const clone = asset.clone(true),
      box = new THREE.Box3().setFromObject(clone),
      size = box.getSize(new THREE.Vector3());
    const scale = c.maxDepth / size.y;
    const holder = new THREE.Group();
    holder.add(clone);
    clone.position.sub(
      new THREE.Vector3(
        (box.min.x + box.max.x) / 2,
        box.max.y,
        (box.min.z + box.max.z) / 2,
      ),
    );
    holder.scale.setScalar(scale);
    holder.updateWorldMatrix(true, true);
    const originals: { mesh: THREE.Mesh; materials: THREE.Material[] }[] = [];
    clone.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        const mats = (
          Array.isArray(o.material) ? o.material : [o.material]
        ).map((m) => {
          const copy = m.clone();
          // The inspected Chand Baori palette uses only alpha=255. Its BLEND export caused sorting holes.
          // Change only display copies, and only for the identified palette material.
          if (copy.name === "palette") {
            copy.transparent = false;
            copy.depthWrite = true;
          }
          return copy;
        });
        o.material = mats.length === 1 ? mats[0] : mats;
        o.castShadow = true;
        o.receiveShadow = true;
        originals.push({ mesh: o, materials: mats });
      }
    });
    const field = rasterize(holder);
    let basinFloor = 0;
    for (let z = Math.floor(field.n * 0.2); z < field.n * 0.8; z++)
      for (let x = Math.floor(field.n * 0.2); x < field.n * 0.8; x++) {
        const h = field.values[z * field.n + x];
        if (Number.isFinite(h)) basinFloor = Math.min(basinFloor, h);
      }
    // Study depth ends at the lowest exposed central source surface, not the underside of the soil block.
    const correction = basinFloor < -0.001 ? c.maxDepth / -basinFloor : 1;
    holder.scale.multiplyScalar(correction);
    holder.updateWorldMatrix(true, true);
    field.width *= correction;
    field.length *= correction;
    for (let i = 0; i < field.values.length; i++) field.values[i] *= correction;
    return {
      root: holder,
      field,
      originals,
      width: Math.max(size.x, size.z) * scale * correction,
      baseY: -c.maxDepth * correction,
    };
  }, [asset, c.maxDepth]);
  useEffect(
    () => () => {
      prepared?.originals.forEach((o) =>
        o.materials.forEach((m) => m.dispose()),
      );
    },
    [prepared],
  );
  const selectedMode = mode === "Temperature" || mode === "Environmental";
  const waterMode =
    mode === "Water" || mode === "Environmental" || mode === "Cross-section";
  const mask = useMemo(
    () => (prepared ? basinMask(prepared.field, c.waterLevel) : []),
    [prepared, c.waterLevel],
  );
  const maskTexture = useMemo(() => {
    const n = prepared?.field.n ?? 1,
      data = new Uint8Array(n * n);
    mask.forEach((i) => {
      data[i] = 255;
    });
    const t = new THREE.DataTexture(data, n, n, THREE.RedFormat);
    t.needsUpdate = true;
    return t;
  }, [mask, prepared]);
  useEffect(() => () => maskTexture.dispose(), [maskTexture]);
  const uniforms = useMemo(
    () => ({
      studySurface: { value: surfaceTemperature(c) },
      studyDeep: { value: c.deep },
      studyL: { value: c.lengthScale },
      studyWater: { value: c.waterLevel },
      studyDepth: { value: c.maxDepth },
    }),
    [],
  );
  const basinUniforms = useMemo(
    () => ({
      studyMask: { value: maskTexture },
      studySize: { value: new THREE.Vector2(1, 1) },
    }),
    [],
  );
  useEffect(() => {
    basinUniforms.studyMask.value = maskTexture;
    basinUniforms.studySize.value.set(
      prepared?.field.width ?? 1,
      prepared?.field.length ?? 1,
    );
  }, [maskTexture, prepared, basinUniforms]);
  useEffect(() => {
    uniforms.studySurface.value = surfaceTemperature(c);
    uniforms.studyDeep.value = c.deep;
    uniforms.studyL.value = c.lengthScale;
    uniforms.studyWater.value = c.waterLevel;
    uniforms.studyDepth.value = c.maxDepth;
  }, [c, uniforms]);
  useEffect(() => {
    if (!prepared) return;
    const plane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
    for (const record of prepared.originals)
      for (const mat of record.materials) {
        mat.clippingPlanes = mode === "Cross-section" ? [plane] : [];
        mat.clipShadows = true;
        mat.onBeforeCompile = (shader) => {
          if (mat.name === "palette" && "map" in mat && mat.map)
            addStoneSurface(shader, surfaceUniforms);
          Object.assign(shader.uniforms, uniforms, basinUniforms);
          shader.vertexShader =
            "varying float studyY; varying vec2 studyXZ;\n" +
            shader.vertexShader;
          shader.vertexShader = shader.vertexShader.replace(
            "#include <project_vertex>",
            "#include <project_vertex>\n vec3 studyWorld = (modelMatrix * vec4(transformed, 1.0)).xyz; studyY=studyWorld.y; studyXZ=studyWorld.xz;",
          );
          shader.fragmentShader =
            "varying float studyY; varying vec2 studyXZ; uniform sampler2D studyMask; uniform vec2 studySize; uniform float studySurface; uniform float studyDeep; uniform float studyL; uniform float studyWater; uniform float studyDepth;\n" +
            shader.fragmentShader;
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <color_fragment>",
            `#include <color_fragment>\n ${selectedMode ? "float temp = studyDeep + (studySurface-studyDeep)*exp(-clamp(-studyY,0.0,studyDepth)/studyL); float u=clamp((temp-15.0)/35.0,0.0,1.0); vec3 cold=vec3(.16,.58,.75); vec3 mid=vec3(.91,.805,.30); vec3 hot=vec3(.91,.295,.15); diffuseColor.rgb=mix(diffuseColor.rgb,u<.5?mix(cold,mid,u*2.0):mix(mid,hot,(u-.5)*2.0),.82);" : waterMode ? "if(texture2D(studyMask,studyXZ/studySize+0.5).r>.5){if(studyY < studyWater) diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.08,.4,.44),.42); if(abs(studyY-studyWater)<.12) diffuseColor.rgb=vec3(.45,.87,.83);}" : ""}`,
          );
        };
        mat.customProgramCacheKey = () =>
          JSON.stringify(["heritage-surfaces-v1", selectedMode, waterMode]);
        mat.needsUpdate = true;
      }
  }, [
    prepared,
    mode,
    selectedMode,
    waterMode,
    uniforms,
    basinUniforms,
    surfaceUniforms,
  ]);
  useEffect(() => {
    onArea(
      prepared && mask.length
        ? (mask.length * prepared.field.width * prepared.field.length) /
            prepared.field.n ** 2
        : null,
    );
  }, [mask, prepared, onArea]);
  const waterRef = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    if (!prepared || !waterRef.current) return;
    const { field } = prepared;
    const dummy = new THREE.Object3D();
    mask.forEach((i, k) => {
      dummy.position.set(
        (((i % field.n) + 0.5) / field.n - 0.5) * field.width,
        0,
        ((Math.floor(i / field.n) + 0.5) / field.n - 0.5) * field.length,
      );
      dummy.rotation.x = -Math.PI / 2;
      dummy.scale.set(field.width / field.n, field.length / field.n, 1);
      dummy.updateMatrix();
      waterRef.current!.setMatrixAt(k, dummy.matrix);
    });
    waterRef.current.count = mask.length;
    waterRef.current.instanceMatrix.needsUpdate = true;
  }, [mask, prepared, waterMode]);
  const waterY = useRef(c.waterLevel);
  const metrics = useRef({ frames: 0, elapsed: 0, fps: 0 });
  useFrame((_, dt) => {
    waterY.current = THREE.MathUtils.damp(
      waterY.current,
      c.waterLevel,
      10,
      Math.min(dt, 0.1),
    );
    if (waterRef.current) waterRef.current.position.y = waterY.current;
    metrics.current.frames++;
    metrics.current.elapsed += dt;
    if (metrics.current.elapsed > 1) {
      metrics.current.fps = Math.round(
        metrics.current.frames / metrics.current.elapsed,
      );
      metrics.current.elapsed = 0;
      metrics.current.frames = 0;
    }
  });
  useEffect(() => {
    gl.localClippingEnabled = true;
    return () => {
      gl.localClippingEnabled = false;
    };
  }, [gl]);
  useEffect(() => {
    const w = window as unknown as { __chandScene?: () => unknown };
    w.__chandScene = () => ({
      assetLoaded: !!prepared,
      mode,
      waterY: waterY.current,
      maskCells: mask.length,
      triangles: gl.info.render.triangles,
      drawCalls: gl.info.render.calls,
      fps: metrics.current.fps,
      finish: "stone",
      surfaceTextureSize: surfaceTextures.surface.image.width,
      geometryCount: gl.info.memory.geometries,
      textureCount: gl.info.memory.textures,
      camera: camera.position.toArray(),
      sourceMeshes: prepared?.originals.map((r) => ({
        name: r.mesh.name,
        clipped: !!r.materials[0].clippingPlanes?.length,
        transparent: r.materials[0].transparent,
      })),
    });
    return () => {
      delete w.__chandScene;
    };
  }, [prepared, mode, mask, gl, camera, surfaceUniforms, surfaceTextures]);
  function pick(e: ThreeEvent<MouseEvent>) {
    if (e.delta > 4) return;
    e.stopPropagation();
    onSelect({
      name: e.object.name || "Combined architectural mesh",
      elevation: e.point.y,
      position: e.point.toArray(),
    });
  }
  const width = prepared?.width ?? 35;
  const lightTarget = useMemo(() => {
    const target = new THREE.Object3D();
    target.position.set(0, -c.maxDepth * 0.4, 0);
    return target;
  }, [c.maxDepth]);
  const observationPoints = useMemo(() => {
    if (!prepared) return [];
    const { field } = prepared;
    return [0.15, 0.5, 0.85].map((f) => {
      let best = -1,
        cost = Infinity;
      for (let z = 8; z < field.n - 8; z++)
        for (let x = 8; x < field.n - 8; x++) {
          const i = z * field.n + x,
            y = field.values[i];
          if (!Number.isFinite(y)) continue;
          const score =
            Math.abs(y + c.maxDepth * f) +
            0.01 * Math.hypot(x - field.n / 2, z - field.n / 2);
          if (score < cost) {
            cost = score;
            best = i;
          }
        }
      return best < 0
        ? null
        : ([
            (((best % field.n) + 0.5) / field.n - 0.5) * field.width,
            field.values[best],
            ((Math.floor(best / field.n) + 0.5) / field.n - 0.5) * field.length,
          ] as [number, number, number]);
    });
  }, [prepared, c.maxDepth]);
  return (
    <>
      <StudioEnvironment />
      <ambientLight intensity={0.22} />
      <hemisphereLight args={["#d6ddd7", "#514333", 0.7]} />
      <primitive object={lightTarget} />
      <directionalLight
        position={[width * 0.45, width * 1.15, width * 0.65]}
        target={lightTarget}
        color="#ffe6bf"
        intensity={2.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-width * 0.78}
        shadow-camera-right={width * 0.78}
        shadow-camera-top={width * 0.78}
        shadow-camera-bottom={-width * 0.78}
        shadow-camera-near={0.5}
        shadow-camera-far={width * 5}
        shadow-bias={-0.00015}
        shadow-normalBias={0.055}
        shadow-radius={2}
      />
      <directionalLight
        position={[-width, width * 0.3, -width * 0.4]}
        color="#c9d8d9"
        intensity={0.45}
      />
      <CameraDirector
        preset={preset}
        width={width}
        depth={c.maxDepth}
        lower={observationPoints[2] ?? [0, -c.maxDepth * 0.75, 0]}
      />
      {prepared && <primitive object={prepared.root} onClick={pick} />}
      {prepared && waterMode && (
        <instancedMesh
          ref={waterRef}
          args={[undefined, undefined, 4096]}
          frustumCulled={false}
          renderOrder={2}
        >
          <planeGeometry />
          <meshPhysicalMaterial
            color="#477c79"
            roughness={0.19}
            metalness={0}
            ior={1.333}
            envMapIntensity={0.65}
            clearcoat={0.45}
            clearcoatRoughness={0.2}
            normalMap={surfaceTextures.waterNormal}
            normalScale={new THREE.Vector2(0.38, 0.38)}
            onBeforeCompile={addWaterSurface}
            transparent
            opacity={0.48}
            side={THREE.DoubleSide}
            depthWrite={false}
            clippingPlanes={
              mode === "Cross-section"
                ? [new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0)]
                : []
            }
          />
        </instancedMesh>
      )}
      <group
        position={[-width * 0.6, 0, 0]}
        visible={selectedMode || mode === "Cross-section" || !prepared}
      >
        {Array.from({ length: 48 }, (_, i) => (
          <mesh key={i} position={[0, (-c.maxDepth * (i + 0.5)) / 48, 0]}>
            <boxGeometry args={[0.65, c.maxDepth / 48, 0.65]} />
            <meshStandardMaterial
              color={color(temperature(c, (c.maxDepth * (i + 0.5)) / 48))}
            />
          </mesh>
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <Html
            key={f}
            position={[-1, -c.maxDepth * f, 0]}
            center
            className="depth-label"
            style={{
              display:
                selectedMode || mode === "Cross-section" || !prepared
                  ? "block"
                  : "none",
            }}
          >
            {(c.maxDepth * f).toFixed(0)} m ·{" "}
            {temperature(c, c.maxDepth * f).toFixed(1)}°
          </Html>
        ))}
      </group>
      {prepared &&
        observationPoints.map(
          (p, i) =>
            p && (
              <Html
                key={i}
                position={[p[0], p[1] + 0.2, p[2]]}
                center
                style={{
                  display:
                    mode === "Architecture" || mode === "Environmental"
                      ? "block"
                      : "none",
                }}
              >
                <button
                  className="zone-marker"
                  onClick={() =>
                    onSelect({
                      name: [
                        "Upper source-surface zone",
                        "Mid-depth source-surface zone",
                        "Lower source-surface zone",
                      ][i],
                      elevation: p[1],
                      position: p,
                    })
                  }
                >
                  {i + 1} · {(-p[1]).toFixed(1)} m
                </button>
              </Html>
            ),
        )}
      <gridHelper
        args={[width * 1.6, 20, "#66665b", "#393e3b"]}
        position={[0, (prepared?.baseY ?? -c.maxDepth) - 0.15, 0]}
        visible={mode === "Cross-section" || mode === "Environmental"}
      />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, (prepared?.baseY ?? -c.maxDepth) - 0.25, 0]}
        receiveShadow
      >
        <planeGeometry args={[width * 3, width * 3]} />
        <meshStandardMaterial color="#252620" roughness={1} />
      </mesh>
      <OrbitControls
        makeDefault
        enableDamping
        minDistance={2}
        maxDistance={width * 5}
        maxPolarAngle={Math.PI * 0.95}
      />
    </>
  );
}
export default function HeritageScene(props: Props) {
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 1.5]}
      camera={{ position: [40, 30, 40], near: 0.1, far: 1000, fov: 43 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#1c211e"]} />
      <SceneContent {...props} />
    </Canvas>
  );
}
function StudioEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl),
      room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04);
    const prior = scene.environment,
      priorIntensity = scene.environmentIntensity;
    scene.environment = env.texture;
    scene.environmentIntensity = 0.3;
    return () => {
      scene.environment = prior;
      scene.environmentIntensity = priorIntensity;
      env.dispose();
      room.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}
