import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    proxy: {
      "/api": "http://localhost:3001",
      "/socket.io": {
        target: "http://localhost:3001",
        ws: true,
      },
    },
    headers: {
      "Content-Security-Policy": "frame-ancestors https://*.discord.com https://*.discordsays.com",
    },
    hmr: {
      clientPort: 443,
    },
    allowedHosts: ["localhost", "127.0.0.1", ".discord.com", ".discordsays.com", "shelarchy.wombat-dragon.ts.net"],
  },
});
