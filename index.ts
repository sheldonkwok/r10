import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import * as play from "./play";
import * as card from "./card";
import compare from "./compare";

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
  let currentPlayer = 0;
  const playedCards: card.Card[] = [];
  const numPlayers = hands.length;

  let currBestPlay: play.Play | undefined;
  let currBestPlayer: number = currentPlayer;

  const rl = readline.createInterface({ input, output });

  while (hands.some((hand) => hand.length > 0)) {
    console.log(`\nPlayer ${currentPlayer + 1}'s turn`);
    console.log(
      "Your hand:",
      hands[currentPlayer].map((c, i) => c.display).join(" ")
    );

    const answer = await rl.question("Choose cards to play: ");
    if (answer === "p") {
      currentPlayer = (currentPlayer + 1) % numPlayers;
      continue;
    }

    const selected = answer.split(" ");
    console.log(selected);
    const toPlay = selected.map(card.convertAbbrevToCard);
    const currPlay = play.get(toPlay);

    if (currPlay.name === "Illegal") {
      console.warn("Illegal play");
      continue;
    }

    if (!currBestPlay) {
      currBestPlay = currPlay;
      currBestPlayer = currentPlayer;
    } else {
      const result = compare(currBestPlay, currPlay);
      if (result.error) {
        console.warn(result.error);
        continue;
      }

      currBestPlay = currPlay;
    }

    console.log(toPlay, currBestPlay);
    currentPlayer = (currentPlayer + 1) % numPlayers;
  }

  console.log("\nGame Over!");
  rl.close();
}

await playGame(hands);
