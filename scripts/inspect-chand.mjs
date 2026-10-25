import fs from "node:fs";
import zlib from "node:zlib";
import * as THREE from "three";
const dir = "public/models/chand-baori/";
const gltf = JSON.parse(fs.readFileSync(dir + "scene.gltf", "utf8")),
  buffer = fs.readFileSync(dir + "scene.bin");
const png = fs.readFileSync(dir + "textures/palette_baseColor.png");
const idat = [];
for (let p = 8; p < png.length; ) {
  const n = png.readUInt32BE(p);
  if (png.toString("ascii", p + 4, p + 8) === "IDAT")
    idat.push(png.subarray(p + 8, p + 8 + n));
  p += n + 12;
}
const raw = zlib.inflateSync(Buffer.concat(idat)),
  row = raw.subarray(1);
for (let i = 0; i < row.length; i++) {
  const left = i >= 4 ? row[i - 4] : 0;
  if (raw[0] === 1 || raw[0] === 4) row[i] = (row[i] + left) % 256;
  else if (raw[0] === 3) row[i] = (row[i] + Math.floor(left / 2)) % 256;
  else if (raw[0] !== 0 && raw[0] !== 2)
    throw new Error("Unexpected palette PNG filter");
}
const root = new THREE.Group();
const report = [];
const counts = new Map();
for (let mi = 0; mi < gltf.meshes.length; mi++) {
  const primitive = gltf.meshes[mi].primitives[0],
    geometry = new THREE.BufferGeometry();
  for (const [semantic, ai] of Object.entries(primitive.attributes)) {
    const a = gltf.accessors[ai],
      bv = gltf.bufferViews[a.bufferView],
      length = { VEC3: 3, VEC2: 2 }[a.type],
      array = new Float32Array(a.count * length);
    for (let i = 0; i < a.count; i++)
      for (let k = 0; k < length; k++)
        array[i * length + k] = buffer.readFloatLE(
          (bv.byteOffset ?? 0) +
            (a.byteOffset ?? 0) +
            i * (bv.byteStride ?? length * 4) +
            k * 4,
        );
    geometry.setAttribute(
      { POSITION: "position", NORMAL: "normal", TEXCOORD_0: "uv" }[semantic],
      new THREE.BufferAttribute(array, length),
    );
  }
  const ia = gltf.accessors[primitive.indices],
    ibv = gltf.bufferViews[ia.bufferView],
    ix = new Uint32Array(ia.count);
  for (let i = 0; i < ix.length; i++)
    ix[i] = buffer.readUInt32LE(
      (ibv.byteOffset ?? 0) + (ia.byteOffset ?? 0) + i * 4,
    );
  geometry.setIndex(new THREE.BufferAttribute(ix, 1));
  const mesh = new THREE.Mesh(geometry);
  mesh.name = gltf.nodes.find((n) => n.mesh === mi).name;
  root.add(mesh);
  const uv = geometry.attributes.uv,
    pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const palette = Math.min(255, Math.floor(uv.getX(i) * 256));
    const stat = counts.get(palette) ?? {
      vertices: 0,
      rgba: Array.from(row.subarray(palette * 4, palette * 4 + 4)),
      minZ: Infinity,
      maxZ: -Infinity,
    };
    stat.vertices++;
    stat.minZ = Math.min(stat.minZ, pos.getZ(i));
    stat.maxZ = Math.max(stat.maxZ, pos.getZ(i));
    counts.set(palette, stat);
  }
  report.push({
    name: mesh.name,
    vertices: pos.count,
    triangles: ix.length / 3,
    normals: geometry.attributes.normal.count,
    uv: uv.count,
  });
}
root.applyMatrix4(new THREE.Matrix4().fromArray(gltf.nodes[0].matrix));
root.updateWorldMatrix(true, true);
const bounds = new THREE.Box3().setFromObject(root);
console.log(
  JSON.stringify(
    {
      sourceMeshes: report,
      worldBounds: {
        min: bounds.min.toArray(),
        max: bounds.max.toArray(),
        size: bounds.getSize(new THREE.Vector3()).toArray(),
      },
      palette: Array.from(counts.entries()).map(([index, s]) => ({
        index,
        ...s,
      })),
      rootMatrix: gltf.nodes[0].matrix,
    },
    null,
    2,
  ),
);
