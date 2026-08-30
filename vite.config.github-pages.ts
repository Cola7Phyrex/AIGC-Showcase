import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const basePath = process.env.PAGES_BASE_PATH || "/";

export default defineConfig({
  root: "github-pages",
  base: basePath,
  publicDir: "../public",
  plugins: [react()],
  build: {
    outDir: "../dist-github-pages",
    emptyOutDir: true,
  },
});
