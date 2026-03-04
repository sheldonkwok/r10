import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import type { ClientToServerEvents, ServerToClientEvents } from "shared";
import { exchangeToken } from "./auth.ts";
import {
  getOrCreateHttpServer,
  getOrCreateIo,
  getOrCreateViteServer,
  saveHotData,
  swapExpressApp,
} from "./hot-reload.ts";
import { registerHandlers } from "./socket-handlers.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(__dirname, "../../client");
const clientDist = path.resolve(clientRoot, "dist");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/token", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ error: "Missing code" });
      return;
    }
    const access_token = await exchangeToken(code);
    res.json({ access_token });
  } catch {
    res.status(500).json({ error: "Token exchange failed" });
  }
});

const httpServer = getOrCreateHttpServer(import.meta.hot);
swapExpressApp(import.meta.hot, httpServer, app);

const io = getOrCreateIo<ClientToServerEvents, ServerToClientEvents>(import.meta.hot, httpServer);
io.removeAllListeners("connection");
io.on("connection", (socket) => {
  registerHandlers(io, socket);
});

app.use((_req, res, next) => {
  res.setHeader("Content-Security-Policy", "frame-ancestors https://*.discord.com https://*.discordsays.com");
  next();
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
} else {
  const viteServer = await getOrCreateViteServer(import.meta.hot, async () => {
    const { createServer: createViteServer } = await import("vite");
    return createViteServer({
      root: clientRoot,
      server: {
        middlewareMode: true,
        hmr: { clientPort: 443 },
        allowedHosts: [
          "localhost",
          "127.0.0.1",
          ".discord.com",
          ".discordsays.com",
          "shelarchy.wombat-dragon.ts.net",
        ],
      },
      appType: "spa",
    });
  });
  app.use(viteServer.middlewares);
}

const PORT = process.env.PORT ?? 3000;
if (!httpServer.listening) {
  httpServer.listen(PORT, () => {
    console.log(`Server listening on :${PORT}`);
  });
}

if (import.meta.hot) {
  saveHotData(import.meta.hot, httpServer, io, app, () => io.disconnectSockets(true));
}
