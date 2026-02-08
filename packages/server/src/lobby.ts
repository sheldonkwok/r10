import type { LobbyPlayer, LobbyState } from "shared";

const MAX_PLAYERS = 6;

export class Lobby {
  readonly roomId: string;
  private players: Map<string, LobbyPlayer> = new Map();

  constructor(roomId: string) {
    this.roomId = roomId;
  }

  addPlayer(socketId: string, id: string, username: string, avatarUrl: string): boolean {
    if (this.players.size >= MAX_PLAYERS) return false;
    if (this.hasDiscordUser(id)) return false;

    const isHost = this.players.size === 0;
    this.players.set(socketId, { id, username, avatarUrl, ready: false, isHost });
    return true;
  }

  removePlayer(socketId: string): void {
    const wasHost = this.players.get(socketId)?.isHost ?? false;
    this.players.delete(socketId);

    if (wasHost && this.players.size > 0) {
      const firstPlayer = this.players.values().next().value!;
      firstPlayer.isHost = true;
    }
  }

  setReady(socketId: string, ready: boolean): void {
    const player = this.players.get(socketId);
    if (player) player.ready = ready;
  }

  toggleReady(socketId: string): void {
    const player = this.players.get(socketId);
    if (player) player.ready = !player.ready;
  }

  isHost(socketId: string): boolean {
    return this.players.get(socketId)?.isHost ?? false;
  }

  canStart(): boolean {
    if (this.players.size !== MAX_PLAYERS) return false;
    return [...this.players.values()].every((p) => p.ready);
  }

  isEmpty(): boolean {
    return this.players.size === 0;
  }

  getState(): LobbyState {
    return {
      roomId: this.roomId,
      players: [...this.players.values()],
      maxPlayers: MAX_PLAYERS,
    };
  }

  private hasDiscordUser(id: string): boolean {
    return [...this.players.values()].some((p) => p.id === id);
  }
}

const lobbies = new Map<string, Lobby>();

export function getOrCreateLobby(roomId: string): Lobby {
  let lobby = lobbies.get(roomId);
  if (!lobby) {
    lobby = new Lobby(roomId);
    lobbies.set(roomId, lobby);
  }
  return lobby;
}

export function removeLobbyIfEmpty(roomId: string): void {
  const lobby = lobbies.get(roomId);
  if (lobby?.isEmpty()) {
    lobbies.delete(roomId);
  }
}
