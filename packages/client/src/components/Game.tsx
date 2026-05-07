import {
  canPlay,
  chaGoEligibility,
  isValidChaGoPlay as checkValidChaGoPlay,
  type GamePlayer,
  type GameState,
  play,
} from "game";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { useStageScale } from "@/hooks/useStageScale.ts";
import { Card } from "./Card.tsx";
import { FeltTable } from "./pixel/FeltTable.tsx";
import { PixelButton } from "./pixel/PixelButton.tsx";
import { PixelPanel } from "./pixel/PixelPanel.tsx";

const STAGE_W = 1280;
const STAGE_H = 800;

const OPPONENT_POSITIONS: Array<{ x: number; y: number }> = [
  { x: 110, y: 380 },
  { x: 360, y: 130 },
  { x: 640, y: 100 },
  { x: 920, y: 130 },
  { x: 1170, y: 380 },
];

type SuitShort = "h" | "d" | "c" | "s";

interface GameProps {
  state: GameState;
  currentUserId: string;
  onPlayCards: (cardIndices: number[]) => void;
  onPass: () => void;
  onResetGame: () => void;
}

export function Game({ state, currentUserId, onPlayCards, onPass, onResetGame }: GameProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [revealAll, setRevealAll] = useState(false);
  const scale = useStageScale(STAGE_W, STAGE_H);

  const currentPlayerIndex = state.players.findIndex((p) => p.id === currentUserId);
  const currentPlayer = state.players[currentPlayerIndex];
  const isMyTurn = state.currentTurn === currentPlayerIndex;
  const turnPlayer = state.players[state.currentTurn];

  const chaGoPhase = state.chaGoPhase ?? null;
  const isEligibleForChaGo = useMemo(
    () => chaGoEligibility(state, currentUserId) !== null,
    [state, currentUserId],
  );
  const canInteract = isMyTurn || isEligibleForChaGo;

  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are intentional triggers, not read inside
  useEffect(() => {
    setSelectedIndices(new Set());
  }, [state.currentTurn, state.currentPlay]);

  const toggleCard = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const sortedIndices = useMemo(() => [...selectedIndices].sort((a, b) => a - b), [selectedIndices]);

  const selectedCards = useMemo(() => {
    if (!currentPlayer) return [];
    return sortedIndices
      .filter((i) => i < currentPlayer.hand.length)
      .map((i) => currentPlayer.hand[i])
      .filter((c) => c !== undefined);
  }, [currentPlayer, sortedIndices]);

  const selectedPlay = useMemo(() => {
    if (selectedCards.length === 0) return null;
    return play.get(selectedCards);
  }, [selectedCards]);

  const isValidPlay = useMemo(
    () => canPlay(state, currentUserId, sortedIndices).valid,
    [state, currentUserId, sortedIndices],
  );

  const isValidChaGoPlay = useMemo(
    () => checkValidChaGoPlay(state, currentUserId, sortedIndices),
    [state, currentUserId, sortedIndices],
  );

  const canPass = state.currentPlay !== null && state.lastPlayerId !== currentUserId;

  const handlePlay = () => {
    const validNormal = isValidPlay && isMyTurn;
    const validChaGo = isValidChaGoPlay && isEligibleForChaGo;
    if (!validNormal && !validChaGo) return;
    onPlayCards(sortedIndices);
  };

  const opponents = useMemo(() => {
    if (currentPlayerIndex < 0) return state.players;
    const others = [
      ...state.players.slice(currentPlayerIndex + 1),
      ...state.players.slice(0, currentPlayerIndex),
    ];
    return others;
  }, [state.players, currentPlayerIndex]);

  const playLegal = (isValidPlay && isMyTurn) || (isValidChaGoPlay && isEligibleForChaGo);
  const playLabel =
    isValidChaGoPlay && isEligibleForChaGo
      ? chaGoPhase === "cha-available"
        ? "CHA"
        : "GO"
      : selectedPlay
        ? `PLAY ${selectedPlay.name.toUpperCase()}`
        : "SELECT CARDS";

  const pileType = state.currentPlay?.playType ?? "OPEN";
  const pilePlayer = state.currentPlay
    ? state.players.find((p) => p.id === state.currentPlay?.playerId)
    : null;

  const isDev = !import.meta.env.PROD;

  return (
    <div
      className="scanlines"
      style={{
        position: "fixed",
        inset: 0,
        background: "radial-gradient(ellipse at center, #4a2818 0%, #1a0e08 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: STAGE_W,
          height: STAGE_H,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <FeltTable width={STAGE_W} height={STAGE_H} inset={48} />

        <div style={{ position: "absolute", top: 18, left: 24, zIndex: 5 }}>
          <PixelPanel width={260} height={92} style={{ padding: 12 }}>
            <div className="font-pixel text-[9px] tracking-widest text-[color:var(--color-paper-dim)]">
              ROUND · LIVE
            </div>
            <div className="font-pixel text-[14px] tracking-widest text-[color:var(--color-accent)] mt-1.5">
              TYPE: {pileType.toUpperCase()}
            </div>
            <div className="font-pixel text-[8px] tracking-wider text-[color:var(--color-paper-muted)] mt-1">
              {state.currentPlay
                ? `BEAT ▸ ${pileType.toUpperCase()} BY ${pilePlayer?.username.toUpperCase() ?? ""}`
                : "ANY PLAY ALLOWED"}
            </div>
          </PixelPanel>
        </div>

        <div style={{ position: "absolute", top: 18, right: 24, zIndex: 5 }}>
          <PixelPanel width={210} height={92} accent="var(--color-team-red)" style={{ padding: 12 }}>
            <div className="font-pixel text-[9px] tracking-widest text-[color:var(--color-paper-dim)]">
              STAKES
            </div>
            <div
              className="font-pixel text-[18px] tracking-widest mt-1.5"
              style={{
                color: "var(--color-team-red)",
                textShadow: "0 0 6px var(--color-team-red-glow)",
              }}
            >
              × 1
            </div>
            <div className="font-pixel text-[8px] tracking-wider text-[color:var(--color-paper-muted)] mt-0.5">
              BASE ROUND
            </div>
          </PixelPanel>
        </div>

        {opponents.map((player, idx) => {
          const pos = OPPONENT_POSITIONS[idx % OPPONENT_POSITIONS.length];
          const playerOriginalIndex = state.players.findIndex((p) => p.id === player.id);
          const isTheirTurn = state.currentTurn === playerOriginalIndex;
          const isFirstOut = state.firstFinisherId === player.id;
          return (
            <OpponentToken
              key={player.id}
              player={player}
              position={pos}
              isTheirTurn={isTheirTurn}
              isFirstOut={isFirstOut}
              revealHand={isDev && revealAll}
            />
          );
        })}

        {/* Pile in center */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "44%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            zIndex: 4,
          }}
        >
          {state.currentPlay ? (
            state.currentPlay.cards.map((c, i) => {
              const cnt = state.currentPlay?.cards.length ?? 1;
              const angle = (i - (cnt - 1) / 2) * 6;
              return (
                <div key={`${c.rank}-${c.suit.short}-${i}`} style={{ marginLeft: i === 0 ? 0 : 6 }}>
                  <Card
                    rank={c.rank}
                    suitShort={c.suit.short as SuitShort}
                    width={88}
                    height={124}
                    rotate={angle}
                  />
                </div>
              );
            })
          ) : (
            <div
              className="font-pixel text-[10px] tracking-widest"
              style={{ color: "var(--color-paper-muted)" }}
            >
              ◂ EMPTY PILE ▸
            </div>
          )}
        </div>
        {state.currentPlay && (
          <div
            className="font-pixel text-[9px] tracking-widest"
            style={{
              position: "absolute",
              left: "50%",
              top: "61%",
              transform: "translateX(-50%)",
              color: "var(--color-paper-muted)",
              zIndex: 4,
            }}
          >
            ◂ {pilePlayer?.username.toUpperCase() ?? ""} PLAYED ▸
          </div>
        )}

        {/* Turn indicator */}
        {state.winningTeam === null && (
          <div
            className="font-pixel"
            style={{
              position: "absolute",
              left: "50%",
              bottom: 240,
              transform: "translateX(-50%)",
              fontSize: 14,
              color: isMyTurn ? "var(--color-accent)" : "var(--color-paper-dim)",
              letterSpacing: 4,
              textShadow: isMyTurn
                ? "2px 2px 0 #000, 0 0 12px color-mix(in srgb, var(--color-accent) 67%, transparent)"
                : "2px 2px 0 #000",
              zIndex: 5,
              animation: isMyTurn ? "pixel-float 1.6s ease-in-out infinite" : undefined,
            }}
          >
            {isMyTurn ? "▼ YOUR TURN ▼" : `WAITING FOR ${turnPlayer?.username.toUpperCase() ?? ""}`}
          </div>
        )}

        {/* Cha-Go badge */}
        {chaGoPhase && isEligibleForChaGo && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: 280,
              transform: "translateX(-50%)",
              zIndex: 5,
            }}
          >
            <PixelPanel
              accent="var(--color-accent)"
              glow="color-mix(in srgb, var(--color-accent) 67%, transparent)"
              style={{ padding: "6px 12px" }}
            >
              <div className="font-pixel text-[10px] tracking-widest text-[color:var(--color-accent)]">
                {chaGoPhase === "cha-available" ? "▸ CHA AVAILABLE ◂" : "▸ GO AVAILABLE ◂"}
              </div>
            </PixelPanel>
          </div>
        )}

        {/* Hand */}
        {currentPlayer && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: 28,
              transform: "translateX(-50%)",
              display: "flex",
              zIndex: 6,
            }}
          >
            {currentPlayer.hand.map((c, i) => {
              const cnt = currentPlayer.hand.length;
              const angle = (i - (cnt - 1) / 2) * 3;
              const isRedTen = c.rank === 10 && (c.suit.short === "h" || c.suit.short === "d");
              const isSel = selectedIndices.has(i);
              return (
                <div key={`${c.rank}-${c.suit.short}-${i}`} style={{ marginLeft: i === 0 ? 0 : -34 }}>
                  <Card
                    rank={c.rank}
                    suitShort={c.suit.short as SuitShort}
                    width={88}
                    height={124}
                    rotate={angle}
                    selectable={canInteract}
                    selected={isSel}
                    glow={isSel ? "var(--color-accent)" : isRedTen ? "var(--color-team-red-glow)" : null}
                    onClick={canInteract ? () => toggleCard(i) : undefined}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Action area right */}
        {canInteract && state.winningTeam === null && (
          <div
            style={{
              position: "absolute",
              right: 24,
              bottom: 24,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              zIndex: 6,
            }}
          >
            <PixelButton
              tone={playLegal ? "success" : "muted"}
              dim={!playLegal}
              disabled={!playLegal}
              onClick={handlePlay}
            >
              {playLabel}
            </PixelButton>
            {isMyTurn && (
              <PixelButton
                tone={canPass ? "accent" : "muted"}
                dim={!canPass}
                disabled={!canPass}
                onClick={onPass}
              >
                SKIP
              </PixelButton>
            )}
            <PixelButton
              tone="muted"
              dim={selectedIndices.size === 0}
              disabled={selectedIndices.size === 0}
              onClick={() => setSelectedIndices(new Set())}
            >
              CLEAR
            </PixelButton>
          </div>
        )}

        {/* Selection feedback left */}
        {canInteract && selectedPlay && state.winningTeam === null && (
          <div
            style={{
              position: "absolute",
              left: 24,
              bottom: 24,
              zIndex: 6,
            }}
          >
            <PixelPanel
              width={280}
              accent={playLegal ? "var(--color-success)" : "var(--color-danger)"}
              style={{ padding: 12 }}
            >
              <div
                className="font-pixel text-[9px] tracking-widest"
                style={{ color: playLegal ? "var(--color-success)" : "var(--color-danger)" }}
              >
                {playLegal ? "✓ LEGAL PLAY" : "✗ ILLEGAL"}
              </div>
              <div className="font-pixel text-[8px] tracking-wider text-[color:var(--color-paper)] mt-1.5">
                {selectedPlay.name.toUpperCase()}: {selectedCards.map((c) => c.display).join(" ")}
              </div>
              <div className="font-pixel text-[7px] tracking-wider text-[color:var(--color-paper-muted)] mt-1">
                {playLegal
                  ? "PRESS PLAY TO COMMIT"
                  : state.currentPlay
                    ? `MUST BEAT ${pileType.toUpperCase()}`
                    : "INVALID HAND"}
              </div>
            </PixelPanel>
          </div>
        )}

        {/* Game over overlay */}
        {state.winningTeam !== null && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(10, 6, 4, 0.78)",
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PixelPanel
              width={520}
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
                  fontSize: 28,
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
                  ★ FIRST OUT:{" "}
                  {state.players.find((p) => p.id === state.firstFinisherId)?.username.toUpperCase()}
                </div>
              )}
              {state.losingTeam && (
                <div className="font-pixel text-[8px] tracking-wider text-[color:var(--color-paper-muted)] mt-2">
                  LOSING TEAM: {state.losingTeam.toUpperCase()}
                </div>
              )}
              {state.hostId === currentUserId && (
                <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
                  <PixelButton tone="accent" onClick={onResetGame}>
                    NEXT ROUND ▸
                  </PixelButton>
                </div>
              )}
            </PixelPanel>
          </div>
        )}

        {/* Dev reveal toggle */}
        {isDev && (
          <div style={{ position: "absolute", left: 24, top: 120, zIndex: 6 }}>
            <PixelButton tone={revealAll ? "danger" : "muted"} onClick={() => setRevealAll((v) => !v)}>
              {revealAll ? "HIDE" : "REVEAL"}
            </PixelButton>
          </div>
        )}
      </div>
    </div>
  );
}

interface OpponentTokenProps {
  player: GamePlayer;
  position: { x: number; y: number };
  isTheirTurn: boolean;
  isFirstOut: boolean;
  revealHand: boolean;
}

function OpponentToken({ player, position, isTheirTurn, isFirstOut, revealHand }: OpponentTokenProps) {
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
      {/* Card-back fan or revealed mini hand */}
      <div
        style={{
          position: "relative",
          width: 88,
          height: 56,
          marginBottom: -4,
        }}
      >
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
