import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import * as play from "./play";
import * as card from "./card";
import compare from "./compare";

type Team = "red" | "black";
class Player {
  name: string;
  hand: card.Cards;
  team: Team;

  constructor(name: string, hand: card.Cards) {
    this.name = name;
    this.hand = hand;
    this.team = "black";

    for (const c of hand) {
      const isRed =
        c.suit === card.SUITS.Diamonds || c.suit === card.SUITS.Hearts;

      if (c.rank === 10 && isRed) {
        this.team = "red";
      }
    }
  }
}

const hands = card.createHands();
const players = hands.map((hand, i) => new Player(`p${i}`, hand));

console.log("Players' hands:");
players.forEach((p, i) => {
  console.log(`${p.name}: ${card.cardsToStr(p.hand)}`);
});

async function playGame(hands: card.Card[][]) {
  let currentPlayer = 0;
  const numPlayers = players.length;

  let currBestPlay: play.Play | undefined;
  let currBestPlayer: number = currentPlayer;

  const rl = readline.createInterface({ input, output });

  // TODO correct game end
  while (continueGame(players)) {
    if (currBestPlayer === currentPlayer && currBestPlay) {
      currBestPlay = undefined;
      console.log("New round");
    }

    const hand = players[currentPlayer].hand;
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

function continueGame(players: Player[]): boolean {
  let red = 0;
  let black = 0;

  for (const player of players) {
    if (player.team === "black") {
      black++;
    } else {
      red++;
    }
  }

  return red !== 0 && black !== 0;
}
