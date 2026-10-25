import * as THREE from "three";
export interface MeshRecord {
  name: string;
  vertices: number;
  triangles: number;
  materials: string[];
  position: number[];
  rotation: number[];
  scale: number[];
  normals: boolean;
}
export interface AssetInfo {
  file: string;
  meshes: MeshRecord[];
  bounds: { min: number[]; max: number[]; size: number[] };
  triangles: number;
  interpretation: string;
}
export function inspectAsset(root: THREE.Group, file: string): AssetInfo {
  root.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(root);
  const meshes: MeshRecord[] = [];
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      const g = o.geometry;
      meshes.push({
        name: o.name || `mesh-${meshes.length}`,
        vertices: g.attributes.position?.count ?? 0,
        triangles: (g.index?.count ?? g.attributes.position?.count ?? 0) / 3,
        materials: (Array.isArray(o.material) ? o.material : [o.material]).map(
          (m) => m.name || m.type,
        ),
        position: o.position.toArray(),
        rotation: [o.rotation.x, o.rotation.y, o.rotation.z],
        scale: o.scale.toArray(),
        normals: !!g.attributes.normal,
      });
    }
  });
  if (
    box.isEmpty() ||
    !Number.isFinite(box.max.y) ||
    box.max.y <= box.min.y ||
    box.max.x <= box.min.x ||
    box.max.z <= box.min.z
  )
    throw new Error("The model has no finite 3D bounds.");
  return {
    file,
    meshes,
    bounds: {
      min: box.min.toArray(),
      max: box.max.toArray(),
      size: box.getSize(new THREE.Vector3()).toArray(),
    },
    triangles: meshes.reduce((a, b) => a + b.triangles, 0),
    interpretation:
      "Geometry from the loaded asset. Metre scale and top datum are illustrative until externally calibrated.",
  };
}
export interface HeightField {
  n: number;
  width: number;
  length: number;
  values: Float32Array;
}
// Conservative top-envelope raster of projected source triangles; no random shapes or assumed rectangular basin.
export function rasterize(root: THREE.Group, n = 64): HeightField {
  root.updateWorldMatrix(true, true);
  const bounds = new THREE.Box3().setFromObject(root);
  const width = bounds.max.x - bounds.min.x,
    length = bounds.max.z - bounds.min.z;
  const values = new Float32Array(n * n).fill(-Infinity);
  const a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    c = new THREE.Vector3();
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const g = o.geometry,
      p = g.attributes.position,
      idx = g.index;
    for (let j = 0; j < (idx?.count ?? p.count); j += 3) {
      const vi = (offset: number) => (idx ? idx.getX(j + offset) : j + offset);
      a.fromBufferAttribute(p, vi(0)).applyMatrix4(o.matrixWorld);
      b.fromBufferAttribute(p, vi(1)).applyMatrix4(o.matrixWorld);
      c.fromBufferAttribute(p, vi(2)).applyMatrix4(o.matrixWorld);
      const den = (b.z - c.z) * (a.x - c.x) + (c.x - b.x) * (a.z - c.z);
      if (Math.abs(den) < 1e-9) continue;
      const gridX = (x: number) => ((x - bounds.min.x) / width) * n;
      const gridZ = (z: number) => ((z - bounds.min.z) / length) * n;
      const x0 = Math.max(0, Math.floor(gridX(Math.min(a.x, b.x, c.x)))),
        x1 = Math.min(n - 1, Math.ceil(gridX(Math.max(a.x, b.x, c.x))));
      const z0 = Math.max(0, Math.floor(gridZ(Math.min(a.z, b.z, c.z)))),
        z1 = Math.min(n - 1, Math.ceil(gridZ(Math.max(a.z, b.z, c.z))));
      for (let z = z0; z <= z1; z++)
        for (let x = x0; x <= x1; x++) {
          const px = bounds.min.x + ((x + 0.5) / n) * width,
            pz = bounds.min.z + ((z + 0.5) / n) * length;
          const u = ((b.z - c.z) * (px - c.x) + (c.x - b.x) * (pz - c.z)) / den;
          const v = ((c.z - a.z) * (px - c.x) + (a.x - c.x) * (pz - c.z)) / den;
          if (u >= -1e-6 && v >= -1e-6 && u + v <= 1.000001)
            values[z * n + x] = Math.max(
              values[z * n + x],
              u * a.y + v * b.y + (1 - u - v) * c.y,
            );
        }
    }
  });
  return { n, width, length, values };
}
export function basinMask(field: HeightField, elevation: number) {
  const { n, values } = field;
  let seed = -1,
    lowest = Infinity;
  for (let z = Math.floor(n * 0.2); z < n * 0.8; z++)
    for (let x = Math.floor(n * 0.2); x < n * 0.8; x++) {
      const i = z * n + x;
      if (
        Number.isFinite(values[i]) &&
        values[i] < elevation - 0.02 &&
        values[i] < lowest
      ) {
        lowest = values[i];
        seed = i;
      }
    }
  if (seed < 0) return [];
  const visited = new Set<number>([seed]),
    queue = [seed];
  let open = false;
  for (let k = 0; k < queue.length; k++) {
    const i = queue[k],
      x = i % n,
      z = Math.floor(i / n);
    if (x === 0 || z === 0 || x === n - 1 || z === n - 1) open = true;
    for (const next of [i - 1, i + 1, i - n, i + n]) {
      if (
        next < 0 ||
        next >= n * n ||
        visited.has(next) ||
        Math.abs((next % n) - x) + Math.abs(Math.floor(next / n) - z) !== 1
      )
        continue;
      if (!Number.isFinite(values[next])) {
        open = true;
        continue;
      }
      if (values[next] < elevation - 0.02) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
  // Refuse unsupported/open basins instead of drawing water outside the source architecture.
  return open ? [] : queue;
}
