import { useState, useMemo } from "react";
import { play, type GameState, type card } from "shared";

interface GameProps {
  state: GameState;
  currentUserId: string;
}

export function Game({ state, currentUserId }: GameProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const currentPlayer = state.players.find((p) => p.id === currentUserId);

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
    return [...selectedIndices].sort((a, b) => a - b).map((i) => currentPlayer.hand[i]);
  }, [currentPlayer, selectedIndices]);

  const currentPlay = useMemo(() => {
    if (selectedCards.length === 0) return null;
    return play.get(selectedCards);
  }, [selectedCards]);

  const isValidPlay = currentPlay !== null && currentPlay.name !== "Illegal";

  return (
    <div className="game">
      <h1>Red 10</h1>
      <div className="players-list">
        {state.players.map((player) => {
          const isCurrentUser = player.id === currentUserId;
          return (
            <div
              key={player.id}
              className={`player-row ${isCurrentUser ? "current" : ""}`}
            >
              <div className="player-info">
                <img src={player.avatarUrl} alt={player.username} width={32} height={32} />
                <span className="player-name">{player.username}</span>
                {player.isBot && <span className="bot-badge">Bot</span>}
              </div>
              <div className="player-hand">
                {player.hand.map((card, i) => (
                  <span
                    key={i}
                    className={`card ${isCurrentUser ? "selectable" : ""} ${isCurrentUser && selectedIndices.has(i) ? "selected" : ""}`}
                    onClick={isCurrentUser ? () => toggleCard(i) : undefined}
                  >
                    {card.display}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {currentPlayer && (
        <div className="play-area">
          <div className="selection-info">
            {selectedCards.length === 0 ? (
              <span>Select cards to play</span>
            ) : (
              <span>
                {currentPlay?.name}: {selectedCards.map((c) => c.display).join(" ")}
              </span>
            )}
          </div>
          <button disabled={!isValidPlay}>
            Play {currentPlay?.name ?? ""}
          </button>
          <button onClick={() => setSelectedIndices(new Set())} disabled={selectedCards.length === 0}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
