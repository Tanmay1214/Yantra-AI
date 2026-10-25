import * as THREE from "three";

type Shader = Parameters<THREE.MeshStandardMaterial["onBeforeCompile"]>[0];

// Presentation textures, not photographic evidence of the monument's surfaces.
// A packed, tileable map carries grain, roughness, relief and pores. It is shared
// across the three export chunks and projected in world space (their UVs only
// address a one-pixel-high palette, so ordinary tiled UV maps would stretch).
export function createHeritageTextures() {
  let state = 37021;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const lattice = new Float32Array(64 * 64);
  lattice.forEach((_, i) => {
    lattice[i] = random();
  });
  const smooth = (x: number) => x * x * (3 - 2 * x);
  const noise = (x: number, y: number) => {
    const ix = Math.floor(x),
      iy = Math.floor(y),
      fx = smooth(x - ix),
      fy = smooth(y - iy);
    const at = (a: number, b: number) =>
      lattice[(((b % 64) + 64) % 64) * 64 + (((a % 64) + 64) % 64)];
    return THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(at(ix, iy), at(ix + 1, iy), fx),
      THREE.MathUtils.lerp(at(ix, iy + 1), at(ix + 1, iy + 1), fx),
      fy,
    );
  };
  const size = 512,
    data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = x / size,
        v = y / size;
      const broad = noise(u * 8, v * 8),
        middle = noise(u * 32, v * 32),
        fine = random();
      const bedding =
        Math.sin(v * Math.PI * 32 + noise(u * 8, v * 8) * 2) * 0.5 + 0.5;
      const pore = fine > 0.985 ? 0.2 : 1;
      const height =
        0.28 * broad +
        0.27 * middle +
        0.16 * fine +
        0.08 * bedding +
        0.21 * pore;
      const i = (y * size + x) * 4;
      data[i] = Math.round(
        255 * (0.34 + broad * 0.3 + middle * 0.18 + fine * 0.1),
      );
      data[i + 1] = Math.round(255 * (0.73 + middle * 0.17 + fine * 0.08));
      data[i + 2] = Math.round(255 * height);
      data[i + 3] = Math.round(255 * (0.65 + pore * 0.35));
    }
  const surface = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  surface.name = "Procedural sandstone grain · roughness · relief";
  surface.wrapS = surface.wrapT = THREE.RepeatWrapping;
  surface.magFilter = THREE.LinearFilter;
  surface.minFilter = THREE.LinearMipmapLinearFilter;
  surface.generateMipmaps = true;
  surface.anisotropy = 4;
  surface.needsUpdate = true;

  const waterSize = 256,
    normals = new Uint8Array(waterSize * waterSize * 4);
  for (let y = 0; y < waterSize; y++)
    for (let x = 0; x < waterSize; x++) {
      const u = (x / waterSize) * Math.PI * 2,
        v = (y / waterSize) * Math.PI * 2;
      const dx =
        0.15 * Math.cos(u * 3 + v * 2) + 0.06 * Math.cos(u * 11 - v * 7);
      const dy =
        0.12 * Math.sin(v * 4 - u * 2) + 0.05 * Math.sin(v * 13 + u * 5);
      const n = new THREE.Vector3(dx, dy, 1).normalize(),
        i = (y * waterSize + x) * 4;
      normals[i] = (n.x * 0.5 + 0.5) * 255;
      normals[i + 1] = (n.y * 0.5 + 0.5) * 255;
      normals[i + 2] = (n.z * 0.5 + 0.5) * 255;
      normals[i + 3] = 255;
    }
  const waterNormal = new THREE.DataTexture(
    normals,
    waterSize,
    waterSize,
    THREE.RGBAFormat,
  );
  waterNormal.name = "Procedural continuous water ripples";
  waterNormal.wrapS = waterNormal.wrapT = THREE.RepeatWrapping;
  waterNormal.magFilter = THREE.LinearFilter;
  waterNormal.minFilter = THREE.LinearMipmapLinearFilter;
  waterNormal.generateMipmaps = true;
  waterNormal.needsUpdate = true;
  return {
    surface,
    waterNormal,
    dispose: () => {
      surface.dispose();
      waterNormal.dispose();
    },
  };
}

export function createSurfaceUniforms(surface: THREE.Texture) {
  return {
    heritageSurface: { value: surface },
    heritageStone: { value: new THREE.Color("#92794f") },
    heritagePaleStone: { value: new THREE.Color("#baa276") },
    heritageEarth: { value: new THREE.Color("#51483b") },
    heritageVegetation: { value: new THREE.Color("#727450") },
    heritageAccent: { value: new THREE.Color("#82563f") },
  };
}

