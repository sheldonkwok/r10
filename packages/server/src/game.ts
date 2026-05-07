import { type card, Game, type LobbyPlayer } from "game";

export { Game };

const games = new Map<string, Game>();

export function createGame(roomId: string, lobbyPlayers: LobbyPlayer[], dealtHands?: card.Cards[]): Game {
  const game = new Game(roomId, lobbyPlayers, dealtHands);
  games.set(roomId, game);
  return game;
}

export function getGame(roomId: string): Game | undefined {
  return games.get(roomId);
}

export function removeGame(roomId: string): void {
  games.delete(roomId);
}
