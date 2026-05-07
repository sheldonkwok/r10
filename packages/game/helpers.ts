import compare from "./compare.ts";
import * as play from "./play.ts";
import type { GameState } from "./types.ts";

export interface CanPlayResult {
  valid: boolean;
  play: play.Play | null;
}

export function canPlay(state: GameState, playerId: string, cardIndices: number[]): CanPlayResult {
  if (state.winningTeam !== null) return { valid: false, play: null };
  if (state.chaGoLocked) return { valid: false, play: null };
  if (cardIndices.length === 0) return { valid: false, play: null };

  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { valid: false, play: null };

  const cards = cardIndices.map((i) => player.hand[i]);
  if (cards.some((c) => c === undefined)) return { valid: false, play: null };

  const newPlay = play.get(cards);
  if (newPlay.name === "Illegal") return { valid: false, play: newPlay };

  if (state.currentPlay && state.lastPlayerId !== playerId) {
    const currentPlayObj = play.get(state.currentPlay.cards);
    const result = compare(currentPlayObj, newPlay);
    if (!result.valid) return { valid: false, play: newPlay };
  }

  return { valid: true, play: newPlay };
}

export function chaGoEligibility(
  state: GameState,
  playerId: string,
): "cha-available" | "go-available" | null {
  if (state.chaGoPhase === null) return null;
  if (state.lastPlayerId === playerId) return null;
  if (!state.currentPlay) return null;

  const player = state.players.find((p) => p.id === playerId);
  if (!player) return null;

  const currentPlayObj = play.get(state.currentPlay.cards);
  const matching = player.hand.filter((c) => c.value === currentPlayObj.value).length;
  const minMatching = state.chaGoPhase === "cha-available" ? 2 : 1;

  return matching >= minMatching ? state.chaGoPhase : null;
}

export function isValidChaGoPlay(state: GameState, playerId: string, cardIndices: number[]): boolean {
  if (state.chaGoPhase === null) return false;
  if (!state.currentPlay) return false;
  if (state.lastPlayerId === playerId) return false;

  const player = state.players.find((p) => p.id === playerId);
  if (!player) return false;

  const cards = cardIndices.map((i) => player.hand[i]);
  if (cards.some((c) => c === undefined)) return false;

  const newPlay = play.get(cards);
  const currentPlayObj = play.get(state.currentPlay.cards);

  if (state.chaGoPhase === "cha-available") {
    return newPlay.name === "Pair" && newPlay.value === currentPlayObj.value;
  }
  return newPlay.name === "Single" && newPlay.value === currentPlayObj.value;
}
