import { card, play, compare, type GamePlayer, type GameState, type CurrentPlay, type LobbyPlayer } from "shared";

interface InternalPlayer {
  info: GamePlayer;
  socketId: string | null; // null for bots
}

interface InternalPlay {
  playerId: string;
  cards: card.Card[];
  play: play.Play;
}

export class Game {
  readonly roomId: string;
  private players: InternalPlayer[] = [];
  private currentTurn: number = 0;
  private currentPlayInternal: InternalPlay | null = null;
  private lastPlayerId: string | null = null;

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
    const currentPlay: CurrentPlay | null = this.currentPlayInternal
      ? {
          playerId: this.currentPlayInternal.playerId,
          cards: this.currentPlayInternal.cards,
          playType: this.currentPlayInternal.play.name,
        }
      : null;

    return {
      roomId: this.roomId,
      players: this.players.map((p) => p.info),
      currentTurn: this.currentTurn,
      currentPlay,
      lastPlayerId: this.lastPlayerId,
    };
  }

  getSocketIds(): string[] {
    return this.players
      .filter((p) => p.socketId !== null)
      .map((p) => p.socketId!);
  }

  getCurrentPlayer(): InternalPlayer {
    return this.players[this.currentTurn];
  }

  isPlayerTurn(socketId: string): boolean {
    const current = this.getCurrentPlayer();
    return current.socketId === socketId;
  }

  makePlay(cardIndices: number[]): { success: boolean; error?: string } {
    const player = this.getCurrentPlayer();
    const cards = cardIndices.map((i) => player.info.hand[i]);
    const newPlay = play.get(cards);

    if (newPlay.name === "Illegal") {
      return { success: false, error: "Invalid play" };
    }

    if (this.currentPlayInternal && this.lastPlayerId !== player.info.id) {
      const result = compare(this.currentPlayInternal.play, newPlay);
      if (!result.valid) {
        return { success: false, error: result.error };
      }
    }

    // Remove cards from hand (in reverse order to maintain indices)
    const sortedIndices = [...cardIndices].sort((a, b) => b - a);
    for (const idx of sortedIndices) {
      player.info.hand.splice(idx, 1);
    }

    this.currentPlayInternal = {
      playerId: player.info.id,
      cards,
      play: newPlay,
    };
    this.lastPlayerId = player.info.id;
    this.advanceTurn();

    return { success: true };
  }

  pass(): { success: boolean; error?: string } {
    if (!this.currentPlayInternal) {
      return { success: false, error: "Cannot pass on an empty round" };
    }

    const player = this.getCurrentPlayer();
    if (this.lastPlayerId === player.info.id) {
      return { success: false, error: "Cannot pass on your own play" };
    }

    this.advanceTurn();

    // Check if we've gone full circle back to the last player
    if (this.players[this.currentTurn].info.id === this.lastPlayerId) {
      this.currentPlayInternal = null;
    }

    return { success: true };
  }

  private advanceTurn(): void {
    this.currentTurn = (this.currentTurn + 1) % this.players.length;
  }

  isCurrentPlayerBot(): boolean {
    return this.getCurrentPlayer().info.isBot;
  }

  makeBotPlay(): void {
    const player = this.getCurrentPlayer();
    const hand = player.info.hand;

    if (hand.length === 0) {
      this.advanceTurn();
      return;
    }

    // If no current play, bot starts a new round
    if (!this.currentPlayInternal || this.lastPlayerId === player.info.id) {
      // Play smallest single card
      const indices = [hand.length - 1];
      this.makePlay(indices);
      return;
    }

    // Try to beat current play
    const validPlays = this.findValidPlays(hand);

    if (validPlays.length === 0) {
      this.pass();
      return;
    }

    // Prefer non-bomb plays
    const nonBombPlays = validPlays.filter((p) => !p.playType.includes("Bomb"));
    const playToMake = nonBombPlays.length > 0 ? nonBombPlays[0] : validPlays[0];

    this.makePlay(playToMake.indices);
  }

  private findValidPlays(hand: card.Card[]): { indices: number[]; playType: string }[] {
    const validPlays: { indices: number[]; playType: string; rank: number }[] = [];
    const currentPlayObj = this.currentPlayInternal?.play ?? null;

    // Try singles
    for (let i = 0; i < hand.length; i++) {
      const cards = [hand[i]];
      const p = play.get(cards);
      if (this.isValidAgainstCurrent(p, currentPlayObj)) {
        validPlays.push({ indices: [i], playType: p.name, rank: p.rank });
      }
    }

    // Try pairs
    for (let i = 0; i < hand.length; i++) {
      for (let j = i + 1; j < hand.length; j++) {
        const cards = [hand[i], hand[j]];
        const p = play.get(cards);
        if (p.name !== "Illegal" && this.isValidAgainstCurrent(p, currentPlayObj)) {
          validPlays.push({ indices: [i, j], playType: p.name, rank: p.rank });
        }
      }
    }

    // Try 3+ card combinations (straights, bombs)
    for (let size = 3; size <= Math.min(6, hand.length); size++) {
      const combos = this.getCombinations(hand.length, size);
      for (const indices of combos) {
        const cards = indices.map((i) => hand[i]);
        const p = play.get(cards);
        if (p.name !== "Illegal" && this.isValidAgainstCurrent(p, currentPlayObj)) {
          validPlays.push({ indices, playType: p.name, rank: p.rank });
        }
      }
    }

    // Sort: non-bombs first, then by rank, then by value
    return validPlays.sort((a, b) => {
      const aIsBomb = a.playType.includes("Bomb") ? 1 : 0;
      const bIsBomb = b.playType.includes("Bomb") ? 1 : 0;
      if (aIsBomb !== bIsBomb) return aIsBomb - bIsBomb;
      return a.rank - b.rank;
    });
  }

  private isValidAgainstCurrent(newPlay: play.Play, currentPlay: play.Play | null): boolean {
    if (!currentPlay) return true;
    const result = compare(currentPlay, newPlay);
    return result.valid;
  }

  private getCombinations(n: number, k: number): number[][] {
    const result: number[][] = [];
    const combo: number[] = [];

    function backtrack(start: number) {
      if (combo.length === k) {
        result.push([...combo]);
        return;
      }
      for (let i = start; i < n; i++) {
        combo.push(i);
        backtrack(i + 1);
        combo.pop();
      }
    }

    backtrack(0);
    return result;
  }
}

export type { Game };

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
