import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, "./localhost.key")),
      cert: fs.readFileSync(path.resolve(__dirname, "./localhost.crt")),
    },
    proxy: {
      "/api": {
        target: "https://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
    hmr: {
      protocol: "wss",
      host: "localhost",
    },
  },
  base: "/",
});
