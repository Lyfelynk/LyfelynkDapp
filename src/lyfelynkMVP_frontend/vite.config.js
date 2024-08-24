import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import environment from "vite-plugin-environment";

dotenv.config({ path: "../../.env" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    react(),
    environment("all", { prefix: "CANISTER_" }),
    environment("all", { prefix: "DFX_" }),
  ],
  build: {
    emptyOutDir: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
  define: {
    "process.env.DFX_NETWORK": JSON.stringify(process.env.DFX_NETWORK),
    "process.env.CANISTER_ID_INTERNET_IDENTITY": JSON.stringify(
      process.env.CANISTER_ID_INTERNET_IDENTITY,
    ),
    "process.env.CANISTER_ID_USER": JSON.stringify(
      process.env.CANISTER_ID_USER,
    ),
    "process.env.CANISTER_ID_PROFESSIONAL": JSON.stringify(
      process.env.CANISTER_ID_PROFESSIONAL,
    ),
    "process.env.CANISTER_ID_FACILITY": JSON.stringify(
      process.env.CANISTER_ID_FACILITY,
    ),
    "process.env.CANISTER_ID_DATAASSET": JSON.stringify(
      process.env.CANISTER_ID_DATAASSET,
    ),
    "process.env.II_URL": JSON.stringify(
      process.env.DFX_NETWORK === "local"
        ? `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943/`
        : "https://identity.ic0.app/",
    ),
  },
  resolve: {
    alias: [
      {
        find: "@",
        replacement: path.resolve(__dirname, "./src"),
      },
      {
        find: "declarations",
        replacement: fileURLToPath(new URL("../declarations", import.meta.url)),
      },
    ],
  },
});
