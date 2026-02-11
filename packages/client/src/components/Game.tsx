import { useState, useMemo, useEffect } from "react";
import { play, type GameState } from "shared";

interface GameProps {
  state: GameState;
  currentUserId: string;
  onPlayCards: (cardIndices: number[]) => void;
  onPass: () => void;
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

  const isValidPlay = selectedPlay !== null && selectedPlay.name !== "Illegal";

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
        <div className="current-play">
          <span>Current play ({state.currentPlay.playType}): </span>
          {state.currentPlay.cards.map((c, i) => (
            <span key={i} className="card">{c.display}</span>
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
                {player.isBot && <span className="bot-badge">Bot</span>}
                {isTheirTurn && <span className="turn-indicator">◀</span>}
              </div>
              <div className="player-hand">
                {player.hand.map((card, i) => (
                  <span
                    key={i}
                    className={`card ${isCurrentUser && isMyTurn ? "selectable" : ""} ${isCurrentUser && selectedIndices.has(i) ? "selected" : ""}`}
                    onClick={isCurrentUser && isMyTurn ? () => toggleCard(i) : undefined}
                  >
                    {card.display}
                  </span>
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
          <button onClick={handlePlay} disabled={!isValidPlay}>
            Play {selectedPlay?.name ?? ""}
          </button>
          <button onClick={onPass} disabled={!canPass}>
            Pass
          </button>
          <button onClick={() => setSelectedIndices(new Set())} disabled={selectedCards.length === 0}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
