import { describe, expect, it } from "vitest";
import * as card from "./card.ts";
import { canPlay, chaGoEligibility, isValidChaGoPlay } from "./helpers.ts";
import type { CurrentPlay, GamePlayer, GameState } from "./types.ts";

const { SUITS, create } = card;

function makePlayer(id: string, hand: card.Card[], team: "red" | "black" = "black"): GamePlayer {
  return {
    id,
    username: id,
    avatarUrl: "",
    isBot: false,
    hand,
    handSize: hand.length,
    team,
  };
}

interface StateOverrides {
  currentPlay?: CurrentPlay | null;
  lastPlayerId?: string | null;
  chaGoPhase?: GameState["chaGoPhase"];
  chaGoLocked?: boolean;
  winningTeam?: GameState["winningTeam"];
}

function makeState(players: GamePlayer[], overrides: StateOverrides = {}): GameState {
  return {
    roomId: "room1",
    hostId: players[0]?.id ?? "",
    players,
    currentTurn: 0,
    currentPlay: overrides.currentPlay ?? null,
    lastPlayerId: overrides.lastPlayerId ?? null,
    losingTeam: null,
    firstFinisherId: null,
    winningTeam: overrides.winningTeam ?? null,
    chaGoPhase: overrides.chaGoPhase ?? null,
    chaGoLocked: overrides.chaGoLocked ?? false,
  };
}

describe("canPlay", () => {
  const fives = [create(SUITS.Clubs, 5), create(SUITS.Diamonds, 5)];

  it("rejects empty selection", () => {
    const state = makeState([makePlayer("p0", [create(SUITS.Spades, 5)])]);
    expect(canPlay(state, "p0", []).valid).toBe(false);
  });

  it("rejects when game is over", () => {
    const state = makeState([makePlayer("p0", [create(SUITS.Spades, 5)])], { winningTeam: "red" });
    expect(canPlay(state, "p0", [0]).valid).toBe(false);
  });

  it("rejects when chaGoLocked", () => {
    const state = makeState([makePlayer("p0", [create(SUITS.Spades, 5)])], { chaGoLocked: true });
    expect(canPlay(state, "p0", [0]).valid).toBe(false);
  });

  it("rejects when player not in state", () => {
    const state = makeState([makePlayer("p0", [create(SUITS.Spades, 5)])]);
    expect(canPlay(state, "ghost", [0]).valid).toBe(false);
  });

  it("rejects out-of-bounds indices", () => {
    const state = makeState([makePlayer("p0", [create(SUITS.Spades, 5)])]);
    expect(canPlay(state, "p0", [99]).valid).toBe(false);
  });

  it("rejects an Illegal play", () => {
    const state = makeState([makePlayer("p0", [create(SUITS.Spades, 5), create(SUITS.Clubs, 7)])]);
    const result = canPlay(state, "p0", [0, 1]);
    expect(result.valid).toBe(false);
    expect(result.play?.name).toBe("Illegal");
  });

  it("accepts a single when no current play", () => {
    const state = makeState([makePlayer("p0", [create(SUITS.Spades, 5)])]);
    const result = canPlay(state, "p0", [0]);
    expect(result.valid).toBe(true);
    expect(result.play?.name).toBe("Single");
  });

  it("accepts a higher single when beating current play", () => {
    const players = [makePlayer("p0", [create(SUITS.Spades, 9)])];
    const state = makeState(players, {
      currentPlay: { playerId: "p1", cards: fives.slice(0, 1), playType: "Single" },
      lastPlayerId: "p1",
    });
    expect(canPlay(state, "p0", [0]).valid).toBe(true);
  });

  it("rejects a lower single when beating current play", () => {
    const players = [makePlayer("p0", [create(SUITS.Spades, 3)])];
    const state = makeState(players, {
      currentPlay: { playerId: "p1", cards: fives.slice(0, 1), playType: "Single" },
      lastPlayerId: "p1",
    });
    expect(canPlay(state, "p0", [0]).valid).toBe(false);
  });

  it("accepts any structurally valid play when last player was self (round came back)", () => {
    const players = [makePlayer("p0", [create(SUITS.Spades, 3)])];
    const state = makeState(players, {
      currentPlay: { playerId: "p0", cards: fives.slice(0, 1), playType: "Single" },
      lastPlayerId: "p0",
    });
    expect(canPlay(state, "p0", [0]).valid).toBe(true);
  });
});

