import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";
import type { ClientToServerEvents, ServerToClientEvents } from "shared";
import { exchangeToken } from "./auth.ts";
import { registerHandlers } from "./socket-handlers.ts";

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

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
});
