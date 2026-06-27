import type { LobbyState } from "game";
import { useMobile } from "@/hooks/useMobile.ts";
import { PlayerSlot } from "./PlayerSlot.tsx";
import { PixelButton } from "./pixel/PixelButton.tsx";

interface LobbyProps {
  state: LobbyState;
  currentUserId: string;
  onToggleReady: () => void;
  onStart: () => void;
}

export function Lobby({ state, currentUserId, onToggleReady, onStart }: LobbyProps) {
  const isMobile = useMobile();
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
          padding: isMobile ? "0 20px" : "0 28px",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: isMobile ? 10 : 14,
          alignContent: "start",
          overflowY: isMobile ? "auto" : undefined,
        }}
      >
        {slots.map((player, i) => (
          <PlayerSlot key={player?.id ?? `slot-${i}`} player={player} compact={isMobile} />
        ))}
      </main>

      <footer
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: isMobile ? undefined : "space-between",
          alignItems: isMobile ? "stretch" : "center",
          gap: isMobile ? 12 : undefined,
          padding: isMobile ? "18px 20px 40px" : "14px 28px",
          borderTop: "2px solid var(--color-panel-border)",
          background: isMobile ? "linear-gradient(0deg, #1a0e08 60%, transparent)" : "rgba(0,0,0,0.27)",
        }}
      >
        {isMobile && (
          <div
            className="font-pixel text-[9px] tracking-widest text-center"
            style={{ color: allReady ? "var(--color-success)" : "var(--color-paper-muted)" }}
          >
            {allReady
              ? `● ${readyCount}/${state.maxPlayers} READY · DEAL NOW`
              : `○ ${readyCount}/${state.maxPlayers} READY`}
          </div>
        )}
        {!isMobile && (
          <div className="font-pixel text-[8px] tracking-widest text-[color:var(--color-paper-dim)]">
            {readyCount}/{state.maxPlayers} READY · TEAMS REVEALED AFTER DEAL
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 8,
          }}
        >
          <PixelButton
            tone={currentPlayer?.ready ? "muted" : "success"}
            onClick={onToggleReady}
            style={isMobile ? { fontSize: 14, padding: "20px 0" } : undefined}
          >
            {currentPlayer?.ready ? "UNREADY" : "READY"}
          </PixelButton>
          {isHost && (
            <PixelButton
              tone="accent"
              disabled={!allReady}
              dim={!allReady}
              onClick={onStart}
              style={isMobile ? { fontSize: 14, padding: "20px 0" } : undefined}
            >
              {isMobile ? "▸ DEAL CARDS" : "START GAME ▸"}
            </PixelButton>
          )}
        </div>
      </footer>
    </div>
  );
}
