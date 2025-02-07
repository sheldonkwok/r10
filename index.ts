import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

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

async function playGame(hands: card.Card[][]) {
  const rl = readline.createInterface({ input, output });
  let currentPlayer = 0;
  const playedCards: card.Card[] = [];

  while (hands.some((hand) => hand.length > 0)) {
    console.log(`\nPlayer ${currentPlayer + 1}'s turn`);
    console.log(
      "Your hand:",
      hands[currentPlayer].map((c, i) => c.display).join(" ")
    );

    const answer = await rl.question("Choose cards to play: ");
    const selected = answer.split(" ");

    console.log(selected.map(card.convertAbbrevToCard));

    currentPlayer = (currentPlayer + 1) % 6;
  }

  console.log("\nGame Over!");
  rl.close();
}

await playGame(hands);
