import type { ClientToServerEvents, ServerToClientEvents } from "game";
import type { Server, Socket } from "socket.io";
import { avatarUrl, getDiscordUser } from "./auth.ts";
import { createGame, type Game, getGame, removeGame } from "./game.ts";
import { getOrCreateLobby, removeLobbyIfEmpty } from "./lobby.ts";

type IOServer = Server<ClientToServerEvents, ServerToClientEvents>;
type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

interface SocketMeta {
  roomId: string;
  playerId: string;
}

const socketRooms = new Map<string, SocketMeta>();

const isDev = process.env.NODE_ENV !== "production";

function sendGameStateToPlayers(io: IOServer, roomId: string, game: Game) {
  const base = game.getState();
  for (const [socketId, meta] of socketRooms) {
    if (meta.roomId !== roomId) continue;
    const filtered = game.getStateForPlayer(meta.playerId, base);
    io.to(socketId).emit("game:state", isDev ? { ...filtered, debugState: base } : filtered);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processBotTurns(io: IOServer, roomId: string, game: Game, delayMs = 100) {
  let safety = 0;
  const maxIterations = 1000;

  while (game.isCurrentPlayerBot() && safety < maxIterations) {
    safety++;
    if (game.getState().winningTeam !== null) break;
    await sleep(delayMs);
    if (getGame(roomId) !== game) break; // game was removed (reset) or replaced
    try {
      game.makeBotPlay();
      sendGameStateToPlayers(io, roomId, game);
    } catch (err) {
      console.error("Bot play error:", err);
      break;
    }
  }
}

function broadcastState(io: IOServer, roomId: string) {
  const lobby = getOrCreateLobby(roomId);
  io.to(roomId).emit("lobby:state", lobby.getState());
}

export function registerHandlers(io: IOServer, socket: IOSocket) {
  socket.on("lobby:join", async ({ roomId, token }) => {
    try {
      const user = await getDiscordUser(token);

      const existingGame = getGame(roomId);
      if (existingGame?.getPlayerIds().includes(user.id)) {
        const lobby = getOrCreateLobby(roomId);
        const oldSocketId = lobby.updateSocketId(socket.id, user.id);
        if (oldSocketId) {
          socketRooms.delete(oldSocketId);
        }

        socketRooms.set(socket.id, { roomId, playerId: user.id });
        await socket.join(roomId);
        socket.emit("game:state", existingGame.getStateForPlayer(user.id));
        return;
      }

      const lobby = getOrCreateLobby(roomId);

      const oldSocketId = lobby.updateSocketId(socket.id, user.id);
      if (oldSocketId) {
        socketRooms.delete(oldSocketId);
      } else {
        const avatar = avatarUrl(user.id, user.avatar);
        const added = lobby.addPlayer(socket.id, user.id, user.global_name ?? user.username, avatar);
        if (!added) {
          socket.emit("lobby:error", "Lobby is full");
          return;
        }
      }

      socketRooms.set(socket.id, { roomId, playerId: user.id });
      await socket.join(roomId);
      broadcastState(io, roomId);
    } catch {
      socket.emit("lobby:error", "Authentication failed");
    }
  });

  socket.on("lobby:ready", () => {
    const meta = socketRooms.get(socket.id);
    if (!meta) return;

    const lobby = getOrCreateLobby(meta.roomId);
    lobby.toggleReady(socket.id);
    broadcastState(io, meta.roomId);
  });

  socket.on("lobby:start", () => {
    const meta = socketRooms.get(socket.id);
    if (!meta) return;

    const lobby = getOrCreateLobby(meta.roomId);
    if (!lobby.isHost(socket.id)) {
      socket.emit("lobby:error", "Only the host can start the game");
      return;
    }
    if (!lobby.canStart()) {
      socket.emit("lobby:error", "All players must be ready to start");
      return;
    }

    lobby.fillWithBots();
    const game = createGame(meta.roomId, lobby.getState().players);
    sendGameStateToPlayers(io, meta.roomId, game);
    processBotTurns(io, meta.roomId, game);
  });

  socket.on("lobby:start-test", () => {
    if (!isDev) return;
    const meta = socketRooms.get(socket.id);
    if (!meta) return;

    const lobby = getOrCreateLobby(meta.roomId);
    if (!lobby.isHost(socket.id)) return;

    lobby.fillWithBots();
    lobby.markAllAsBots();
    const game = createGame(meta.roomId, lobby.getState().players);
    sendGameStateToPlayers(io, meta.roomId, game);
    processBotTurns(io, meta.roomId, game, 10);
  });

  socket.on("game:play", ({ cardIndices }) => {
    const meta = socketRooms.get(socket.id);
    if (!meta) return;

    const game = getGame(meta.roomId);
    if (!game) return;

    if (game.getChaGoPhase() !== null) {
      const chaGo = game.makeChaGoPlay(meta.playerId, cardIndices);
      if (chaGo.executed) {
        sendGameStateToPlayers(io, meta.roomId, game);
        processBotTurns(io, meta.roomId, game);
        return;
      }
    }

    if (!game.isPlayerTurn(meta.playerId)) {
      return;
    }

    const result = game.makePlay(cardIndices);
    if (!result.success) {
      socket.emit("lobby:error", result.error ?? "Invalid play");
      return;
    }

    sendGameStateToPlayers(io, meta.roomId, game);
    processBotTurns(io, meta.roomId, game);
  });

  socket.on("game:pass", () => {
    const meta = socketRooms.get(socket.id);
    if (!meta) return;

    const game = getGame(meta.roomId);
    if (!game) return;

    if (!game.isPlayerTurn(meta.playerId)) {
      socket.emit("lobby:error", "Not your turn");
      return;
    }

    const result = game.pass();
    if (!result.success) {
      socket.emit("lobby:error", result.error ?? "Cannot pass");
      return;
    }

    sendGameStateToPlayers(io, meta.roomId, game);
    processBotTurns(io, meta.roomId, game);
  });

  socket.on("game:reset", () => {
    const meta = socketRooms.get(socket.id);
    if (!meta) return;

    const game = getGame(meta.roomId);
    if (!game || game.getState().winningTeam === null) return;

    const lobby = getOrCreateLobby(meta.roomId);
    if (!lobby.isHost(socket.id)) return;

    removeGame(meta.roomId);
    lobby.resetForNewGame();
    io.to(meta.roomId).emit("lobby:reset", lobby.getState());
  });

  socket.on("lobby:leave", () => {
    handleDisconnect(io, socket);
  });

  socket.on("disconnect", () => {
    handleDisconnect(io, socket);
  });
}

function handleDisconnect(io: IOServer, socket: IOSocket) {
  const meta = socketRooms.get(socket.id);
  if (!meta) return;

  socketRooms.delete(socket.id);
  socket.leave(meta.roomId);

  // Mid-game: leave lobby state alone so the player can rejoin.
  // The Game tracks players by stable id, so a missing socket binding just
  // means broadcasts skip them until they reconnect.
  if (getGame(meta.roomId)) return;

  const lobby = getOrCreateLobby(meta.roomId);
  lobby.removePlayer(socket.id);
  broadcastState(io, meta.roomId);
  removeLobbyIfEmpty(meta.roomId);
}
