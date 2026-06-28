import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, horizontalListSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  canPlay,
  chaGoEligibility,
  isValidChaGoPlay as checkValidChaGoPlay,
  type GamePlayer,
  type GameState,
  play,
} from "game";
import { type CSSProperties, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useMobile } from "@/hooks/useMobile.ts";
import { useStageScale } from "@/hooks/useStageScale.ts";
import { Card } from "./Card.tsx";
import { FeltTable } from "./pixel/FeltTable.tsx";
import { PixelButton } from "./pixel/PixelButton.tsx";
import { PixelPanel } from "./pixel/PixelPanel.tsx";

const STAGE_W = 1280;
const STAGE_H = 800;
const MOBILE_W = 430;
const MOBILE_H = 932;

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

interface SortableHandCardProps {
  id: string;
  marginLeft: number;
  scale: number;
  children: ReactNode;
}

function SortableHandCard({ id, marginLeft, scale, children }: SortableHandCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  // dnd-kit reports pointer/layout deltas in screen px, but they're applied inside a
  // CSS-scaled container — divide by scale so on-screen movement matches the cursor.
  const adjusted = transform ? { ...transform, x: transform.x / scale, y: transform.y / scale } : null;
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        marginLeft,
        transform: CSS.Transform.toString(adjusted),
        transition,
        zIndex: isDragging ? 50 : undefined,
        position: isDragging ? "relative" : undefined,
        touchAction: "none",
      }}
    >
      {children}
    </div>
  );
}

