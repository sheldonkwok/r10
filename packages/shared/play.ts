import * as card from "./card";

export const PLAYS = {
  single: { name: "Single", rank: 0 },
  pair: { name: "Pair", rank: 0 },
  straight: { name: "Straight", rank: 0 },
  bomb3: { name: "Three Card Bomb", rank: 1 },
  bomb4: { name: "Four Card Bomb", rank: 2 },
  bomb5: { name: "Five Card Bomb", rank: 3 },
  bomb6: { name: "Six Card Bomb", rank: 4 },

  illegal: { name: "Illegal", rank: -1, value: -1 },
} as const;

type PlayType = typeof PLAYS;
type PlayName = keyof PlayType;
type BasePlay = PlayType[PlayName];
export type Play = BasePlay & { value: number };

export function get(cards: card.Card[]): Play {
  const len = cards.length;
  const firstValue = cards[0]?.value;

  // Single
  if (len === 1) return { ...PLAYS.single, value: firstValue };

  const sameValue = allCardSameValue(cards);

  // Pair
  if (len === 2 && sameValue) return { ...PLAYS.pair, value: firstValue };

  // Bombs
  if (isBombCount(len) && sameValue) {
    return { ...PLAYS[`bomb${len}`], value: firstValue };
  }

  // Straight
  if (isStraight(cards)) {
    return { ...PLAYS.straight, value: cards[cards.length - 1].value };
  }

  return PLAYS.illegal;
}

function allCardSameValue(cards: card.Card[]): boolean {
  return new Set(cards.map((c) => c.value)).size === 1;
}

function isStraight(cards: card.Card[]): boolean {
  const len = cards.length;
  if (len < 3) return false;

  const sorted = cards.slice().sort((a, b) => a.rank - b.rank);

  const isAWrap =
    sorted[len - 1].rank === card.CARD_RANKS.K &&
    sorted[0].rank === card.CARD_RANKS.A;

  if (isAWrap) {
    const temp = sorted.shift()!;
    sorted.push(temp);
  }

  for (let i = 1; i < len; i++) {
    const curr = sorted[i];
    const prev = sorted[i - 1];

    if (Math.abs(curr.rank - prev.rank) === 1) continue;
    if (isAWrap && Math.abs(curr.value - prev.value) === 1) continue;

    return false;
  }

  return true;
}

type BombCount = Extract<
  PlayName,
  `bomb${number}`
> extends `bomb${infer N extends number}`
  ? N
  : never;

function isBombCount(num: number): num is BombCount {
  return num >= 3 && num <= 6;
}
