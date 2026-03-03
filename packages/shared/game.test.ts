import { describe, expect, it } from "vitest";
import * as card from "./card.ts";
import { getLosingTeam, getWinningTeam } from "./game.ts";
import type { GamePlayer } from "./types.ts";

function makePlayer(id: string, team: "red" | "black", handSize: number): GamePlayer {
  const hand = Array.from({ length: handSize }, (_, i) => card.create(card.SUITS.Spades, i + 1));
  return {
    id,
    username: id,
    avatarUrl: "",
    isBot: false,
    hand,
    team,
  };
}

// 2 red + 4 black players
const r1 = () => makePlayer("r1", "red", 13);
const r2 = () => makePlayer("r2", "red", 13);
const b1 = () => makePlayer("b1", "black", 13);
const b2 = () => makePlayer("b2", "black", 13);
const b3 = () => makePlayer("b3", "black", 13);
const b4 = () => makePlayer("b4", "black", 13);

// 3 red + 3 black players
const r3 = () => makePlayer("r3", "red", 13);
const b5 = () => makePlayer("b5", "black", 13);

describe("getLosingTeam — 2 red + 4 black", () => {
  it("returns null when all 6 players have cards (game start)", () => {
    expect(getLosingTeam([r1(), r2(), b1(), b2(), b3(), b4()])).toBe(null);
  });

  it("returns null when both teams still have players with cards", () => {
    const players = [
      makePlayer("r1", "red", 5),
      makePlayer("r2", "red", 0),
      makePlayer("b1", "black", 5),
      makePlayer("b2", "black", 5),
      makePlayer("b3", "black", 5),
      makePlayer("b4", "black", 5),
    ];
    expect(getLosingTeam(players)).toBe(null);
  });

  it("returns 'black' when only the 4 black players still have cards", () => {
    const players = [
      makePlayer("r1", "red", 0),
      makePlayer("r2", "red", 0),
      makePlayer("b1", "black", 5),
      makePlayer("b2", "black", 5),
      makePlayer("b3", "black", 5),
      makePlayer("b4", "black", 5),
    ];
    expect(getLosingTeam(players)).toBe("black");
  });

  it("returns 'red' when only the 2 red players still have cards", () => {
    const players = [
      makePlayer("r1", "red", 5),
      makePlayer("r2", "red", 5),
      makePlayer("b1", "black", 0),
      makePlayer("b2", "black", 0),
      makePlayer("b3", "black", 0),
      makePlayer("b4", "black", 0),
    ];
    expect(getLosingTeam(players)).toBe("red");
  });

  it("returns 'black' when 1 black player remains (classic 1-player end)", () => {
    const players = [
      makePlayer("r1", "red", 0),
      makePlayer("r2", "red", 0),
      makePlayer("b1", "black", 0),
      makePlayer("b2", "black", 0),
      makePlayer("b3", "black", 0),
      makePlayer("b4", "black", 5),
    ];
    expect(getLosingTeam(players)).toBe("black");
  });
});

describe("getLosingTeam — 3 red + 3 black", () => {
  it("returns null when all 6 players have cards", () => {
    expect(getLosingTeam([r1(), r2(), r3(), b1(), b2(), b5()])).toBe(null);
  });

  it("returns null when both teams still have players with cards", () => {
    const players = [
      makePlayer("r1", "red", 5),
      makePlayer("r2", "red", 0),
      makePlayer("r3", "red", 0),
      makePlayer("b1", "black", 5),
      makePlayer("b2", "black", 5),
      makePlayer("b5", "black", 5),
    ];
    expect(getLosingTeam(players)).toBe(null);
  });

  it("returns 'black' when only the 3 black players still have cards", () => {
    const players = [
      makePlayer("r1", "red", 0),
      makePlayer("r2", "red", 0),
      makePlayer("r3", "red", 0),
      makePlayer("b1", "black", 5),
      makePlayer("b2", "black", 5),
      makePlayer("b5", "black", 5),
    ];
    expect(getLosingTeam(players)).toBe("black");
  });

  it("returns 'red' when only the 3 red players still have cards", () => {
    const players = [
      makePlayer("r1", "red", 5),
      makePlayer("r2", "red", 5),
      makePlayer("r3", "red", 5),
      makePlayer("b1", "black", 0),
      makePlayer("b2", "black", 0),
      makePlayer("b5", "black", 0),
    ];
    expect(getLosingTeam(players)).toBe("red");
  });
});

