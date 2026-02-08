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
  cardCount: number;
}

export interface GameState {
  roomId: string;
  players: GamePlayer[];
  hand: import("./card.ts").Card[];
}

export interface ClientToServerEvents {
  "lobby:join": (data: { roomId: string; token: string }) => void;
  "lobby:ready": () => void;
  "lobby:start": () => void;
  "lobby:leave": () => void;
}

export interface ServerToClientEvents {
  "lobby:state": (state: LobbyState) => void;
  "lobby:error": (message: string) => void;
  "game:state": (state: GameState) => void;
}