describe("chaGoEligibility", () => {
  it("returns null when phase is null", () => {
    const state = makeState([makePlayer("p0", [create(SUITS.Spades, 5)])]);
    expect(chaGoEligibility(state, "p0")).toBe(null);
  });

  it("returns null for the player who just played", () => {
    const players = [makePlayer("p0", [create(SUITS.Hearts, 5), create(SUITS.Spades, 5)])];
    const state = makeState(players, {
      currentPlay: { playerId: "p0", cards: [create(SUITS.Clubs, 5)], playType: "Single" },
      lastPlayerId: "p0",
      chaGoPhase: "cha-available",
    });
    expect(chaGoEligibility(state, "p0")).toBe(null);
  });

  it("returns 'cha-available' when player has 2+ matching cards in cha window", () => {
    const players = [makePlayer("p0", [create(SUITS.Hearts, 5), create(SUITS.Spades, 5)])];
    const state = makeState(players, {
      currentPlay: { playerId: "p1", cards: [create(SUITS.Clubs, 5)], playType: "Single" },
      lastPlayerId: "p1",
      chaGoPhase: "cha-available",
    });
    expect(chaGoEligibility(state, "p0")).toBe("cha-available");
  });

  it("returns null in cha window when player has only 1 matching card", () => {
    const players = [makePlayer("p0", [create(SUITS.Hearts, 5), create(SUITS.Clubs, 9)])];
    const state = makeState(players, {
      currentPlay: { playerId: "p1", cards: [create(SUITS.Clubs, 5)], playType: "Single" },
      lastPlayerId: "p1",
      chaGoPhase: "cha-available",
    });
    expect(chaGoEligibility(state, "p0")).toBe(null);
  });

  it("returns 'go-available' when player has 1+ matching card in go window", () => {
    const players = [makePlayer("p0", [create(SUITS.Hearts, 5), create(SUITS.Clubs, 9)])];
    const state = makeState(players, {
      currentPlay: { playerId: "p1", cards: [create(SUITS.Clubs, 5)], playType: "Single" },
      lastPlayerId: "p1",
      chaGoPhase: "go-available",
    });
    expect(chaGoEligibility(state, "p0")).toBe("go-available");
  });
});

describe("isValidChaGoPlay", () => {
  it("rejects when not in a cha-go phase", () => {
    const players = [makePlayer("p0", [create(SUITS.Hearts, 5), create(SUITS.Spades, 5)])];
    const state = makeState(players, {
      currentPlay: { playerId: "p1", cards: [create(SUITS.Clubs, 5)], playType: "Single" },
      lastPlayerId: "p1",
    });
    expect(isValidChaGoPlay(state, "p0", [0, 1])).toBe(false);
  });

  it("accepts a matching pair during cha", () => {
    const players = [makePlayer("p0", [create(SUITS.Hearts, 5), create(SUITS.Spades, 5)])];
    const state = makeState(players, {
      currentPlay: { playerId: "p1", cards: [create(SUITS.Clubs, 5)], playType: "Single" },
      lastPlayerId: "p1",
      chaGoPhase: "cha-available",
    });
    expect(isValidChaGoPlay(state, "p0", [0, 1])).toBe(true);
  });

  it("rejects a pair of the wrong value during cha", () => {
    const players = [makePlayer("p0", [create(SUITS.Hearts, 7), create(SUITS.Spades, 7)])];
    const state = makeState(players, {
      currentPlay: { playerId: "p1", cards: [create(SUITS.Clubs, 5)], playType: "Single" },
      lastPlayerId: "p1",
      chaGoPhase: "cha-available",
    });
    expect(isValidChaGoPlay(state, "p0", [0, 1])).toBe(false);
  });

  it("rejects a single during cha", () => {
    const players = [makePlayer("p0", [create(SUITS.Hearts, 5)])];
    const state = makeState(players, {
      currentPlay: { playerId: "p1", cards: [create(SUITS.Clubs, 5)], playType: "Single" },
      lastPlayerId: "p1",
      chaGoPhase: "cha-available",
    });
    expect(isValidChaGoPlay(state, "p0", [0])).toBe(false);
  });

  it("accepts a matching single during go", () => {
    const players = [makePlayer("p0", [create(SUITS.Hearts, 5)])];
    const state = makeState(players, {
      currentPlay: { playerId: "p1", cards: [create(SUITS.Clubs, 5)], playType: "Single" },
      lastPlayerId: "p1",
      chaGoPhase: "go-available",
    });
    expect(isValidChaGoPlay(state, "p0", [0])).toBe(true);
  });

  it("rejects a single of the wrong value during go", () => {
    const players = [makePlayer("p0", [create(SUITS.Hearts, 8)])];
    const state = makeState(players, {
      currentPlay: { playerId: "p1", cards: [create(SUITS.Clubs, 5)], playType: "Single" },
      lastPlayerId: "p1",
      chaGoPhase: "go-available",
    });
    expect(isValidChaGoPlay(state, "p0", [0])).toBe(false);
  });

  it("rejects when last player is self", () => {
    const players = [makePlayer("p0", [create(SUITS.Hearts, 5), create(SUITS.Spades, 5)])];
    const state = makeState(players, {
      currentPlay: { playerId: "p0", cards: [create(SUITS.Clubs, 5)], playType: "Single" },
      lastPlayerId: "p0",
      chaGoPhase: "cha-available",
    });
    expect(isValidChaGoPlay(state, "p0", [0, 1])).toBe(false);
  });
});
