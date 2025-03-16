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
});
