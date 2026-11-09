import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Build jednego pliku HTML (do podglądu jako artifact / wysłania linkiem).
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { outDir: "dist-single" },
});
