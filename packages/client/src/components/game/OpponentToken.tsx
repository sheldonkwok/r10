import type { GamePlayer } from "game";
import type { CSSProperties } from "react";
import { Card } from "../Card.tsx";

type SuitShort = "h" | "d" | "c" | "s";

interface OpponentTokenProps {
  player: GamePlayer;
  position: { x: number; y: number };
  isTheirTurn: boolean;
  isFirstOut: boolean;
  revealHand: boolean;
}

export function OpponentToken({ player, position, isTheirTurn, isFirstOut, revealHand }: OpponentTokenProps) {
  const teamColor =
    player.team === "red"
      ? "var(--color-team-red)"
      : player.team === "black"
        ? "var(--color-team-black)"
        : null;
  const teamGlow =
    player.team === "red"
      ? "var(--color-team-red-glow)"
      : player.team === "black"
        ? "var(--color-team-black-glow)"
        : null;

  const avatarBoxShadow = teamColor
    ? `inset 0 0 0 3px ${teamColor}, 0 0 12px ${teamGlow}`
    : "inset 0 0 0 3px var(--color-panel-border)";

  const turnRingStyle: CSSProperties | undefined = isTheirTurn
    ? {
        position: "absolute",
        inset: -6,
        boxShadow:
          "0 0 0 3px var(--color-accent), 0 0 16px color-mix(in srgb, var(--color-accent) 67%, transparent)",
        pointerEvents: "none",
      }
    : undefined;

  return (
    <div
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        zIndex: 4,
      }}
    >
      <div style={{ position: "relative", width: 88, height: 56, marginBottom: -4 }}>
        {revealHand
          ? player.hand.slice(0, 5).map((c, k) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: small fan, stable order
                key={k}
                style={{
                  position: "absolute",
                  left: 44 + (k - 2) * 14 - 18,
                  top: 0,
                  transform: `rotate(${(k - 2) * 8}deg)`,
                  transformOrigin: "bottom center",
                }}
              >
                <Card rank={c.rank} suitShort={c.suit.short as SuitShort} width={36} height={52} />
              </div>
            ))
          : [-1, 0, 1].map((k, idx) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: 3-card fan, stable order
                key={idx}
                style={{
                  position: "absolute",
                  left: 44 + k * 12 - 18,
                  top: 0,
                  transform: `rotate(${k * 12}deg)`,
                  transformOrigin: "bottom center",
                }}
              >
                <Card faceDown width={36} height={52} />
              </div>
            ))}
      </div>

      <div style={{ position: "relative" }}>
        {turnRingStyle && <div style={turnRingStyle} />}
        <div
          style={{
            width: 56,
            height: 56,
            background: "var(--color-panel)",
            boxShadow: avatarBoxShadow,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
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
      </div>

      <div
        className="font-pixel"
        style={{
          fontSize: 8,
          color: "var(--color-paper)",
          letterSpacing: 1,
          textShadow: "1px 1px 0 #000",
          maxWidth: 96,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {player.username.toUpperCase()}
      </div>
      <div
        className="font-pixel"
        style={{
          fontSize: 7,
          color: isFirstOut ? "var(--color-accent)" : "var(--color-paper-dim)",
          letterSpacing: 1,
        }}
      >
        {isFirstOut ? "★ FIRST OUT" : `▮ ${player.handSize}`}
      </div>
    </div>
  );
}
