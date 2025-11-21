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
  rank: number; // Number/Face

  display: string;
  value: number; // For scoring
}

export const CARD_RANKS = {
  A: 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
};

const RANK_TO_FACE = {
  [CARD_RANKS["A"]]: "A",
  [CARD_RANKS["J"]]: "J",
  [CARD_RANKS["Q"]]: "Q",
  [CARD_RANKS["K"]]: "K",
} as const;

function cardDisplay(suit: Suit, rank: number): string {
  const display = rank > 1 && rank <= 10 ? rank : RANK_TO_FACE[rank];

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

  const rank = CARD_RANKS[rankStr.toUpperCase() as keyof typeof CARD_RANKS];

  return create(suit, rank);
}

export type Cards = Card[];

export const NUM_PLAYERS = 6;
export function createHands(): Cards[] {
  const deck = createDeck();

  const players = Array.from({ length: NUM_PLAYERS }, () => [] as Card[]);
  for (let i = 0; i < deck.length; i++) {
    players[i % 6].push(deck[i]);
  }

  for (const playerDeck of players) {
    playerDeck.sort((a, b) => b.value - a.value);
  }

  return players;
}

// Cards should be small so we can just iterate

export function handHasPlay(hand: Cards, play: Cards): boolean {
  const marked = new Set<number>();

  for (const pCard of play) {
    for (const [i, hCard] of hand.entries()) {
      if (marked.has(i)) continue;
      if (pCard.display === hCard.display) marked.add(i);
    }
  }

  return marked.size === play.length;
}

// Does assume valid toRemove
export function removeHandCards(hand: Cards, toRemove: Cards): void {
  for (const rCard of toRemove) {
    const idx = hand.findIndex((hCard) => hCard.display === rCard.display);
    if (idx !== -1) hand.splice(idx, 1);
  }
}

export function cardsToStr(cards: Cards): string {
  return cards.map((card) => card.display).join(" ");
}
