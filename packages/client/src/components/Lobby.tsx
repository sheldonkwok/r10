import type { LobbyState } from "game";
import { PlayerSlot } from "./PlayerSlot.tsx";
import { PixelButton } from "./pixel/PixelButton.tsx";

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
  const readyCount = state.players.filter((p) => p.ready).length;

  const slots = Array.from({ length: state.maxPlayers }, (_, i) => state.players[i] ?? null);

  return (
    <div
      className="scanlines"
      style={{
        position: "fixed",
        inset: 0,
        background: "radial-gradient(ellipse at center, #4a2818 0%, #1a0e08 100%)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          padding: "20px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div className="font-pixel text-[14px] tracking-[3px] text-[color:var(--color-accent)]">
          ▸ TABLE {state.roomId.slice(0, 4).toUpperCase()}
        </div>
        <div className="font-pixel text-[9px] tracking-widest text-[color:var(--color-paper-dim)]">
          STAKES ×1 · {state.maxPlayers} SEATS
        </div>
      </header>

      <main
        style={{
          flex: 1,
          padding: "0 28px",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
          alignContent: "start",
        }}
      >
        {slots.map((player, i) => (
          <PlayerSlot key={player?.id ?? `slot-${i}`} player={player} />
        ))}
      </main>

      <footer
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 28px",
          borderTop: "2px solid var(--color-panel-border)",
          background: "rgba(0,0,0,0.27)",
        }}
      >
        <div className="font-pixel text-[8px] tracking-widest text-[color:var(--color-paper-dim)]">
          {readyCount}/{state.maxPlayers} READY · TEAMS REVEALED AFTER DEAL
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <PixelButton tone={currentPlayer?.ready ? "muted" : "success"} onClick={onToggleReady}>
            {currentPlayer?.ready ? "UNREADY" : "READY"}
          </PixelButton>
          {isHost && (
            <PixelButton tone="accent" disabled={!allReady} dim={!allReady} onClick={onStart}>
              START GAME ▸
            </PixelButton>
          )}
        </div>
      </footer>
    </div>
  );
}
