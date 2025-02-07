export const SUITS = {
  Clubs: { emoji: "♣️", short: "c", long: "Clubs" },
  Diamonds: { emoji: "♦️", short: "d", long: "Diamonds" },
  Hearts: { emoji: "♥️", short: "h", long: "Hearts" },
  Spades: { emoji: "♠️", short: "s", long: "Spades " },
} as const;

const SUITS_ABBREVIATED = {
  [SUITS.Clubs.short]: SUITS.Clubs,
  [SUITS.Diamonds.short]: SUITS.Diamonds,
  [SUITS.Hearts.short]: SUITS.Hearts,
  [SUITS.Spades.short]: SUITS.Spades,

  [SUITS.Clubs.emoji]: SUITS.Clubs,
  [SUITS.Diamonds.emoji]: SUITS.Diamonds,
  [SUITS.Hearts.emoji]: SUITS.Hearts,
  [SUITS.Spades.emoji]: SUITS.Spades,
};

type Suit = (typeof SUITS)[keyof typeof SUITS];

export interface Card {
  suit: Suit;
  rank: number;

  display: string;
  value: number;
}

const FACES = {
  "1": "A",
  "11": "J",
  "12": "Q",
  "13": "K",
} as const;

const FACES_TO_RANK = {
  [FACES[1]]: 1,
  [FACES[11]]: 11,
  [FACES[12]]: 12,
  [FACES[13]]: 13,
};

function cardDisplay(suit: Suit, rank: number): string {
  const display =
    rank > 1 && rank <= 10
      ? rank
      : FACES[rank.toString() as keyof typeof FACES];

  return `${display}${suit.emoji}`;
}

const VALUE_ADJUSTMNET = 2;
export const VALUE_MAX = 13;
function cardValue(rank: number): number {
  let value = rank - VALUE_ADJUSTMNET;
  if (value <= 0) value += VALUE_MAX;

  return value;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function create(suit: Suit, rank: number): Card {
  return {
    suit,
    rank,
    display: cardDisplay(suit, rank),
    value: cardValue(rank),
  };
}

const DECK_SUITS = [
  SUITS.Clubs,
  SUITS.Diamonds,
  SUITS.Clubs,
  SUITS.Diamonds,
  SUITS.Hearts,
  SUITS.Spades,
];

export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of DECK_SUITS) {
    for (let rank = 1; rank <= VALUE_MAX; rank++) {
      deck.push(create(suit, rank));
    }
  }

  return shuffleArray(deck);
}

export function convertAbbrevToCard(abbrev: string): Card {
  const rankStr = abbrev.slice(0, -1);
  const suitA = abbrev.slice(-1);

  const suit = SUITS_ABBREVIATED[suitA as keyof typeof SUITS_ABBREVIATED];
  if (!suit) throw new Error(`Could not find suit ${suitA}`);

  const rank =
    FACES_TO_RANK[rankStr.toUpperCase() as keyof typeof FACES_TO_RANK] ||
    Number(rankStr);

  return create(suit, Number(rank));
}
