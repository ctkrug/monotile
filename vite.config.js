import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset paths so the built site works when hosted from any
  // subpath (e.g. apps.charliekrug.com/monotile), not just the domain root.
  base: "",
  build: {
    outDir: "dist",
  },
  test: {
    environment: "node",
  },
});
