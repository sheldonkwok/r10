import {
  type CurrentPlay,
  card,
  compare,
  type GamePlayer,
  type GameState,
  getLosingTeam,
  getWinningTeam,
  type LobbyPlayer,
  play,
} from "shared";

const isDev = process.env.NODE_ENV !== "production";

type InternalPlayerInfo = Omit<GamePlayer, "handSize">;

interface InternalPlayer {
  info: InternalPlayerInfo;
  socketId: string | null; // null for bots
}

interface InternalPlay {
  playerId: string;
  cards: card.Card[];
  play: play.Play;
}

export class Game {
  readonly roomId: string;
  private hostId: string;
  private players: InternalPlayer[] = [];
  private currentTurn: number = 0;
  private currentPlayInternal: InternalPlay | null = null;
  private lastPlayerId: string | null = null;
  private firstFinisherId: string | null = null;
  private chaGoPhase: "cha-available" | "go-available" | null = null;
  private chaGoLocked: boolean = false;

  constructor(roomId: string, lobbyPlayers: [string, LobbyPlayer][], dealtHands?: card.Cards[]) {
    this.roomId = roomId;
    this.hostId = lobbyPlayers.find(([, p]) => p.isHost)?.[1].id ?? "";
    const hands = dealtHands ?? card.createHands();

    this.players = lobbyPlayers.map(([socketId, player], index) => ({
      info: {
        id: player.id,
        username: player.username,
        avatarUrl: player.avatarUrl,
        isBot: player.isBot,
        hand: hands[index],
        team: "black" as const,
      },
      socketId: player.isBot ? null : socketId,
    }));

    for (const player of this.players) {
      const hasRedTen = player.info.hand.some(
        (c) => c.rank === 10 && (c.suit.short === "d" || c.suit.short === "h"),
      );
      player.info.team = hasRedTen ? "red" : "black";
    }
  }

  getState(): GameState {
    const currentPlay: CurrentPlay | null = this.currentPlayInternal
      ? {
          playerId: this.currentPlayInternal.playerId,
          cards: this.currentPlayInternal.cards,
          playType: this.currentPlayInternal.play.name,
        }
      : null;

    const playerInfos = this.toGamePlayers();
    return {
      roomId: this.roomId,
      hostId: this.hostId,
      players: playerInfos,
      currentTurn: this.currentTurn,
      currentPlay,
      lastPlayerId: this.lastPlayerId,
      losingTeam: getLosingTeam(playerInfos),
      firstFinisherId: this.firstFinisherId,
      winningTeam: getWinningTeam(playerInfos, this.firstFinisherId),
      chaGoPhase: this.chaGoPhase,
      chaGoLocked: this.chaGoLocked,
    };
  }

  getStateForSocket(socketId: string, base = this.getState()): GameState {
    const gameOver = base.winningTeam !== null;
    const players = base.players.map((player, index) => {
      const internal = this.players[index];
      if (internal.socketId === socketId) return player;
      return {
        ...player,
        hand: [],
        team: gameOver ? player.team : (null as null),
      };
    });
    const debugState = isDev ? base : undefined;
    return { ...base, players, debugState };
  }

  getSocketIds(): string[] {
    return this.players.flatMap((p) => (p.socketId !== null ? [p.socketId] : []));
  }

  rejoinPlayer(discordUserId: string, newSocketId: string): boolean {
    const player = this.players.find((p) => p.info.id === discordUserId);
    if (!player || player.info.isBot) return false;
    player.socketId = newSocketId;
    return true;
  }

  getCurrentPlayer(): InternalPlayer {
    return this.players[this.currentTurn];
  }

  isPlayerTurn(socketId: string): boolean {
    const current = this.getCurrentPlayer();
    return current.socketId === socketId;
  }

