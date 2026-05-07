import { describe, expect, it } from "vitest";
import * as card from "./card.ts";
import { Game } from "./game.ts";
import type { LobbyPlayer } from "./types.ts";

const { SUITS, CARD_RANKS, create } = card;

function makeLobbyPlayers(): LobbyPlayer[] {
  return (["p0", "p1", "p2", "p3", "p4", "p5"] as const).map((id, i) => ({
    id,
    username: id,
    avatarUrl: "",
    ready: true,
    isHost: i === 0,
    isBot: false,
  }));
}

describe("full-game scenarios", () => {
  it("red wins when the lone red player goes out first (1v5)", () => {
    const hands: card.Cards[] = [
      [create(SUITS.Diamonds, 10)],
      [create(SUITS.Clubs, 3)],
      [create(SUITS.Hearts, 3)],
      [create(SUITS.Spades, 3)],
      [create(SUITS.Clubs, 4)],
      [create(SUITS.Diamonds, 4)],
    ];
    const game = new Game("room1", makeLobbyPlayers(), hands);

    const result = game.makePlay([0]);
    expect(result.success).toBe(true);

    const state = game.getState();
    expect(state.firstFinisherId).toBe("p0");
    expect(state.losingTeam).toBe("black");
    expect(state.winningTeam).toBe("red");
  });

  it("results in a wash when the first finisher's team is also stuck last", () => {
    // p0 (red) finishes first. Then all four black players go out via fresh
    // rounds (each new round opens after the prior player's hand empties and
    // clears currentPlay). p1 (red) is left holding cards → losingTeam = red,
    // first finisher's team = red → wash.
    const hands: card.Cards[] = [
      [create(SUITS.Diamonds, 10)],
      [create(SUITS.Hearts, 10), create(SUITS.Clubs, CARD_RANKS.J), create(SUITS.Clubs, 9)],
      [create(SUITS.Clubs, CARD_RANKS.Q)],
      [create(SUITS.Clubs, CARD_RANKS.K)],
      [create(SUITS.Clubs, 3)],
      [create(SUITS.Clubs, 4)],
    ];
    const game = new Game("room1", makeLobbyPlayers(), hands);

    expect(game.makePlay([0]).success).toBe(true); // p0: 10♦ (out, first finisher)
    expect(game.makePlay([1]).success).toBe(true); // p1: J♣
    expect(game.makePlay([0]).success).toBe(true); // p2: Q♣ beats J, p2 out → currentPlay cleared
    expect(game.makePlay([0]).success).toBe(true); // p3: K♣ (fresh round), p3 out → cleared
    expect(game.makePlay([0]).success).toBe(true); // p4: 3♣ (fresh round), p4 out → cleared
    expect(game.makePlay([0]).success).toBe(true); // p5: 4♣ (fresh round), p5 out → cleared

    const state = game.getState();
    expect(state.firstFinisherId).toBe("p0");
    expect(state.losingTeam).toBe("red");
    expect(state.winningTeam).toBe("wash");
    expect(state.players.find((p) => p.id === "p1")?.handSize).toBe(2);
  });

  it("rejects a play after the game has been decided", () => {
    const hands: card.Cards[] = [
      [create(SUITS.Diamonds, 10)],
      [create(SUITS.Clubs, 3), create(SUITS.Clubs, 4)],
      [create(SUITS.Hearts, 3)],
      [create(SUITS.Spades, 3)],
      [create(SUITS.Clubs, 5)],
      [create(SUITS.Diamonds, 5)],
    ];
    const game = new Game("room1", makeLobbyPlayers(), hands);
    game.makePlay([0]); // p0 wins the game

    const result = game.makePlay([0]);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Game is over");
  });
});

describe("identity surface", () => {
  function makeBaseGame(): Game {
    return new Game("room1", makeLobbyPlayers(), [
      [create(SUITS.Spades, 5), create(SUITS.Spades, 3)],
      [create(SUITS.Clubs, 5), create(SUITS.Spades, 8)],
      [create(SUITS.Hearts, 5), create(SUITS.Spades, 9)],
      [create(SUITS.Diamonds, 10), create(SUITS.Clubs, 4)], // red
      [create(SUITS.Diamonds, 3), create(SUITS.Diamonds, 4)],
      [create(SUITS.Hearts, 3), create(SUITS.Hearts, 4)],
    ]);
  }

  it("getPlayerIds returns all six ids in seat order", () => {
    const game = makeBaseGame();
    expect(game.getPlayerIds()).toEqual(["p0", "p1", "p2", "p3", "p4", "p5"]);
  });

  it("isPlayerTurn tracks currentTurn", () => {
    const game = makeBaseGame();
    expect(game.isPlayerTurn("p0")).toBe(true);
    expect(game.isPlayerTurn("p1")).toBe(false);
    game.makePlay([0]);
    expect(game.isPlayerTurn("p0")).toBe(false);
    expect(game.isPlayerTurn("p1")).toBe(true);
  });

  it("getStateForPlayer reveals only that player's hand mid-game and hides teams", () => {
    const game = makeBaseGame();
    const filtered = game.getStateForPlayer("p0");

    const p0 = filtered.players.find((p) => p.id === "p0");
    const p1 = filtered.players.find((p) => p.id === "p1");

    expect(p0?.hand.length).toBe(2);
    expect(p1?.hand).toEqual([]);
    expect(p1?.team).toBe(null);
    expect(p1?.handSize).toBe(2);
  });

  it("getStateForPlayer reveals teams (but not hands) once the game ends", () => {
    const hands: card.Cards[] = [
      [create(SUITS.Diamonds, 10)],
      [create(SUITS.Clubs, 3)],
      [create(SUITS.Hearts, 3)],
      [create(SUITS.Spades, 3)],
      [create(SUITS.Clubs, 4)],
      [create(SUITS.Diamonds, 4)],
    ];
    const game = new Game("room1", makeLobbyPlayers(), hands);
    game.makePlay([0]); // ends the game

    const filtered = game.getStateForPlayer("p0");
    const p1 = filtered.players.find((p) => p.id === "p1");

    expect(filtered.winningTeam).toBe("red");
    expect(p1?.hand).toEqual([]); // hands stay hidden
    expect(p1?.team).toBe("black"); // team revealed
  });

  it("getStateForPlayer for an unknown id returns a fully-stripped view", () => {
    const game = makeBaseGame();
    const filtered = game.getStateForPlayer("ghost");
    for (const p of filtered.players) {
      expect(p.hand).toEqual([]);
      expect(p.team).toBe(null);
    }
  });
});
