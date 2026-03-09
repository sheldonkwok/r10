export interface LobbyPlayer {
  id: string;
  username: string;
  avatarUrl: string;
  ready: boolean;
  isHost: boolean;
  isBot: boolean;
}

export interface LobbyState {
  roomId: string;
  players: LobbyPlayer[];
  maxPlayers: number;
}

export interface GamePlayer {
  id: string;
  username: string;
  avatarUrl: string;
  isBot: boolean;
  hand: import("./card.ts").Card[];
  handSize: number;
  team: "red" | "black" | null;
}

export interface CurrentPlay {
  playerId: string;
  cards: import("./card.ts").Card[];
  playType: string;
}

export interface GameState {
  roomId: string;
  hostId: string;
  players: GamePlayer[];
  currentTurn: number;
  currentPlay: CurrentPlay | null;
  lastPlayerId: string | null;
  losingTeam: "red" | "black" | null;
  firstFinisherId: string | null;
  winningTeam: "red" | "black" | "wash" | null;
  chaGoPhase: "cha-available" | "go-available" | null;
  chaGoDeadline: number | null;
  /** Dev only: full unstripped state for debug reveal toggle */
  debugState?: GameState;
}

export interface ClientToServerEvents {
  "lobby:join": (data: { roomId: string; token: string }) => void;
  "lobby:ready": () => void;
  "lobby:start": () => void;
  "lobby:leave": () => void;
  "game:play": (data: { cardIndices: number[] }) => void;
  "game:pass": () => void;
  "game:reset": () => void;
}

export interface ServerToClientEvents {
  "lobby:state": (state: LobbyState) => void;
  "lobby:error": (message: string) => void;
  "lobby:reset": (state: LobbyState) => void;
  "game:state": (state: GameState) => void;
}
