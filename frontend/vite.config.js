// vite.config.js
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_URL || "http://localhost:3000";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        // Proxy all /api, /login, /signup, /session, etc. to backend
        "/login": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        "/signup": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        "/session": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        "/logout": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        // Or better: proxy ALL /api and auth routes
        "^/(api|login|signup|session|logout)/.*": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});