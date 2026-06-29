import type { GameState } from "game";
import { PixelButton } from "../pixel/PixelButton.tsx";
import { PixelPanel } from "../pixel/PixelPanel.tsx";

interface GameOverOverlayProps {
  state: GameState;
  currentUserId: string;
  isMobile: boolean;
  onResetGame: () => void;
}

export function GameOverOverlay({ state, currentUserId, isMobile, onResetGame }: GameOverOverlayProps) {
  if (state.winningTeam === null) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(10, 6, 4, 0.78)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? 20 : 0,
      }}
    >
      <PixelPanel
        width={isMobile ? "100%" : 520}
        accent={
          state.winningTeam === "wash"
            ? "var(--color-paper-dim)"
            : state.winningTeam === "red"
              ? "var(--color-team-red)"
              : "var(--color-paper)"
        }
        glow={
          state.winningTeam === "red"
            ? "var(--color-team-red-glow)"
            : "color-mix(in srgb, var(--color-accent) 50%, transparent)"
        }
        style={{ padding: 24, textAlign: "center" }}
      >
        <div className="font-pixel text-[10px] tracking-widest text-[color:var(--color-paper-dim)]">
          ROUND COMPLETE
        </div>
        <div
          className="font-pixel mt-3"
          style={{
            fontSize: isMobile ? 22 : 28,
            letterSpacing: 6,
            color:
              state.winningTeam === "wash"
                ? "var(--color-paper-dim)"
                : state.winningTeam === "red"
                  ? "var(--color-team-red)"
                  : "var(--color-paper)",
            textShadow: "3px 3px 0 #000",
          }}
        >
          {state.winningTeam === "wash" ? "WASH · TIE" : `${state.winningTeam.toUpperCase()} TEAM WINS`}
        </div>
        {state.firstFinisherId && (
          <div className="font-pixel text-[9px] tracking-widest text-[color:var(--color-accent)] mt-3">
            ★ FIRST OUT: {state.players.find((p) => p.id === state.firstFinisherId)?.username.toUpperCase()}
          </div>
        )}
        {state.losingTeam && (
          <div className="font-pixel text-[8px] tracking-wider text-[color:var(--color-paper-muted)] mt-2">
            LOSING TEAM: {state.losingTeam.toUpperCase()}
          </div>
        )}
        {state.hostId === currentUserId && (
          <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
            <PixelButton
              tone="accent"
              onClick={onResetGame}
              style={isMobile ? { width: "100%", padding: "20px 0", fontSize: 14 } : undefined}
            >
              NEXT ROUND ▸
            </PixelButton>
          </div>
        )}
      </PixelPanel>
    </div>
  );
}
