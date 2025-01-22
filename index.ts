import * as card from "./card.ts";

function createHands(): card.Card[][] {
  const deck = card.createDeck();

  const players = Array.from({ length: 6 }, () => [] as card.Card[]);
  for (let i = 0; i < deck.length; i++) {
    players[i % 6].push(deck[i]);
  }

  for (const playerDeck of players) {
    playerDeck.sort((a, b) => b.value - a.value);
  }

  return players;
}

const hands = createHands();
console.log("Players' hands:");
hands.forEach((hand, i) => {
  console.log(`Player ${i + 1}:`, hand.map((card) => card.display).join(" "));
});