describe("getWinningTeam — 2 red + 4 black", () => {
  const allWithCards = [r1(), r2(), b1(), b2(), b3(), b4()];

  it("returns null when firstFinisherId is null", () => {
    const players = [
      makePlayer("r1", "red", 0),
      makePlayer("r2", "red", 0),
      makePlayer("b1", "black", 5),
      makePlayer("b2", "black", 5),
      makePlayer("b3", "black", 5),
      makePlayer("b4", "black", 5),
    ];
    expect(getWinningTeam(players, null)).toBe(null);
  });

  it("returns null when both teams still have cards", () => {
    expect(getWinningTeam(allWithCards, "r1")).toBe(null);
  });

  it("returns 'red' when first finisher is red and losing team is black", () => {
    const players = [
      makePlayer("r1", "red", 0),
      makePlayer("r2", "red", 0),
      makePlayer("b1", "black", 5),
      makePlayer("b2", "black", 5),
      makePlayer("b3", "black", 5),
      makePlayer("b4", "black", 5),
    ];
    expect(getWinningTeam(players, "r1")).toBe("red");
  });

  it("returns 'black' when first finisher is black and losing team is red", () => {
    const players = [
      makePlayer("r1", "red", 5),
      makePlayer("r2", "red", 5),
      makePlayer("b1", "black", 0),
      makePlayer("b2", "black", 0),
      makePlayer("b3", "black", 0),
      makePlayer("b4", "black", 0),
    ];
    expect(getWinningTeam(players, "b1")).toBe("black");
  });

  it("returns 'wash' when first finisher is red and losing team is also red", () => {
    const players = [
      makePlayer("r1", "red", 5),
      makePlayer("r2", "red", 5),
      makePlayer("b1", "black", 0),
      makePlayer("b2", "black", 0),
      makePlayer("b3", "black", 0),
      makePlayer("b4", "black", 0),
    ];
    expect(getWinningTeam(players, "r1")).toBe("wash");
  });

  it("returns 'wash' when first finisher is black and losing team is also black", () => {
    const players = [
      makePlayer("r1", "red", 0),
      makePlayer("r2", "red", 0),
      makePlayer("b1", "black", 5),
      makePlayer("b2", "black", 5),
      makePlayer("b3", "black", 5),
      makePlayer("b4", "black", 5),
    ];
    expect(getWinningTeam(players, "b1")).toBe("wash");
  });
});

describe("getWinningTeam — 3 red + 3 black", () => {
  it("returns 'red' when first finisher is red and all black still have cards (only black remaining)", () => {
    const players = [
      makePlayer("r1", "red", 0),
      makePlayer("r2", "red", 0),
      makePlayer("r3", "red", 0),
      makePlayer("b1", "black", 5),
      makePlayer("b2", "black", 5),
      makePlayer("b5", "black", 5),
    ];
    expect(getWinningTeam(players, "r1")).toBe("red");
  });

  it("returns 'black' when first finisher is black and all red still have cards (only red remaining)", () => {
    const players = [
      makePlayer("r1", "red", 5),
      makePlayer("r2", "red", 5),
      makePlayer("r3", "red", 5),
      makePlayer("b1", "black", 0),
      makePlayer("b2", "black", 0),
      makePlayer("b5", "black", 0),
    ];
    expect(getWinningTeam(players, "b1")).toBe("black");
  });

  it("returns 'wash' when first finisher is red and only red players remain", () => {
    const players = [
      makePlayer("r1", "red", 5),
      makePlayer("r2", "red", 5),
      makePlayer("r3", "red", 5),
      makePlayer("b1", "black", 0),
      makePlayer("b2", "black", 0),
      makePlayer("b5", "black", 0),
    ];
    expect(getWinningTeam(players, "r1")).toBe("wash");
  });
});
