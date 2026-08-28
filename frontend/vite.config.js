import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: [".loca.lt", ".trycloudflare.com", ".ngrok-free.app", ".ngrok-free.dev"],
    hmr: false,
    proxy: { "/api": { target: "http://localhost:8080", changeOrigin: true } },
  },
  preview: { host: "0.0.0.0", port: 5173 },
});
