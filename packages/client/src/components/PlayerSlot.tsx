import type { LobbyPlayer } from "game";
import { PixelPanel } from "./pixel/PixelPanel.tsx";

interface PlayerSlotProps {
  player: LobbyPlayer | null;
  compact?: boolean;
}

export function PlayerSlot({ player, compact = false }: PlayerSlotProps) {
  const height = compact ? 68 : 120;
  const avatarSize = compact ? 44 : 56;
  const pipW = compact ? 3 : 4;
  const pipH = compact ? 12 : 8;

  if (!player) {
    return (
      <PixelPanel
        height={height}
        accent="var(--color-paper-muted)"
        style={{ display: "flex", alignItems: "center", gap: 12, padding: 12 }}
      >
        <div
          style={{
            width: avatarSize,
            height: avatarSize,
            background: "var(--color-panel)",
            boxShadow: "inset 0 0 0 2px var(--color-panel-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-paper-muted)",
            fontFamily: "var(--font-pixel)",
            fontSize: compact ? 18 : 24,
            flexShrink: 0,
          }}
        >
          ?
        </div>
        <div style={{ flex: 1 }}>
          <div
            className="font-pixel tracking-wider text-[color:var(--color-paper-dim)] mb-1"
            style={{ fontSize: compact ? 9 : 10 }}
          >
            WAITING
          </div>
          <div
            className="font-pixel tracking-wider text-[color:var(--color-paper-muted)]"
            style={{ fontSize: compact ? 6 : 7 }}
          >
            ○ ...EMPTY
          </div>
        </div>
      </PixelPanel>
    );
  }

  const accent = player.ready ? "var(--color-success)" : "var(--color-panel-border)";

  return (
    <PixelPanel
      height={height}
      accent={accent}
      glow={player.ready ? "color-mix(in srgb, var(--color-success) 50%, transparent)" : null}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: compact ? 10 : 12 }}
    >
      <div
        style={{
          width: avatarSize,
          height: avatarSize,
          background: player.ready ? "var(--color-felt)" : "var(--color-panel)",
          boxShadow: "inset 0 0 0 2px var(--color-panel-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          filter: player.ready ? "none" : "grayscale(1) opacity(.5)",
          flexShrink: 0,
        }}
      >
        <img
          src={player.avatarUrl}
          alt={player.username}
          width={avatarSize}
          height={avatarSize}
          style={{ display: "block", imageRendering: "pixelated" }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="font-pixel tracking-wider text-[color:var(--color-paper)] truncate mb-1"
          style={{ fontSize: compact ? 9 : 10 }}
        >
          {player.username.toUpperCase()}
          {player.isHost ? " ★" : ""}
        </div>
        <div
          className="font-pixel tracking-widest"
          style={{
            fontSize: compact ? 6 : 7,
            color: player.ready ? "var(--color-success)" : "var(--color-paper-muted)",
          }}
        >
          {player.isBot ? "● BOT" : player.ready ? "● READY" : "○ WAITING"}
        </div>
        {player.ready && !compact && (
          <div style={{ marginTop: 6, display: "flex", gap: 2 }}>
            {Array.from({ length: 13 }).map((_, k) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed-size pip row
                key={k}
                style={{
                  width: pipW,
                  height: pipH,
                  background: "var(--color-accent)",
                  opacity: 0.3 + k * 0.05,
                }}
              />
            ))}
          </div>
        )}
      </div>
      {player.ready && compact && (
        <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
          {Array.from({ length: 13 }).map((_, k) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-size pip row
              key={k}
              style={{
                width: pipW,
                height: pipH,
                background: "var(--color-accent)",
                opacity: 0.3 + k * 0.05,
              }}
            />
          ))}
        </div>
      )}
    </PixelPanel>
  );
}