  makePlay(cardIndices: number[]): { success: boolean; error?: string } {
    if (getLosingTeam(this.players.map((p) => p.info)) !== null) {
      return { success: false, error: "Game is over" };
    }

    if (this.chaGoLocked) {
      return { success: false, error: "Cha-Go is locked — same-rank only" };
    }

    if (this.chaGoPhase !== null) {
      this.chaGoPhase = null;
    }

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

    if (player.info.hand.length === 0) {
      if (this.firstFinisherId === null) {
        this.firstFinisherId = player.info.id;
      }
      this.currentPlayInternal = null;
      this.lastPlayerId = null;
    } else if (newPlay.name === "Single") {
      this.chaGoPhase = "cha-available";
      if (this.getEligibleChaGoPlayerIds().length === 0) {
        this.chaGoPhase = null;
      }
    }

    return { success: true };
  }

  getChaGoPhase(): "cha-available" | "go-available" | null {
    return this.chaGoPhase;
  }

  private getEligibleChaGoPlayerIds(): string[] {
    if (!this.chaGoPhase || !this.currentPlayInternal) return [];
    const value = this.currentPlayInternal.play.value;
    const minMatching = this.chaGoPhase === "cha-available" ? 2 : 1;
    return this.players
      .filter(
        (p) =>
          p.info.id !== this.lastPlayerId &&
          p.info.hand.length > 0 &&
          p.info.hand.filter((c) => c.value === value).length >= minMatching,
      )
      .map((p) => p.info.id);
  }

  isChaGoEligible(socketId: string): boolean {
    if (this.chaGoPhase === null) return false;
    const player = this.players.find((p) => p.socketId === socketId);
    if (!player) return false;
    return this.getEligibleChaGoPlayerIds().includes(player.info.id);
  }

  makeChaGoPlay(socketId: string, cardIndices: number[]): { executed: boolean } {
    if (this.chaGoPhase === null) return { executed: false };
    if (!this.currentPlayInternal) return { executed: false };

    const playerEntry = this.players.find((p) => p.socketId === socketId);
    if (!playerEntry) return { executed: false };
    if (playerEntry.info.id === this.lastPlayerId) return { executed: false };

    const cards = cardIndices.map((i) => playerEntry.info.hand[i]);
    if (cards.some((c) => c === undefined)) return { executed: false };
    const newPlay = play.get(cards);
    const currentValue = this.currentPlayInternal.play.value;

    if (this.chaGoPhase === "cha-available") {
      if (newPlay.name !== "Pair" || newPlay.value !== currentValue) {
        return { executed: false };
      }
    } else {
      if (newPlay.name !== "Single" || newPlay.value !== currentValue) {
        return { executed: false };
      }
    }

    const sortedIndices = [...cardIndices].sort((a, b) => b - a);
    for (const idx of sortedIndices) {
      playerEntry.info.hand.splice(idx, 1);
    }

    this.currentPlayInternal = { playerId: playerEntry.info.id, cards, play: newPlay };
    this.lastPlayerId = playerEntry.info.id;

    const playerIdx = this.players.findIndex((p) => p.info.id === playerEntry.info.id);
    if (playerIdx !== -1) {
      this.currentTurn = playerIdx;
      this.advanceTurn();
    }

    if (playerEntry.info.hand.length === 0) {
      if (this.firstFinisherId === null) {
        this.firstFinisherId = playerEntry.info.id;
      }
      this.currentPlayInternal = null;
      this.lastPlayerId = null;
      this.chaGoPhase = null;
      this.chaGoLocked = false;
    } else {
      this.chaGoPhase = this.chaGoPhase === "cha-available" ? "go-available" : "cha-available";
      this.chaGoLocked = true;
    }

    return { executed: true };
  }

  pass(): { success: boolean; error?: string } {
    if (getLosingTeam(this.players.map((p) => p.info)) !== null) {
      return { success: false, error: "Game is over" };
    }

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
      this.chaGoPhase = null;
      this.chaGoLocked = false;
    }

    return { success: true };
  }

  private toGamePlayers(): GamePlayer[] {
    return this.players.map((p) => ({ ...p.info, handSize: p.info.hand.length }));
  }

  private advanceTurn(): void {
    const totalPlayers = this.players.length;
    let steps = 0;
    do {
      this.currentTurn = (this.currentTurn + 1) % totalPlayers;
      steps++;
    } while (this.players[this.currentTurn].info.hand.length === 0 && steps < totalPlayers);
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

    if (this.chaGoLocked) {
      this.pass();
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
