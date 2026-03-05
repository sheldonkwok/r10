import { describe, expect, test } from "vitest";

import * as card from "./card";
import compare from "./compare";
import * as play from "./play";

const PLAYS = play.PLAYS;
const RANKS = card.CARD_RANKS;

describe("single", () => {
  test("valid", () => {
    const fix = card.create(card.SUITS.Clubs, 2);
    expect(play.get([fix])).toEqual({ ...PLAYS.single, value: 13, length: 1 });
  });
});

describe("pair", () => {
  test("valid", () => {
    const fix = card.create(card.SUITS.Clubs, 3);
    expect(play.get([fix])).toMatchObject({ ...PLAYS.single, value: 1 });
  });

  test("invalid", () => {
    const fix = [2, 3].map((num) => card.create(card.SUITS.Clubs, num));
    expect(play.get(fix)).toMatchObject(PLAYS.illegal);
  });
});

describe("bomb", () => {
  test("valid 3", () => {
    const fix = [2, 2, 2].map((num) => card.create(card.SUITS.Clubs, num));
    expect(play.get(fix)).toMatchObject(PLAYS.bomb3);
  });

  test("valid 5", () => {
    const fix = [2, 2, 2, 2, 2].map((num) => card.create(card.SUITS.Clubs, num));
    expect(play.get(fix)).toMatchObject(PLAYS.bomb5);
  });

  test("invalid", () => {
    const fix = [2, 4, 6].map((num) => card.create(card.SUITS.Clubs, num));
    expect(play.get(fix)).toMatchObject(PLAYS.illegal);
  });
});

describe("straight", () => {
  test("valid simple", () => {
    const fix = [3, 4, 5].map((num) => card.create(card.SUITS.Clubs, num));
    expect(play.get(fix)).toEqual({ ...PLAYS.straight, value: 3, length: 3 });
  });

  test("valid wrap 2", () => {
    const fix = [2, 3, 4].map((num) => card.create(card.SUITS.Clubs, num));
    expect(play.get(fix)).toEqual({ ...PLAYS.straight, value: 2, length: 3 });
  });

  test("valid ace low", () => {
    const fix = [RANKS.A, 2, 3].map((num) => card.create(card.SUITS.Clubs, num));
    expect(play.get(fix)).toEqual({ ...PLAYS.straight, value: 1, length: 3 });
  });

  test("valid ace high", () => {
    const fix = [RANKS.K, RANKS.Q, RANKS.A].map((num) => card.create(card.SUITS.Clubs, num));
    expect(play.get(fix)).toEqual({ ...PLAYS.straight, value: 12, length: 3 });
  });

  test("valid long", () => {
    const fix = [2, 3, 4, 5, 6, 7].map((num) => card.create(card.SUITS.Clubs, num));

    expect(play.get(fix)).toEqual({ ...PLAYS.straight, value: 5, length: 6 });
  });

  test("invalid wrap ace", () => {
    const fix = [RANKS.K, RANKS.A, 2].map((num) => card.create(card.SUITS.Clubs, num));

    expect(play.get(fix)).toMatchObject(PLAYS.illegal);
  });
});

describe("dragon", () => {
  function pair(rank: number) {
    return [card.create(card.SUITS.Clubs, rank), card.create(card.SUITS.Diamonds, rank)];
  }

  test("valid 3-pair (3-4-5)", () => {
    const fix = [3, 4, 5].flatMap(pair);
    const result = play.get(fix);
    expect(result.name).toBe(PLAYS.dragon.name);
    expect(result.rank).toBe(PLAYS.dragon.rank);
    expect(result.value).toBe(3); // rank 5, value = 5 - 2 = 3
  });

  test("valid 4-pair (5-6-7-8)", () => {
    const fix = [5, 6, 7, 8].flatMap(pair);
    expect(play.get(fix)).toMatchObject({ ...PLAYS.dragon, value: 6 }); // rank 8, value = 6
  });

  test("valid ace-low (A-2-3)", () => {
    const fix = [RANKS.A, 2, 3].flatMap(pair);
    expect(play.get(fix)).toMatchObject({ ...PLAYS.dragon, value: 1 }); // rank 3, value = 1
  });

  test("valid ace-high (Q-K-A)", () => {
    const fix = [RANKS.Q, RANKS.K, RANKS.A].flatMap(pair);
    expect(play.get(fix)).toMatchObject({ ...PLAYS.dragon, value: 12 }); // A value = 12
  });

  test("invalid: fewer than 6 cards", () => {
    const fix = [3, 4].flatMap(pair);
    expect(play.get(fix)).toMatchObject(PLAYS.illegal);
  });

  test("invalid: odd card count", () => {
    const fix = [...[3, 4, 5].flatMap(pair), card.create(card.SUITS.Clubs, 6)];
    expect(play.get(fix)).toMatchObject(PLAYS.illegal);
  });

  test("invalid: non-consecutive ranks", () => {
    const fix = [3, 4, 6].flatMap(pair); // skip 5
    expect(play.get(fix)).toMatchObject(PLAYS.illegal);
  });

  test("invalid: triplet mixed with others", () => {
    const fix = [
      card.create(card.SUITS.Clubs, 3),
      card.create(card.SUITS.Diamonds, 3),
      card.create(card.SUITS.Hearts, 3),
      card.create(card.SUITS.Clubs, 4),
      card.create(card.SUITS.Diamonds, 4),
      card.create(card.SUITS.Clubs, 5),
    ];
    expect(play.get(fix)).toMatchObject(PLAYS.illegal);
  });
});

