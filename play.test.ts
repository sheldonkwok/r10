import { expect, describe, test } from "bun:test";

import * as card from "./card";
import * as play from "./play";

const PLAYS = play.PLAYS;

describe("single", () => {
  test("valid", () => {
    const fix = card.create(card.SUITS.Clubs, 2);
    expect(play.get([fix])).toEqual({ ...PLAYS.single, value: 13 });
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
    const fix = [2, 2, 2, 2, 2].map((num) =>
      card.create(card.SUITS.Clubs, num)
    );
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
    expect(play.get(fix)).toEqual({ ...PLAYS.straight, value: 3 });
  });

  test("valid wrap 2", () => {
    const fix = [2, 3, 4].map((num) => card.create(card.SUITS.Clubs, num));
    expect(play.get(fix)).toEqual({ ...PLAYS.straight, value: 2 });
  });

  test("valid wrap ace", () => {
    const fix = [1, 2, 3].map((num) => card.create(card.SUITS.Clubs, num));
    expect(play.get(fix)).toEqual({ ...PLAYS.straight, value: 1 });
  });

  test("valid wrap king", () => {
    const fix = [13, 2, 1].map((num) => card.create(card.SUITS.Clubs, num));
    expect(play.get(fix)).toEqual({ ...PLAYS.straight, value: 12 });
  });

  test("valid long", () => {
    const fix = [2, 3, 4, 5, 6, 7].map((num) =>
      card.create(card.SUITS.Clubs, num)
    );

    expect(play.get(fix)).toEqual({ ...PLAYS.straight, value: 5 });
  });

  test("valid long wrap king", () => {
    const fix = [1, 2, 13, 11, 12, 3].map((num) =>
      card.create(card.SUITS.Clubs, num)
    );

    expect(play.get(fix)).toMatchObject(PLAYS.straight);
  });
});