export function addStoneSurface(
  shader: Shader,
  uniforms: ReturnType<typeof createSurfaceUniforms>,
) {
  Object.assign(shader.uniforms, uniforms);
  shader.vertexShader =
    "varying vec3 heritagePoint; varying vec3 heritageFace;\n" +
    shader.vertexShader;
  shader.vertexShader = shader.vertexShader.replace(
    "#include <project_vertex>",
    "#include <project_vertex>\n heritagePoint=(modelMatrix*vec4(transformed,1.0)).xyz; heritageFace=normalize(mat3(modelMatrix)*normal);",
  );
  shader.fragmentShader =
    `
    varying vec3 heritagePoint; varying vec3 heritageFace;
    uniform sampler2D heritageSurface;
    uniform vec3 heritageStone; uniform vec3 heritagePaleStone; uniform vec3 heritageEarth; uniform vec3 heritageVegetation; uniform vec3 heritageAccent;
    vec4 heritageTri(vec3 p, vec3 w) {
      return texture2D(heritageSurface,p.yz*.55)*w.x + texture2D(heritageSurface,p.xz*.55)*w.y + texture2D(heritageSurface,p.xy*.55)*w.z;
    }
    float heritageIs(float p,float target){return 1.0-step(.4,abs(p-target));}
  ` + shader.fragmentShader;
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <map_fragment>",
    `
    #include <map_fragment>
    vec3 hWeights=pow(abs(normalize(heritageFace)),vec3(5.0)); hWeights/=max(dot(hWeights,vec3(1.0)),.001);
    vec4 hGrain=heritageTri(heritagePoint,hWeights);
    float hMacro=heritageTri(heritagePoint*.137+vec3(11.9,21.6,37.2),hWeights).r;
    float hIndex=floor(vMapUv.x*256.0);
    float hEarth=clamp(heritageIs(hIndex,47.0)+heritageIs(hIndex,55.0)+step(58.5,hIndex)*(1.0-step(63.5,hIndex)),0.0,1.0);
    float hPlants=step(145.5,hIndex)*(1.0-step(151.5,hIndex));
    float hMoss=heritageIs(hIndex,142.0);
    float hPale=1.0-step(2.5,hIndex);
    float hAccent=clamp(heritageIs(hIndex,44.0)+heritageIs(hIndex,54.0),0.0,1.0);
    float hDark=heritageIs(hIndex,79.0);
    vec3 hStone=mix(heritageStone,heritagePaleStone,hPale);
    hStone=mix(hStone,heritageAccent,hAccent);
    hStone=mix(hStone,heritageVegetation,hPlants*.8+hMoss*.9);
    hStone=mix(hStone,heritageEarth*(.95+.025*sin(heritagePoint.y*.8+hGrain.r*3.0)),hEarth);
    hStone=mix(hStone,heritageEarth*.62,hDark);
    float hVariation=(.86+hGrain.r*.28)*(.92+.16*hMacro);
    float hLayer=1.0+.025*sin(heritagePoint.y*11.0+hGrain.r*3.0);
    hStone*=hVariation*hLayer*mix(.88,1.0,hGrain.a);
    diffuseColor.rgb=hStone;
  `,
  );
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <roughnessmap_fragment>",
    `
    #include <roughnessmap_fragment>
    roughnessFactor=clamp(hGrain.g+.03*hEarth,.72,.99);
  `,
  );
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <normal_fragment_maps>",
    `
    #include <normal_fragment_maps>
    vec3 hDx=dFdx(-vViewPosition),hDy=dFdy(-vViewPosition);
    vec3 hR1=cross(hDy,normal),hR2=cross(normal,hDx);float hDet=dot(hDx,hR1);
    vec3 hGradient=sign(hDet)*(dFdx(hGrain.b)*hR1+dFdy(hGrain.b)*hR2);
    normal=normalize(abs(hDet)*normal-.018*hGradient);
  `,
  );
}

export function addWaterSurface(shader: Shader) {
  shader.vertexShader = "varying vec2 heritageWaterXZ;\n" + shader.vertexShader;
  shader.vertexShader = shader.vertexShader.replace(
    "#include <project_vertex>",
    "#include <project_vertex>\n heritageWaterXZ=(modelMatrix*instanceMatrix*vec4(transformed,1.0)).xz;",
  );
  shader.fragmentShader =
    "varying vec2 heritageWaterXZ;\n" + shader.fragmentShader;
  // A continuous world projection avoids a separate ripple tile on every basin cell.
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <normal_fragment_maps>",
    THREE.ShaderChunk.normal_fragment_maps.replaceAll(
      "vNormalMapUv",
      "(heritageWaterXZ*.16)",
    ),
  );
}
