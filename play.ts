import * as card from "./card";

interface Play {
  name: string;
  value: number;
}

export const PLAYS = {
  single: { name: "Single", value: 0 },
  pair: { name: "Pair", value: 0 },
  straight: { name: "Straight", value: 0 },
  bomb3: { name: "Three Card Bomb", value: 1 },
  bomb4: { name: "Four Card Bomb", value: 2 },
  bomb5: { name: "Five Card Bomb", value: 3 },
  bomb6: { name: "Six Card Bomb", value: 4 },

  illegal: { name: "Illegal", value: -1 },
};

type PlayName = keyof typeof PLAYS;

export function get(play: card.Card[]): Play {
  const len = play.length;

  // Single
  if (len === 1) return PLAYS.single;

  const sameValue = allCardSameValue(play);

  // Pair
  if (len === 2 && sameValue) return PLAYS.pair;

  // Bombs
  if (len >= 3 && len <= 6 && sameValue) return PLAYS[`bomb${len}` as PlayName];

  // Straight
  if (len >= 3 && allInARow(play)) return PLAYS.straight;

  return PLAYS.illegal;
}

function allCardSameValue(cards: card.Card[]): boolean {
  let first = cards[0].value;

  for (let i = 1; i < cards.length; i++) {
    if (cards[i].value !== first) return false;
  }

  return true;
}

function allInARow(cards: card.Card[]): boolean {
  const sorted = cards.slice().sort((a, b) => a.rank - b.rank);
  const len = sorted.length;

  while (sorted[len - 1].value === sorted[0].value - 1) {
    const temp = sorted.pop()!;
    sorted.splice(0, 0, temp);
  }

  for (let i = 1; i < sorted.length; i++) {
    const curr = sorted[i];
    const prev = sorted[i - 1];

    if (Math.abs(curr.rank - prev.rank) === 1) continue;
    if (Math.abs(curr.value - prev.value) === 1) continue;

    return false;
  }

  return true;
}
