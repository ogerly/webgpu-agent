import { defineConfig } from "vite";

/**
 * Local-first (WH-001 Invariant): kein Build-/Cloud-Laufzeitbedarf.
 * - `base: "./"` → relative Pfade, läuft auch statisch (Filesystem / Simple-Hosting).
 * - Vite dient nur Dev/HMR + Build; zur Laufzeit ist alles im Browser (WebGPU).
 */
export default defineConfig({
  base: "./",
  server: { port: 5173 },
  build: { target: "es2022" },
});
