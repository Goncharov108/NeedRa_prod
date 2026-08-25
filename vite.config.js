import { defineConfig } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: ".",
  publicDir: "public",
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve(rootDir, "index.html"),
        ozon: resolve(rootDir, "analitika-ozon/index.html"),
        wb: resolve(rootDir, "analitika-wb/index.html"),
      },
    },
  },
});
