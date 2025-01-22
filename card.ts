export enum Suit {
  Clubs = "Clubs",
  Diamonds = "Diamonds",
  Hearts = "Hearts",
  Spades = "Spades",
}

const SUITS = [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades];
const R10_SUITS = SUITS.concat(SUITS.slice(0, 2));

export interface Card {
  suit: Suit;
  rank: number;

  display: string;
  value: number;
}

const EMOJIS = {
  [Suit.Clubs]: "♣️",
  [Suit.Diamonds]: "♦️",
  [Suit.Hearts]: "♥️",
  [Suit.Spades]: "♠️",
};

const FACES = {
  "1": "A",
  "11": "J",
  "12": "Q",
  "13": "K",
} as const;

function cardDisplay(suit: Suit, rank: number): string {
  const icon = suit;

  const display =
    rank > 1 && rank <= 10
      ? rank
      : FACES[rank.toString() as keyof typeof FACES];

  return `${display}${EMOJIS[icon]}`;
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

export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of R10_SUITS) {
    for (let rank = 1; rank <= VALUE_MAX; rank++) {
      deck.push(create(suit, rank));
    }
  }

  return shuffleArray(deck);
}
