import type { GamePlayer } from "game";
import type { CSSProperties } from "react";
import { Card } from "../Card.tsx";

interface MobileTopOpponentProps {
  player: GamePlayer;
  x: number;
  y: number;
  isTheirTurn: boolean;
  isFirstOut: boolean;
}

export function MobileTopOpponent({ player, x, y, isTheirTurn, isFirstOut }: MobileTopOpponentProps) {
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

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        zIndex: 4,
      }}
    >
      <div style={{ position: "relative", width: 44, height: 28, marginBottom: -2 }}>
        {([-1, 0, 1] as const).map((k, idx) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: 3-card fan, stable order
            key={idx}
            style={{
              position: "absolute",
              left: 22 + k * 8 - 11,
              top: 0,
              transform: `rotate(${k * 12}deg)`,
              transformOrigin: "bottom center",
            }}
          >
            <Card faceDown width={22} height={32} />
          </div>
        ))}
      </div>

      <div style={{ position: "relative" }}>
        {isTheirTurn && (
          <div
            style={{
              position: "absolute",
              inset: -4,
              boxShadow:
                "0 0 0 2px var(--color-accent), 0 0 10px color-mix(in srgb, var(--color-accent) 67%, transparent)",
              pointerEvents: "none",
            }}
          />
        )}
        <div
          style={{
            width: 40,
            height: 40,
            background: "var(--color-panel)",
            boxShadow: teamColor
              ? `inset 0 0 0 3px ${teamColor}, 0 0 10px ${teamGlow}`
              : "inset 0 0 0 3px var(--color-panel-border)",
            overflow: "hidden",
          }}
        >
          <img
            src={player.avatarUrl}
            alt={player.username}
            width={40}
            height={40}
            style={{ display: "block", imageRendering: "pixelated" }}
          />
        </div>
      </div>

      <div
        className="font-pixel"
        style={{
          fontSize: 7,
          color: "var(--color-paper)",
          letterSpacing: 1,
          textShadow: "1px 1px 0 #000",
          maxWidth: 70,
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
          fontSize: 6,
          color: isFirstOut ? "var(--color-accent)" : "var(--color-paper-dim)",
          letterSpacing: 1,
        }}
      >
        {isFirstOut ? "★1ST" : `▮ ${player.handSize}`}
      </div>
    </div>
  );
}

interface MobileSideOpponentProps {
  player: GamePlayer;
  side: "left" | "right";
  y: number;
  isTheirTurn: boolean;
  isFirstOut: boolean;
}

export function MobileSideOpponent({ player, side, y, isTheirTurn, isFirstOut }: MobileSideOpponentProps) {
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

  const posStyle: CSSProperties =
    side === "left"
      ? { position: "absolute", left: 14, top: y }
      : { position: "absolute", right: 14, top: y };

  return (
    <div
      style={{
        ...posStyle,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        zIndex: 4,
      }}
    >
      <div style={{ position: "relative" }}>
        {isTheirTurn && (
          <div
            style={{
              position: "absolute",
              inset: -3,
              boxShadow:
                "0 0 0 2px var(--color-accent), 0 0 8px color-mix(in srgb, var(--color-accent) 67%, transparent)",
              pointerEvents: "none",
            }}
          />
        )}
        <div
          style={{
            width: 38,
            height: 38,
            background: "var(--color-panel)",
            boxShadow: teamColor
              ? `inset 0 0 0 3px ${teamColor}, 0 0 10px ${teamGlow}`
              : "inset 0 0 0 3px var(--color-panel-border)",
            overflow: "hidden",
          }}
        >
          <img
            src={player.avatarUrl}
            alt={player.username}
            width={38}
            height={38}
            style={{ display: "block", imageRendering: "pixelated" }}
          />
        </div>
      </div>
      <div
        className="font-pixel"
        style={{
          fontSize: 6,
          color: "var(--color-paper)",
          letterSpacing: 1,
          textShadow: "1px 1px 0 #000",
          maxWidth: 50,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {player.username.toUpperCase()}
      </div>
      <div
        className="font-pixel"
        style={{ fontSize: 6, color: isFirstOut ? "var(--color-accent)" : "var(--color-paper-dim)" }}
      >
        {isFirstOut ? "★1ST" : `▮ ${player.handSize}`}
      </div>
    </div>
  );
}
