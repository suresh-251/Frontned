import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("react-datepicker")) return "vendor-datepicker";
          if (id.includes("recharts")) return "vendor-charts";
          if (id.includes("xlsx")) return "vendor-xlsx";
          if (id.includes("@microsoft/signalr")) return "vendor-signalr";
          if (id.includes("react-hot-toast") || id.includes("react-toastify")) return "vendor-toast";
          if (id.includes("lucide-react") || id.includes("react-icons") || id.includes("react-feather")) return "vendor-icons";
          if (id.includes("axios") || id.includes("jwt-decode")) return "vendor-data";
          if (id.includes("react-dom") || id.includes("react")) return "vendor-react";
        },
      },
    },
  },

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
