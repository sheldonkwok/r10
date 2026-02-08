import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "shared";
import { getDiscordUser, avatarUrl } from "./auth.ts";
import { getOrCreateLobby, removeLobbyIfEmpty } from "./lobby.ts";
import { createGame } from "./game.ts";

type IOServer = Server<ClientToServerEvents, ServerToClientEvents>;
type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

interface SocketMeta {
  roomId: string;
}

function sendGameStateToPlayers(io: IOServer, roomId: string, game: ReturnType<typeof createGame>) {
  for (const socketId of game.getSocketIds()) {
    const player = game.getPlayerBySocketId(socketId);
    if (player) {
      io.to(socketId).emit("game:state", game.getStateForPlayer(player.info.id));
    }
  }
}

const socketRooms = new Map<string, SocketMeta>();

function broadcastState(io: IOServer, roomId: string) {
  const lobby = getOrCreateLobby(roomId);
  io.to(roomId).emit("lobby:state", lobby.getState());
}

export function registerHandlers(io: IOServer, socket: IOSocket) {
  socket.on("lobby:join", async ({ roomId, token }) => {
    try {
      const user = await getDiscordUser(token);
      const lobby = getOrCreateLobby(roomId);
      const avatar = avatarUrl(user.id, user.avatar);
      const added = lobby.addPlayer(socket.id, user.id, user.global_name ?? user.username, avatar);

      if (!added) {
        socket.emit("lobby:error", "Lobby is full or you are already in it");
        return;
      }

      socketRooms.set(socket.id, { roomId });
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
    const game = createGame(meta.roomId, lobby.getPlayerEntries());
    sendGameStateToPlayers(io, meta.roomId, game);
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

  const lobby = getOrCreateLobby(meta.roomId);
  lobby.removePlayer(socket.id);
  socketRooms.delete(socket.id);

  socket.leave(meta.roomId);
  broadcastState(io, meta.roomId);
  removeLobbyIfEmpty(meta.roomId);
}
