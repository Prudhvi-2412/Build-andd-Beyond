// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy all /api, /login, /signup, /session, etc. to backend
      "/login": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/signup": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/session": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/logout": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      // Or better: proxy ALL /api and auth routes
      "^/(api|login|signup|session|logout)/.*": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});