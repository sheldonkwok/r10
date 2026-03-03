import type { Server as HttpServer } from "node:http";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import type { ClientToServerEvents, ServerToClientEvents } from "shared";
import { Server } from "socket.io";
import { exchangeToken } from "./auth.ts";
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

// Reuse HTTP server across hot reloads to avoid EADDRINUSE.
// On first boot, hot.data.httpServer is undefined so we create one.
// On subsequent reloads, we reuse the existing server and just swap handlers.
const httpServer: HttpServer = (import.meta.hot?.data.httpServer as HttpServer | undefined) ?? createServer();
httpServer.removeAllListeners("request");
httpServer.removeAllListeners("upgrade");
httpServer.on("request", app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: "*" },
});

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
  type ViteDevServer = import("vite").ViteDevServer;
  let viteServer = import.meta.hot?.data.viteServer as ViteDevServer | undefined;
  if (!viteServer) {
    const { createServer: createViteServer } = await import("vite");
    viteServer = await createViteServer({
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
    if (import.meta.hot) {
      import.meta.hot.data.viteServer = viteServer;
    }
  }
  app.use(viteServer.middlewares);
}

const PORT = process.env.PORT ?? 3000;
if (!httpServer.listening) {
  httpServer.listen(PORT, () => {
    console.log(`Server listening on :${PORT}`);
  });
}

if (import.meta.hot) {
  import.meta.hot.data.httpServer = httpServer;
  import.meta.hot.dispose(() => {
    io.disconnectSockets(true);
  });
}