export function Game({ state, currentUserId, onPlayCards, onPass, onResetGame }: GameProps) {
  const isMobile = useMobile();
  const SW = isMobile ? MOBILE_W : STAGE_W;
  const SH = isMobile ? MOBILE_H : STAGE_H;

  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [localHand, setLocalHand] = useState<GamePlayer["hand"]>([]);
  const [revealAll, setRevealAll] = useState(false);
  const scale = useStageScale(SW, SH);

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

  const handKey =
    currentPlayer?.hand
      .map((c) => `${c.rank}${c.suit.short}`)
      .sort()
      .join(",") ?? "";
  // biome-ignore lint/correctness/useExhaustiveDependencies: handKey encodes full hand identity
  useEffect(() => {
    if (!currentPlayer) return;
    setLocalHand(currentPlayer.hand);
    setSelectedIndices(new Set());
  }, [handKey]);

  const toggleCard = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = useCallback((_event: DragStartEvent) => {
    setSelectedIndices(new Set());
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setLocalHand((prev) => {
      const oldIndex = prev.findIndex((c) => `${c.rank}-${c.suit.short}` === active.id);
      const newIndex = prev.findIndex((c) => `${c.rank}-${c.suit.short}` === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const sortedIndices = useMemo(() => [...selectedIndices].sort((a, b) => a - b), [selectedIndices]);

  const selectedCards = useMemo(
    () =>
      sortedIndices
        .filter((i) => i < localHand.length)
        .map((i) => localHand[i])
        .filter((c) => c !== undefined),
    [localHand, sortedIndices],
  );

  const serverSortedIndices = useMemo(() => {
    if (!currentPlayer) return [];
    return sortedIndices
      .map((localIdx) => {
        const card = localHand[localIdx];
        if (!card) return -1;
        return currentPlayer.hand.findIndex((c) => c.rank === card.rank && c.suit.short === card.suit.short);
      })
      .filter((i) => i >= 0)
      .sort((a, b) => a - b);
  }, [sortedIndices, localHand, currentPlayer]);

  const selectedPlay = useMemo(() => {
    if (selectedCards.length === 0) return null;
    return play.get(selectedCards);
  }, [selectedCards]);

  const isValidPlay = useMemo(
    () => canPlay(state, currentUserId, serverSortedIndices).valid,
    [state, currentUserId, serverSortedIndices],
  );

  const isValidChaGoPlay = useMemo(
    () => checkValidChaGoPlay(state, currentUserId, serverSortedIndices),
    [state, currentUserId, serverSortedIndices],
  );

  const canPass = state.currentPlay !== null && state.lastPlayerId !== currentUserId;

  const handlePlay = () => {
    const validNormal = isValidPlay && isMyTurn;
    const validChaGo = isValidChaGoPlay && isEligibleForChaGo;
    if (!validNormal && !validChaGo) return;
    onPlayCards(serverSortedIndices);
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

  // Layout values that differ between desktop and mobile
  const pileCardW = isMobile ? 72 : 88;
  const pileCardH = isMobile ? 102 : 124;
  const handCardW = isMobile ? 62 : 88;
  const handCardH = isMobile ? 88 : 124;
  const handOverlap = isMobile ? -20 : -34;
  const handFanMult = isMobile ? 2.5 : 3;
  const LOWER_ZONE_H = SH * 0.42;

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
          width: SW,
          height: SH,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          overflow: "hidden",
        }}
      >
        {/* ── DESKTOP-ONLY ELEMENTS ── */}
        {!isMobile && <FeltTable width={SW} height={SH} inset={48} />}

        {!isMobile && (
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
        )}

        {!isMobile && (
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
        )}

        {/* ── MOBILE-ONLY ELEMENTS ── */}
        {isMobile && <MStatusBar />}

        {isMobile && (
          <div
            style={{
              position: "absolute",
              top: 46,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "space-between",
              padding: "0 14px",
              zIndex: 5,
            }}
          >
            <PixelPanel width={150} height={58} style={{ padding: 8 }}>
              <div className="font-pixel text-[7px] tracking-widest text-[color:var(--color-paper-dim)]">
                ROUND · LIVE
              </div>
              <div className="font-pixel text-[11px] tracking-widest text-[color:var(--color-accent)] mt-1">
                {pileType.toUpperCase()}
              </div>
              <div className="font-pixel text-[6px] tracking-widest text-[color:var(--color-paper-muted)] mt-0.5">
                {state.currentPlay ? `BEAT ${pileType.toUpperCase()}` : "ANY PLAY"}
              </div>
            </PixelPanel>
            <PixelPanel width={120} height={58} accent="var(--color-team-red)" style={{ padding: 8 }}>
              <div className="font-pixel text-[7px] tracking-widest text-[color:var(--color-paper-dim)]">
                STAKES
              </div>
              <div
                className="font-pixel text-[15px] tracking-widest mt-1"
                style={{ color: "var(--color-team-red)", textShadow: "0 0 6px var(--color-team-red-glow)" }}
              >
                ×1
              </div>
            </PixelPanel>
          </div>
        )}

        {/* ── OPPONENTS ── */}
        {isMobile ? (
          <>
            {/* Mobile: top 3 + 2 sides */}
            {([0, 1, 2] as const).map((slot) => {
              const opp = opponents[slot];
              if (!opp) return null;
              const xPct = [0.22, 0.5, 0.78][slot];
              const oppIdx = state.players.findIndex((p) => p.id === opp.id);
              return (
                <MobileTopOpponent
                  key={opp.id}
                  player={opp}
                  x={SW * xPct}
                  y={124}
                  isTheirTurn={state.currentTurn === oppIdx}
                  isFirstOut={state.firstFinisherId === opp.id}
                />
              );
            })}
            {opponents[3] &&
              (() => {
                const opp = opponents[3];
                const oppIdx = state.players.findIndex((p) => p.id === opp.id);
                return (
                  <MobileSideOpponent
                    key={opp.id}
                    player={opp}
                    side="left"
                    y={300}
                    isTheirTurn={state.currentTurn === oppIdx}
                    isFirstOut={state.firstFinisherId === opp.id}
                  />
                );
              })()}
            {opponents[4] &&
              (() => {
                const opp = opponents[4];
                const oppIdx = state.players.findIndex((p) => p.id === opp.id);
                return (
                  <MobileSideOpponent
                    key={opp.id}
                    player={opp}
                    side="right"
                    y={300}
                    isTheirTurn={state.currentTurn === oppIdx}
                    isFirstOut={state.firstFinisherId === opp.id}
                  />
                );
              })()}
          </>
        ) : (
          opponents.map((player, idx) => {
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
          })
        )}

        {/* ── PILE ── */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: isMobile ? 310 : "44%",
            transform: isMobile ? "translateX(-50%)" : "translate(-50%, -50%)",
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
                    width={pileCardW}
                    height={pileCardH}
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
              top: isMobile ? 424 : "61%",
              transform: "translateX(-50%)",
              color: "var(--color-paper-muted)",
              zIndex: 4,
              whiteSpace: "nowrap",
            }}
          >
            ◂ {pilePlayer?.username.toUpperCase() ?? ""} PLAYED ▸
          </div>
        )}

        {/* ── TURN INDICATOR ── */}
        {state.winningTeam === null && (
          <div
            className="font-pixel"
            style={{
              position: "absolute",
              left: "50%",
              ...(isMobile ? { top: SH * 0.55 } : { bottom: 240 }),
              transform: "translateX(-50%)",
              fontSize: 14,
              color: isMyTurn ? "var(--color-accent)" : "var(--color-paper-dim)",
              letterSpacing: 4,
              textShadow: isMyTurn
                ? "2px 2px 0 #000, 0 0 12px color-mix(in srgb, var(--color-accent) 67%, transparent)"
                : "2px 2px 0 #000",
              zIndex: 5,
              animation: isMyTurn ? "pixel-float 1.6s ease-in-out infinite" : undefined,
              whiteSpace: "nowrap",
            }}
          >
            {isMyTurn ? "▼ YOUR TURN ▼" : `WAITING FOR ${turnPlayer?.username.toUpperCase() ?? ""}`}
          </div>
        )}

        {/* ── CHA-GO BADGE ── */}
        {chaGoPhase && isEligibleForChaGo && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              ...(isMobile ? { top: SH * 0.47 } : { bottom: 280 }),
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

        {/* ── DESKTOP: SELECTION FEEDBACK (bottom-left) ── */}
        {!isMobile && canInteract && selectedPlay && state.winningTeam === null && (
          <div style={{ position: "absolute", left: 24, bottom: 24, zIndex: 6 }}>
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

        {/* ── DESKTOP: HAND + BUTTONS ── */}
        {!isMobile && (
          <>
            {currentPlayer && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={localHand.map((c) => `${c.rank}-${c.suit.short}`)}
                  strategy={horizontalListSortingStrategy}
                >
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
                    {localHand.map((c, i) => {
                      const cnt = localHand.length;
                      const angle = (i - (cnt - 1) / 2) * handFanMult;
                      const isRedTen = c.rank === 10 && (c.suit.short === "h" || c.suit.short === "d");
                      const isSel = selectedIndices.has(i);
                      const id = `${c.rank}-${c.suit.short}`;
                      return (
                        <SortableHandCard
                          key={id}
                          id={id}
                          marginLeft={i === 0 ? 0 : handOverlap}
                          scale={scale}
                        >
                          <Card
                            rank={c.rank}
                            suitShort={c.suit.short as SuitShort}
                            width={handCardW}
                            height={handCardH}
                            rotate={angle}
                            selectable={canInteract}
                            selected={isSel}
                            glow={
                              isSel ? "var(--color-accent)" : isRedTen ? "var(--color-team-red-glow)" : null
                            }
                            onClick={canInteract ? () => toggleCard(i) : undefined}
                          />
                        </SortableHandCard>
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}

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

            {isDev && (
              <div style={{ position: "absolute", left: 24, top: 120, zIndex: 6 }}>
                <PixelButton tone={revealAll ? "danger" : "muted"} onClick={() => setRevealAll((v) => !v)}>
                  {revealAll ? "HIDE" : "REVEAL"}
                </PixelButton>
              </div>
            )}
          </>
        )}

        {/* ── MOBILE: LOWER THUMB ZONE ── */}
        {isMobile && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: LOWER_ZONE_H,
              background: "linear-gradient(0deg, #150a05 70%, transparent)",
              zIndex: 6,
            }}
          >
            {/* Mobile selection feedback */}
            {canInteract && selectedPlay && state.winningTeam === null && (
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 7,
                }}
              >
                <PixelPanel
                  width={290}
                  height={56}
                  accent={playLegal ? "var(--color-success)" : "var(--color-danger)"}
                  style={{
                    padding: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      className="font-pixel text-[9px] tracking-widest"
                      style={{ color: playLegal ? "var(--color-success)" : "var(--color-danger)" }}
                    >
                      {playLegal ? "✓ LEGAL" : "✗ ILLEGAL"}
                    </div>
                    <div className="font-pixel text-[7px] tracking-widest text-[color:var(--color-paper)] mt-1">
                      {selectedPlay.name.toUpperCase()}
                    </div>
                  </div>
                  <div
                    className="font-pixel text-[6px] tracking-widest text-[color:var(--color-paper-muted)]"
                    style={{ maxWidth: 90, textAlign: "right" }}
                  >
                    {playLegal ? "TAP PLAY" : state.currentPlay ? `BEAT ${pileType}` : "INVALID"}
                  </div>
                </PixelPanel>
              </div>
            )}

            {/* Mobile hand */}
            {currentPlayer && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={localHand.map((c) => `${c.rank}-${c.suit.short}`)}
                  strategy={horizontalListSortingStrategy}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 78,
                      left: "50%",
                      transform: "translateX(-50%)",
                      display: "flex",
                      zIndex: 7,
                    }}
                  >
                    {localHand.map((c, i) => {
                      const cnt = localHand.length;
                      const angle = (i - (cnt - 1) / 2) * handFanMult;
                      const isRedTen = c.rank === 10 && (c.suit.short === "h" || c.suit.short === "d");
                      const isSel = selectedIndices.has(i);
                      const id = `${c.rank}-${c.suit.short}`;
                      return (
                        <SortableHandCard
                          key={id}
                          id={id}
                          marginLeft={i === 0 ? 0 : handOverlap}
                          scale={scale}
                        >
                          <Card
                            rank={c.rank}
                            suitShort={c.suit.short as SuitShort}
                            width={handCardW}
                            height={handCardH}
                            rotate={angle}
                            selectable={canInteract}
                            selected={isSel}
                            glow={
                              isSel ? "var(--color-accent)" : isRedTen ? "var(--color-team-red-glow)" : null
                            }
                            onClick={canInteract ? () => toggleCard(i) : undefined}
                          />
                        </SortableHandCard>
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {/* Mobile thumb buttons */}
            {canInteract && state.winningTeam === null && (
              <div
                style={{
                  position: "absolute",
                  bottom: 38,
                  left: 0,
                  right: 0,
                  padding: "0 18px",
                  display: "flex",
                  gap: 10,
                  zIndex: 7,
                }}
              >
                <PixelButton
                  tone="muted"
                  dim={!canPass}
                  disabled={!canPass}
                  onClick={onPass}
                  style={{ fontSize: 11, padding: "20px 18px" }}
                >
                  SKIP
                </PixelButton>
                <PixelButton
                  tone={playLegal ? "success" : "muted"}
                  dim={!playLegal}
                  disabled={!playLegal}
                  onClick={handlePlay}
                  style={{ fontSize: 13, padding: "20px 0", flex: 1 }}
                >
                  {playLabel}
                </PixelButton>
              </div>
            )}
          </div>
        )}

        {isMobile && <MHomeBar />}

        {/* ── GAME OVER OVERLAY ── */}
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
        )}
      </div>
    </div>
  );
}

// ── Desktop opponent token ──────────────────────────────────────

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

// ── Mobile opponent tokens ──────────────────────────────────────

interface MobileTopOpponentProps {
  player: GamePlayer;
  x: number;
  y: number;
  isTheirTurn: boolean;
  isFirstOut: boolean;
}

function MobileTopOpponent({ player, x, y, isTheirTurn, isFirstOut }: MobileTopOpponentProps) {
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

function MobileSideOpponent({ player, side, y, isTheirTurn, isFirstOut }: MobileSideOpponentProps) {
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

// ── Mobile chrome (decorative) ──────────────────────────────────

function MStatusBar() {
  return (
    <div
      className="font-pixel"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        zIndex: 80,
        fontSize: 10,
        color: "var(--color-paper)",
        letterSpacing: 1,
      }}
    >
      <div>9:41</div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 8 }}>▮▮▮</span>
        <span style={{ fontSize: 8 }}>≋</span>
        <span style={{ fontSize: 8 }}>96%</span>
      </div>
    </div>
  );
}

function MHomeBar() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 8,
        left: "50%",
        transform: "translateX(-50%)",
        width: 130,
        height: 5,
        background: "var(--color-paper)",
        opacity: 0.5,
        zIndex: 95,
      }}
    />
  );
}
