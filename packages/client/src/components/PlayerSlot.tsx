import type { LobbyPlayer } from "shared";

interface PlayerSlotProps {
  player: LobbyPlayer | null;
}

export function PlayerSlot({ player }: PlayerSlotProps) {
  if (!player) {
    return (
      <div className="player-slot empty">
        <span>Waiting...</span>
      </div>
    );
  }

  return (
    <div className={`player-slot ${player.ready ? "ready" : ""}`}>
      <img
        src={player.avatarUrl}
        alt={player.username}
        className="player-avatar"
        width={48}
        height={48}
      />
      <span className="player-name">{player.username}</span>
      {player.ready && <span className="ready-badge">Ready</span>}
      {player.isHost && <span className="host-badge">Host</span>}
    </div>
  );
}
