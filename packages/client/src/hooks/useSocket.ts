import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { LobbyState, ClientToServerEvents, ServerToClientEvents } from "shared";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface UseSocketResult {
  lobbyState: LobbyState | null;
  toggleReady: () => void;
  startGame: () => void;
  error: string | null;
}

export function useSocket(roomId: string | null, token: string | null): UseSocketResult {
  const [lobbyState, setLobbyState] = useState<LobbyState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<TypedSocket | null>(null);

  useEffect(() => {
    if (!roomId || !token) return;

    const socket: TypedSocket = io({ path: "/socket.io" });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("lobby:join", { roomId, token });
    });

    socket.on("lobby:state", (state) => {
      setLobbyState(state);
    });

    socket.on("lobby:error", (message) => {
      setError(message);
    });

    socket.on("lobby:started", () => {
      // TODO: transition to game
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, token]);

  const toggleReady = useCallback(() => {
    socketRef.current?.emit("lobby:ready");
  }, []);

  const startGame = useCallback(() => {
    socketRef.current?.emit("lobby:start");
  }, []);

  return { lobbyState, toggleReady, startGame, error };
}
