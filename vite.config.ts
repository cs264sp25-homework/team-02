import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const isProduction = process.env.NODE_ENV === "production";

// https://vite.dev/config/
export default defineConfig({
  base: isProduction ? "/team-02/" : "/", // this needs to match the repo name to work on github pages
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext", // This enables top-level await support
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        worker: path.resolve(
          __dirname,
          "src/file_upload/workers/mupdf.worker.ts",
        ),
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext", // This enables top-level await support in dev mode
    },
    exclude: ["mupdf"], // Exclude mupdf from pre-bundling
  },
  worker: {
    format: "es",
  },
});
