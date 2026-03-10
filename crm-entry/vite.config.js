import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    open: true,

    // ✅ ADD THIS BLOCK
    proxy: {
      "/api": {
        target: "http://89.116.20.215:9096",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});