import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  build: { rollupOptions: { output: { manualChunks: { three: ["three"] } } } },
  server: { port: 5173, strictPort: true, proxy: { '/api/heritage': { target: 'http://127.0.0.1:8787', changeOrigin: true } } },
  preview: { proxy: { '/api/heritage': { target: 'http://127.0.0.1:8787', changeOrigin: true } } },
});
