export interface LobbyPlayer {
  id: string;
  username: string;
  avatarUrl: string;
  ready: boolean;
  isHost: boolean;
}

export interface LobbyState {
  roomId: string;
  players: LobbyPlayer[];
  maxPlayers: number;
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
  "lobby:started": () => void;
}
