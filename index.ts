import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import * as handLib from "./hand";
import * as play from "./play";
import * as card from "./card";
import compare from "./compare";

const hands = card.createHands();

console.log("Players' hands:");
hands.forEach((hand, i) => {
  console.log(`Player ${i}: ${card.cardsToStr(hand)}`);
});

async function playGame(hands: card.Card[][]) {
  let currentPlayer = 0;
  const playedCards: card.Card[] = [];
  const numPlayers = hands.length;

  let currBestPlay: play.Play | undefined;
  let currBestPlayer: number = currentPlayer;

  const rl = readline.createInterface({ input, output });

  // TODO correct game end
  while (hands.some((hand) => hand.length > 0)) {
    if (currBestPlayer === currentPlayer && currBestPlay) {
      currBestPlay = undefined;
      console.log("New round");
    }

    const hand = hands[currentPlayer];
    if (hand.length === 0) continue;

    console.log(
      `\nPlayer ${currentPlayer}'s turn, Curr (p${currBestPlayer}): ${currBestPlay?.name}`
    );
    console.log("Your hand:", hand.map((c, i) => c.display).join(" "));
    const answer = await rl.question("Choose cards to play: ");

    if (answer === "p") {
      if (!currBestPlay) {
        console.log("No play currently");
      } else {
        currentPlayer = (currentPlayer + 1) % numPlayers;
      }
      continue;
    }

    const selected = answer.split(" ");
    const toPlay = selected.map(card.convertAbbrevToCard);
    if (!card.handHasPlay(hand, toPlay)) {
      console.warn("Enter cards from your hand");
      continue;
    }

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
      currBestPlayer = currentPlayer;
    }

    card.removeHandCards(hand, toPlay);
    currentPlayer = (currentPlayer + 1) % numPlayers;
  }

  console.log("\nGame Over!");
  rl.close();
}

await playGame(hands);
