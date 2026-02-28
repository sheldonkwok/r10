import { useState, useMemo, useEffect } from "react";
import { play, compare, type GameState } from "shared";
import { Card } from "./Card.tsx";
import { Button } from "@/components/ui/button";

interface GameProps {
  state: GameState;
  currentUserId: string;
  onPlayCards: (cardIndices: number[]) => void;
  onPass: () => void;
}

function suitVariant(card: { suit: { short: string } }): "red" | "black" {
  return card.suit.short === "h" || card.suit.short === "d" ? "red" : "black";
}

export function Game({ state, currentUserId, onPlayCards, onPass }: GameProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const currentPlayerIndex = state.players.findIndex((p) => p.id === currentUserId);
  const currentPlayer = state.players[currentPlayerIndex];
  const isMyTurn = state.currentTurn === currentPlayerIndex;
  const turnPlayer = state.players[state.currentTurn];

  // Clear selection when turn changes or after playing
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

    // If there's a current play to beat and it's not our own play
    if (state.currentPlay && state.lastPlayerId !== currentUserId) {
      const currentPlayObj = play.get(state.currentPlay.cards);
      const result = compare(currentPlayObj, selectedPlay);
      return result.valid;
    }

    return true;
  }, [selectedPlay, state.currentPlay, state.lastPlayerId, currentUserId]);

  const canPass = state.currentPlay !== null && state.lastPlayerId !== currentUserId;

  const handlePlay = () => {
    if (!isValidPlay || !isMyTurn) return;
    const indices = [...selectedIndices].sort((a, b) => a - b);
    onPlayCards(indices);
  };

  return (
    <div className="game">
      <h1>Red 10</h1>

      <div className="turn-info">
        {isMyTurn ? (
          <strong>Your turn!</strong>
        ) : (
          <span>Waiting for {turnPlayer?.username}...</span>
        )}
      </div>

      {state.currentPlay && (
        <div className="flex flex-row flex-nowrap gap-1 items-center overflow-x-auto">
          <span>Current play ({state.currentPlay.playType}): </span>
          {state.currentPlay.cards.map((c, i) => (
            <Card key={i} rank={c.rank} suitEmoji={c.suit.emoji} suit={suitVariant(c)} />
          ))}
          <span> by {state.players.find((p) => p.id === state.currentPlay?.playerId)?.username}</span>
        </div>
      )}

      <div className="players-list">
        {state.players.map((player, playerIndex) => {
          const isCurrentUser = player.id === currentUserId;
          const isTheirTurn = state.currentTurn === playerIndex;
          return (
            <div
              key={player.id}
              className={`player-row ${isCurrentUser ? "current" : ""} ${isTheirTurn ? "active-turn" : ""}`}
            >
              <div className="player-info">
                <img src={player.avatarUrl} alt={player.username} width={32} height={32} />
                <span className="player-name">{player.username}</span>
                {isTheirTurn && <span className="turn-indicator">◀</span>}
              </div>
              <div className="flex flex-row flex-nowrap gap-1 overflow-x-auto">
                {player.hand.map((card, i) => (
                  <Card
                    key={i}
                    rank={card.rank}
                    suitEmoji={card.suit.emoji}
                    suit={suitVariant(card)}
                    selectable={isCurrentUser && isMyTurn}
                    selected={isCurrentUser && selectedIndices.has(i)}
                    onClick={isCurrentUser && isMyTurn ? () => toggleCard(i) : undefined}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {currentPlayer && isMyTurn && (
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
          <Button onClick={handlePlay} disabled={!isValidPlay}>
            Play {selectedPlay?.name ?? ""}
          </Button>
          <Button onClick={onPass} disabled={!canPass}>
            Pass
          </Button>
          <Button onClick={() => setSelectedIndices(new Set())} disabled={selectedCards.length === 0}>
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
