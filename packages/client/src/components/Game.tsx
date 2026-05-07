import { compare, type GameState, play } from "game";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card } from "./Card.tsx";

interface GameProps {
  state: GameState;
  currentUserId: string;
  onPlayCards: (cardIndices: number[]) => void;
  onPass: () => void;
  onResetGame: () => void;
}

function suitVariant(card: { suit: { short: string } }): "red" | "black" {
  return card.suit.short === "h" || card.suit.short === "d" ? "red" : "black";
}

export function Game({ state, currentUserId, onPlayCards, onPass, onResetGame }: GameProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [revealAll, setRevealAll] = useState(false);

  const currentPlayerIndex = state.players.findIndex((p) => p.id === currentUserId);
  const currentPlayer = state.players[currentPlayerIndex];
  const isMyTurn = state.currentTurn === currentPlayerIndex;
  const turnPlayer = state.players[state.currentTurn];

  const chaGoPhase = state.chaGoPhase ?? null;
  const isEligibleForChaGo = useMemo(() => {
    if (chaGoPhase === null) return false;
    if (state.lastPlayerId === currentUserId) return false;
    if (!currentPlayer || !state.currentPlay) return false;
    const currentPlayObj = play.get(state.currentPlay.cards);
    const matchingCards = currentPlayer.hand.filter((c) => c.value === currentPlayObj.value);
    if (chaGoPhase === "cha-available") return matchingCards.length >= 2;
    return matchingCards.length >= 1;
  }, [chaGoPhase, state.lastPlayerId, currentUserId, currentPlayer, state.currentPlay]);
  const canInteract = isMyTurn || isEligibleForChaGo;

  // Clear selection when turn changes or after playing
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are intentional triggers, not read inside
  useEffect(() => {
    setSelectedIndices(new Set());
  }, [state.currentTurn, state.currentPlay]);

  const toggleCard = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const selectedCards = useMemo(() => {
    if (!currentPlayer) return [];
    return [...selectedIndices]
      .sort((a, b) => a - b)
      .filter((i) => i < currentPlayer.hand.length)
      .map((i) => currentPlayer.hand[i])
      .filter((c) => c !== undefined);
  }, [currentPlayer, selectedIndices]);

  const selectedPlay = useMemo(() => {
    if (selectedCards.length === 0) return null;
    return play.get(selectedCards);
  }, [selectedCards]);

  const isValidPlay = useMemo(() => {
    if (!selectedPlay || selectedPlay.name === "Illegal") return false;
    if (state.chaGoLocked) return false;

    // If there's a current play to beat and it's not our own play
    if (state.currentPlay && state.lastPlayerId !== currentUserId) {
      const currentPlayObj = play.get(state.currentPlay.cards);
      const result = compare(currentPlayObj, selectedPlay);
      return result.valid;
    }

    return true;
  }, [selectedPlay, state.currentPlay, state.lastPlayerId, currentUserId, state.chaGoLocked]);

  const isValidChaGoPlay = useMemo(() => {
    if (!chaGoPhase || !selectedPlay || !state.currentPlay) return false;
    if (state.lastPlayerId === currentUserId) return false;
    const currentPlayObj = play.get(state.currentPlay.cards);
    if (chaGoPhase === "cha-available") {
      return selectedPlay.name === "Pair" && selectedPlay.value === currentPlayObj.value;
    }
    return selectedPlay.name === "Single" && selectedPlay.value === currentPlayObj.value;
  }, [chaGoPhase, selectedPlay, state.currentPlay, state.lastPlayerId, currentUserId]);

  const canPass = state.currentPlay !== null && state.lastPlayerId !== currentUserId;

  const handlePlay = () => {
    const validNormal = isValidPlay && isMyTurn;
    const validChaGo = isValidChaGoPlay && isEligibleForChaGo;
    if (!validNormal && !validChaGo) return;
    const indices = [...selectedIndices].sort((a, b) => a - b);
    onPlayCards(indices);
  };

  const renderPlayerRow = (player: (typeof state.players)[number], playerIndex: number) => {
    const isCurrentUser = player.id === currentUserId;
    const isTheirTurn = state.currentTurn === playerIndex;
    const debugPlayer =
      !import.meta.env.PROD && revealAll ? state.debugState?.players[playerIndex] : undefined;
    const displayPlayer = debugPlayer ?? player;
    const showRealHand = isCurrentUser || !!debugPlayer;
    const teamColor =
      displayPlayer.team === "red"
        ? "text-red-500"
        : displayPlayer.team === "black"
          ? "text-gray-800"
          : "text-gray-400";
    return (
      <div
        key={player.id}
        className={cn("player-row", isCurrentUser && "current", isTheirTurn && "active-turn")}
      >
        <div className="player-info">
          <img src={player.avatarUrl} alt={player.username} width={32} height={32} />
          <span className={cn("player-name", teamColor)}>
            {player.username}
            {displayPlayer.team === null && " (?)"}
          </span>
          {isTheirTurn && <span className="turn-indicator">◀</span>}
          {displayPlayer.team !== null && displayPlayer.team === state.losingTeam && <span>Loser</span>}
        </div>
        <div className="flex flex-row flex-nowrap gap-1 overflow-x-auto">
          {showRealHand
            ? displayPlayer.hand.map((card, i) => (
                <Card
                  key={`${card.rank}-${card.suit.short}-${i}`}
                  rank={card.rank}
                  suitEmoji={card.suit.emoji}
                  suit={suitVariant(card)}
                  selectable={isCurrentUser && canInteract}
                  selected={isCurrentUser && selectedIndices.has(i)}
                  onClick={isCurrentUser && canInteract ? () => toggleCard(i) : undefined}
                />
              ))
            : Array.from({ length: player.handSize }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: stable placeholder list
                <Card key={i} faceDown />
              ))}
        </div>
      </div>
    );
  };

  return (
    <div className="game">
      {!import.meta.env.PROD && (
        <Button variant="outline" size="sm" onClick={() => setRevealAll((v) => !v)}>
          {revealAll ? "Hide" : "Reveal All"}
        </Button>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h1>Red 10</h1>

          <div className="turn-info">
            {isMyTurn ? <strong>Your turn!</strong> : <span>Waiting for {turnPlayer?.username}...</span>}
            {isEligibleForChaGo && (
              <strong>{chaGoPhase === "cha-available" ? "You can CHA!" : "You can GO!"}</strong>
            )}
          </div>

          {state.currentPlay && (
            <div className="flex flex-row flex-nowrap gap-1 items-center overflow-x-auto">
              <span>Current play ({state.currentPlay.playType}): </span>
              {state.currentPlay.cards.map((c, i) => (
                <Card
                  key={`${c.rank}-${c.suit.short}-${i}`}
                  rank={c.rank}
                  suitEmoji={c.suit.emoji}
                  suit={suitVariant(c)}
                />
              ))}
              <span> by {state.players.find((p) => p.id === state.currentPlay?.playerId)?.username}</span>
            </div>
          )}

          {chaGoPhase && isEligibleForChaGo && (
            <div className="cha-go-indicator">
              <strong>{chaGoPhase === "cha-available" ? "CHA available!" : "GO available!"}</strong>
            </div>
          )}

          {currentPlayer && canInteract && state.winningTeam === null && (
            <div className="play-area">
              <div className="selection-info">
                {selectedCards.length === 0 ? (
                  <span>Select cards to play</span>
                ) : (
                  <span>
                    {selectedPlay?.name}: {selectedCards.map((c) => c.display).join(" ")}
                  </span>
                )}
              </div>
              <Button
                onClick={handlePlay}
                disabled={!(isValidPlay && isMyTurn) && !(isValidChaGoPlay && isEligibleForChaGo)}
              >
                {isValidChaGoPlay && isEligibleForChaGo
                  ? chaGoPhase === "cha-available"
                    ? "CHA"
                    : "GO"
                  : `Play ${selectedPlay?.name ?? ""}`}
              </Button>
              {isMyTurn && (
                <Button onClick={onPass} disabled={!canPass}>
                  Pass
                </Button>
              )}
              <Button onClick={() => setSelectedIndices(new Set())} disabled={selectedCards.length === 0}>
                Clear
              </Button>
            </div>
          )}

          {state.winningTeam && (
            <div className="game-over">
              {state.winningTeam === "wash" ? (
                <strong>Wash! (tie)</strong>
              ) : (
                <strong>{state.winningTeam === "red" ? "Red" : "Black"} team wins!</strong>
              )}
              <span>First out: {state.players.find((p) => p.id === state.firstFinisherId)?.username}</span>
              <span>Losing team: {state.losingTeam}</span>
              {state.hostId === currentUserId && <Button onClick={onResetGame}>Restart Game</Button>}
            </div>
          )}

          {state.players.flatMap((player, playerIndex) =>
            player.id === currentUserId ? [renderPlayerRow(player, playerIndex)] : [],
          )}
        </div>

        <div className="players-list">
          {state.players.flatMap((player, playerIndex) =>
            player.id !== currentUserId ? [renderPlayerRow(player, playerIndex)] : [],
          )}
        </div>
      </div>
    </div>
  );
}
