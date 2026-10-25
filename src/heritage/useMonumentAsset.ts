import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { inspectAsset, type AssetInfo } from "./assetGeometry";
export function useMonumentAsset() {
  const [asset, setAsset] = useState<THREE.Group | null>(null),
    [info, setInfo] = useState<AssetInfo | null>(null);
  const [status, setStatus] = useState(
      "Loading the monument and its textures…",
    ),
    [loading, setLoading] = useState(true);
  const current = useRef<THREE.Group | null>(null);
  function dispose(root: THREE.Group | null) {
    root?.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          for (const v of Object.values(m))
            if (v instanceof THREE.Texture) v.dispose();
          m.dispose();
        }
      }
    });
  }
  function install(root: THREE.Group, file: string) {
    const inspection = inspectAsset(root, file);
    dispose(current.current);
    current.current = root;
    setAsset(root);
    setInfo(inspection);
    setStatus(
      `Loaded ${inspection.meshes.length} mesh(es). Scale is illustrative; review geometry before interpreting spatial results.`,
    );
  }
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const url = "/models/chand-baori/scene.gltf";
        const r = await fetch(url);
        if (
          !r.ok ||
          (!(r.headers.get("content-type") ?? "").includes("json") &&
            !(await r.clone().text()).trimStart().startsWith("{"))
        )
          throw new Error("missing");
        const missing: string[] = [];
        const manager = new THREE.LoadingManager();
        manager.onError = (failed) => missing.push(failed);
        const gltf = await new GLTFLoader(manager).loadAsync(url);
        if (missing.length) {
          dispose(gltf.scene);
          throw new Error(`Missing textures or buffers: ${missing.join(", ")}`);
        }
        if (mounted) install(gltf.scene, url);
        else dispose(gltf.scene);
      } catch {
        if (mounted)
          setStatus(
            "The installed monument or its textures could not be loaded. Reload the exhibit to try again.",
          );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      dispose(current.current);
    };
  }, []);
  return { asset, info, status, loading };
}
