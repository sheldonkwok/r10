import { card, type GamePlayer, type GameState, type LobbyPlayer } from "shared";

interface InternalPlayer {
  info: GamePlayer;
  socketId: string | null; // null for bots
}

export class Game {
  readonly roomId: string;
  private players: InternalPlayer[] = [];

  constructor(roomId: string, lobbyPlayers: [string, LobbyPlayer][]) {
    this.roomId = roomId;
    const hands = card.createHands();

    this.players = lobbyPlayers.map(([socketId, player], index) => ({
      info: {
        id: player.id,
        username: player.username,
        avatarUrl: player.avatarUrl,
        isBot: player.isBot,
        hand: hands[index],
      },
      socketId: player.isBot ? null : socketId,
    }));
  }

  getState(): GameState {
    return {
      roomId: this.roomId,
      players: this.players.map((p) => p.info),
    };
  }

  getSocketIds(): string[] {
    return this.players
      .filter((p) => p.socketId !== null)
      .map((p) => p.socketId!);
  }
}

const games = new Map<string, Game>();

export function createGame(roomId: string, lobbyPlayers: [string, LobbyPlayer][]): Game {
  const game = new Game(roomId, lobbyPlayers);
  games.set(roomId, game);
  return game;
}

export function getGame(roomId: string): Game | undefined {
  return games.get(roomId);
}

export function removeGame(roomId: string): void {
  games.delete(roomId);
}
