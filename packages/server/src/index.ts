import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { ClientToServerEvents, ServerToClientEvents } from "shared";
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

const httpServer = createServer(app);

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
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    root: clientRoot,
    server: {
      middlewareMode: true,
      hmr: { clientPort: 443 },
      allowedHosts: ["localhost", "127.0.0.1", ".discord.com", ".discordsays.com", "shelarchy.wombat-dragon.ts.net"],
    },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

const PORT = process.env.PORT ?? 3000;
httpServer.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
});