describe("straight compare", () => {
  const straight3 = play.get([3, 4, 5].map((n) => card.create(card.SUITS.Clubs, n)));
  const straight3High = play.get([5, 6, 7].map((n) => card.create(card.SUITS.Clubs, n)));
  const straight4 = play.get([3, 4, 5, 6].map((n) => card.create(card.SUITS.Clubs, n)));

  test("3-card straight cannot beat a 4-card straight", () => {
    expect(compare(straight4, straight3High).valid).toBe(false);
  });

  test("4-card straight cannot beat a 3-card straight", () => {
    expect(compare(straight3, straight4).valid).toBe(false);
  });

  test("4-card straight with higher value beats another 4-card straight", () => {
    const straight4High = play.get([5, 6, 7, 8].map((n) => card.create(card.SUITS.Clubs, n)));
    expect(compare(straight4, straight4High).valid).toBe(true);
  });
});

describe("dragon compare", () => {
  function pair(rank: number) {
    return [card.create(card.SUITS.Clubs, rank), card.create(card.SUITS.Diamonds, rank)];
  }

  const dragon = play.get([3, 4, 5].flatMap(pair)); // value 3
  const dragonHigh = play.get([5, 6, 7].flatMap(pair)); // value 5

  test("Dragon cannot be played on a single", () => {
    const single = play.get([card.create(card.SUITS.Clubs, 5)]);
    expect(compare(single, dragon).valid).toBe(false);
  });

  test("Dragon cannot be played on a pair", () => {
    const pairPlay = play.get([card.create(card.SUITS.Clubs, 5), card.create(card.SUITS.Diamonds, 5)]);
    expect(compare(pairPlay, dragon).valid).toBe(false);
  });

  test("Dragon cannot be played on a straight", () => {
    const straight = play.get([3, 4, 5].map((n) => card.create(card.SUITS.Clubs, n)));
    expect(compare(straight, dragon).valid).toBe(false);
  });

  test("Dragon cannot be played on bomb3", () => {
    const bomb3 = play.get([5, 5, 5].map((n) => card.create(card.SUITS.Clubs, n)));
    expect(compare(bomb3, dragon).valid).toBe(false);
  });

  test("bomb3 cannot beat Dragon", () => {
    const bomb3 = play.get([5, 5, 5].map((n) => card.create(card.SUITS.Clubs, n)));
    expect(compare(dragon, bomb3).valid).toBe(false);
  });

  test("bomb4 beats Dragon", () => {
    const bomb4 = play.get([5, 5, 5, 5].map((n) => card.create(card.SUITS.Clubs, n)));
    expect(compare(dragon, bomb4).valid).toBe(true);
  });

  test("bomb5 beats Dragon", () => {
    const bomb5 = play.get([5, 5, 5, 5, 5].map((n) => card.create(card.SUITS.Clubs, n)));
    expect(compare(dragon, bomb5).valid).toBe(true);
  });

  test("bomb6 beats Dragon", () => {
    const bomb6 = play.get([5, 5, 5, 5, 5, 5].map((n) => card.create(card.SUITS.Clubs, n)));
    expect(compare(dragon, bomb6).valid).toBe(true);
  });

  test("Dragon beats Dragon with higher value", () => {
    expect(compare(dragon, dragonHigh).valid).toBe(true);
  });

  test("Dragon cannot beat Dragon with lower value", () => {
    expect(compare(dragonHigh, dragon).valid).toBe(false);
  });

  test("Dragon cannot beat Dragon with equal value", () => {
    expect(compare(dragon, dragon).valid).toBe(false);
  });
});
