import { card, type GamePlayer, type GameState, type LobbyPlayer } from "shared";

interface PlayerWithHand {
  info: GamePlayer;
  hand: card.Card[];
  socketId: string | null; // null for bots
}

export class Game {
  readonly roomId: string;
  private players: PlayerWithHand[] = [];

  constructor(roomId: string, lobbyPlayers: [string, LobbyPlayer][]) {
    this.roomId = roomId;
    const hands = card.createHands();

    this.players = lobbyPlayers.map(([socketId, player], index) => ({
      info: {
        id: player.id,
        username: player.username,
        avatarUrl: player.avatarUrl,
        isBot: player.isBot,
        cardCount: hands[index].length,
      },
      hand: hands[index],
      socketId: player.isBot ? null : socketId,
    }));
  }

  getStateForPlayer(playerId: string): GameState {
    const player = this.players.find((p) => p.info.id === playerId);
    return {
      roomId: this.roomId,
      players: this.players.map((p) => p.info),
      hand: player?.hand ?? [],
    };
  }

  getSocketIds(): string[] {
    return this.players
      .filter((p) => p.socketId !== null)
      .map((p) => p.socketId!);
  }

  getPlayerBySocketId(socketId: string): PlayerWithHand | undefined {
    return this.players.find((p) => p.socketId === socketId);
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
