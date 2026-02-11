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
}

export interface CurrentPlay {
  playerId: string;
  cards: import("./card.ts").Card[];
  playType: string;
}

export interface GameState {
  roomId: string;
  players: GamePlayer[];
  currentTurn: number;
  currentPlay: CurrentPlay | null;
  lastPlayerId: string | null;
}

export interface ClientToServerEvents {
  "lobby:join": (data: { roomId: string; token: string }) => void;
  "lobby:ready": () => void;
  "lobby:start": () => void;
  "lobby:leave": () => void;
  "game:play": (data: { cardIndices: number[] }) => void;
  "game:pass": () => void;
}

export interface ServerToClientEvents {
  "lobby:state": (state: LobbyState) => void;
  "lobby:error": (message: string) => void;
  "game:state": (state: GameState) => void;
}
