import type { LobbyState } from "shared";
import { PlayerSlot } from "./PlayerSlot.tsx";
import { Button } from "@/components/ui/button";

interface LobbyProps {
  state: LobbyState;
  currentUserId: string;
  onToggleReady: () => void;
  onStart: () => void;
}

export function Lobby({ state, currentUserId, onToggleReady, onStart }: LobbyProps) {
  const currentPlayer = state.players.find((p) => p.id === currentUserId);
  const isHost = currentPlayer?.isHost ?? false;
  const humanPlayers = state.players.filter((p) => !p.isBot);
  const allReady = humanPlayers.length > 0 && humanPlayers.every((p) => p.ready);

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
        <Button onClick={onToggleReady}>
          {currentPlayer?.ready ? "Unready" : "Ready"}
        </Button>
        {isHost && (
          <Button onClick={onStart} disabled={!allReady}>
            Start Game
          </Button>
        )}
      </div>
    </div>
  );
}
