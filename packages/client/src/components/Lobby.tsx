import type { LobbyState } from "shared";
import { PlayerSlot } from "./PlayerSlot.tsx";

interface LobbyProps {
  state: LobbyState;
  currentUserId: string;
  onToggleReady: () => void;
  onStart: () => void;
}

export function Lobby({ state, currentUserId, onToggleReady, onStart }: LobbyProps) {
  const currentPlayer = state.players.find((p) => p.id === currentUserId);
  const isHost = currentPlayer?.isHost ?? false;
  const allReady = state.players.length === state.maxPlayers && state.players.every((p) => p.ready);

  const slots = Array.from({ length: state.maxPlayers }, (_, i) => state.players[i] ?? null);

  return (
    <div className="lobby">
      <h1>Red 10 Lobby</h1>
      <p>
        {state.players.length} / {state.maxPlayers} players
      </p>
      <div className="player-grid">
        {slots.map((player, i) => (
          <PlayerSlot key={i} player={player} />
        ))}
      </div>
      <div className="lobby-actions">
        <button onClick={onToggleReady}>
          {currentPlayer?.ready ? "Unready" : "Ready"}
        </button>
        {isHost && (
          <button onClick={onStart} disabled={!allReady}>
            Start Game
          </button>
        )}
      </div>
    </div>
  );
}
