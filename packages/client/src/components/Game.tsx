import type { GameState } from "shared";

interface GameProps {
  state: GameState;
  currentUserId: string;
}

export function Game({ state, currentUserId }: GameProps) {
  const currentPlayer = state.players.find((p) => p.id === currentUserId);

  return (
    <div className="game">
      <h1>Red 10</h1>
      <div className="players-bar">
        {state.players.map((player) => (
          <div
            key={player.id}
            className={`player-info ${player.id === currentUserId ? "current" : ""}`}
          >
            <img src={player.avatarUrl} alt={player.username} width={32} height={32} />
            <span>{player.username}</span>
            <span className="card-count">{player.cardCount} cards</span>
            {player.isBot && <span className="bot-badge">Bot</span>}
          </div>
        ))}
      </div>
      <div className="hand">
        <h2>Your Hand ({state.hand.length} cards)</h2>
        <div className="cards">
          {state.hand.map((card, i) => (
            <div key={i} className="card">
              {card.display}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
