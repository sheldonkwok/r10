import type { GameState } from "shared";

interface GameProps {
  state: GameState;
  currentUserId: string;
}

export function Game({ state, currentUserId }: GameProps) {
  return (
    <div className="game">
      <h1>Red 10</h1>
      <div className="players-list">
        {state.players.map((player) => (
          <div
            key={player.id}
            className={`player-row ${player.id === currentUserId ? "current" : ""}`}
          >
            <div className="player-info">
              <img src={player.avatarUrl} alt={player.username} width={32} height={32} />
              <span className="player-name">{player.username}</span>
              {player.isBot && <span className="bot-badge">Bot</span>}
            </div>
            <div className="player-hand">
              {player.hand.map((card, i) => (
                <span key={i} className="card">
                  {card.display}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
