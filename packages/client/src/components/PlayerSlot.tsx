import type { LobbyPlayer } from "game";
import { PixelPanel } from "./pixel/PixelPanel.tsx";

interface PlayerSlotProps {
  player: LobbyPlayer | null;
}

export function PlayerSlot({ player }: PlayerSlotProps) {
  if (!player) {
    return (
      <PixelPanel
        height={120}
        accent="var(--color-paper-muted)"
        style={{ display: "flex", alignItems: "center", gap: 12, padding: 12 }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            background: "var(--color-panel)",
            boxShadow: "inset 0 0 0 2px var(--color-panel-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-paper-muted)",
            fontFamily: "var(--font-pixel)",
            fontSize: 24,
          }}
        >
          ?
        </div>
        <div style={{ flex: 1 }}>
          <div className="font-pixel text-[10px] tracking-wider text-[color:var(--color-paper-dim)] mb-1">
            WAITING
          </div>
          <div className="font-pixel text-[7px] tracking-wider text-[color:var(--color-paper-muted)]">
            ○ ...EMPTY
          </div>
        </div>
      </PixelPanel>
    );
  }

  const accent = player.ready ? "var(--color-success)" : "var(--color-panel-border)";

  return (
    <PixelPanel
      height={120}
      accent={accent}
      glow={player.ready ? "color-mix(in srgb, var(--color-success) 50%, transparent)" : null}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: 12 }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          background: player.ready ? "var(--color-felt)" : "var(--color-panel)",
          boxShadow: "inset 0 0 0 2px var(--color-panel-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          filter: player.ready ? "none" : "grayscale(1) opacity(.5)",
        }}
      >
        <img
          src={player.avatarUrl}
          alt={player.username}
          width={56}
          height={56}
          style={{ display: "block", imageRendering: "pixelated" }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="font-pixel text-[10px] tracking-wider text-[color:var(--color-paper)] truncate mb-1">
          {player.username.toUpperCase()}
          {player.isHost ? " ★" : ""}
        </div>
        <div
          className="font-pixel text-[7px] tracking-widest"
          style={{
            color: player.ready ? "var(--color-success)" : "var(--color-paper-muted)",
          }}
        >
          {player.isBot ? "● BOT" : player.ready ? "● READY" : "○ WAITING"}
        </div>
        {player.ready && (
          <div style={{ marginTop: 6, display: "flex", gap: 2 }}>
            {Array.from({ length: 13 }).map((_, k) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed-size pip row
                key={k}
                style={{
                  width: 4,
                  height: 8,
                  background: "var(--color-accent)",
                  opacity: 0.3 + k * 0.05,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </PixelPanel>
  );
}
