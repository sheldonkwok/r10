import * as card from "./card";

export const PLAYS = {
  single: { name: "Single", rank: 0 },
  pair: { name: "Pair", rank: 0 },
  straight: { name: "Straight", rank: 0 },
  bomb3: { name: "Three Card Bomb", rank: 1 },
  dragon: { name: "Dragon", rank: 2 },
  bomb4: { name: "Four Card Bomb", rank: 3 },
  bomb5: { name: "Five Card Bomb", rank: 4 },
  bomb6: { name: "Six Card Bomb", rank: 5 },

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
    return { ...PLAYS.straight, value: highCardValue(cards) };
  }

  // Dragon
  if (isDragon(cards)) return { ...PLAYS.dragon, value: highCardValue(cards) };

  return PLAYS.illegal;
}

function allCardSameValue(cards: card.Card[]): boolean {
  return new Set(cards.map((c) => c.value)).size === 1;
}

function isStraight(cards: card.Card[]): boolean {
  const len = cards.length;
  if (len < 3) return false;

  const sorted = cards.slice().sort((a, b) => a.rank - b.rank);

  const isAWrap = sorted[len - 1].rank === card.CARD_RANKS.K && sorted[0].rank === card.CARD_RANKS.A;

  if (isAWrap) {
    sorted.push(sorted.shift() as card.Card);
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

function isDragon(cards: card.Card[]): boolean {
  const len = cards.length;
  if (len < 6 || len % 2 !== 0) return false;

  const rankCounts = new Map<number, number>();
  for (const c of cards) rankCounts.set(c.rank, (rankCounts.get(c.rank) ?? 0) + 1);
  for (const count of rankCounts.values()) if (count !== 2) return false;

  const sortedRanks = [...rankCounts.keys()].sort((a, b) => a - b);
  const isAWrap =
    sortedRanks[sortedRanks.length - 1] === card.CARD_RANKS.K && sortedRanks[0] === card.CARD_RANKS.A;
  if (isAWrap) sortedRanks.push((sortedRanks.shift() as number) + card.VALUE_MAX);

  for (let i = 1; i < sortedRanks.length; i++) {
    if (sortedRanks[i] - sortedRanks[i - 1] !== 1) return false;
  }
  return true;
}

function highCardValue(cards: card.Card[]): number {
  const sorted = cards.slice().sort((a, b) => a.rank - b.rank);
  const isAWrap =
    sorted[sorted.length - 1].rank === card.CARD_RANKS.K && sorted[0].rank === card.CARD_RANKS.A;
  return isAWrap ? sorted[0].value : sorted[sorted.length - 1].value;
}

type BombCount = Extract<PlayName, `bomb${number}`> extends `bomb${infer N extends number}` ? N : never;

function isBombCount(num: number): num is BombCount {
  return num >= 3 && num <= 6;
}
