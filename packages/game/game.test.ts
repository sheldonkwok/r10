import { beforeEach, describe, expect, it } from "vitest";
import * as card from "./card.ts";
import { Game } from "./game.ts";
import type { LobbyPlayer } from "./types.ts";

const { SUITS, create } = card;

function makeLobbyPlayers(): LobbyPlayer[] {
  return (["p0", "p1", "p2", "p3", "p4", "p5"] as const).map((id, i) => ({
    id,
    username: id,
    avatarUrl: "",
    ready: true,
    isHost: i === 0,
    isBot: false,
  }));
}

// p0: two cards, opens with single 5 (index 0)
// p1: three cards, can CHA with pair of 5s (indices 0,1) or bomb with three 5s
// p2: two cards, can GO with single 5 (index 0)
// p3: has a red 10 (10♦) so they're assigned to the red team — required so
//     getLosingTeam() returns null and the game doesn't immediately appear over
// p4-p5: two filler cards each
function makeChaGoHands(p1Cards?: card.Card[]): card.Cards[] {
  return [
    [create(SUITS.Spades, 5), create(SUITS.Spades, 3)],
    p1Cards ?? [create(SUITS.Clubs, 5), create(SUITS.Diamonds, 5), create(SUITS.Spades, 8)],
    [create(SUITS.Hearts, 5), create(SUITS.Spades, 9)],
    [create(SUITS.Diamonds, 10), create(SUITS.Clubs, 4)], // red team
    [create(SUITS.Diamonds, 3), create(SUITS.Diamonds, 4)],
    [create(SUITS.Hearts, 3), create(SUITS.Hearts, 4)],
  ];
}

describe("CHA/GO mechanics", () => {
  let game: Game;

  describe("opening a round with a single triggers cha-available", () => {
    beforeEach(() => {
      game = new Game("room1", makeLobbyPlayers(), makeChaGoHands());
      game.makePlay([0]); // p0 plays single 5
    });

    it("sets chaGoPhase to cha-available", () => {
      expect(game.getState().chaGoPhase).toBe("cha-available");
    });

    it("advances the turn to the next player without waiting", () => {
      expect(game.getState().currentTurn).toBe(1);
    });

    it("keeps the opening single as the current play", () => {
      expect(game.getState().currentPlay?.playType).toBe("Single");
      expect(game.getState().currentPlay?.playerId).toBe("p0");
    });
  });

  describe("higher single during cha window keeps the phase open", () => {
    // p2 holds a pair of 8s so the phase has someone eligible after p1's escalation.
    function makeMidRoundHands(): card.Cards[] {
      return [
        [create(SUITS.Spades, 5), create(SUITS.Spades, 3)],
        [create(SUITS.Clubs, 5), create(SUITS.Spades, 8)],
        [create(SUITS.Clubs, 8), create(SUITS.Diamonds, 8), create(SUITS.Spades, 9)],
        [create(SUITS.Diamonds, 10), create(SUITS.Clubs, 4)], // red team
        [create(SUITS.Hearts, 5), create(SUITS.Diamonds, 5), create(SUITS.Diamonds, 4)],
        [create(SUITS.Hearts, 3), create(SUITS.Hearts, 4)],
      ];
    }

    beforeEach(() => {
      game = new Game("room1", makeLobbyPlayers(), makeMidRoundHands());
      game.makePlay([0]); // p0 plays single 5 → cha-available (target value 3)
      game.makePlay([1]); // p1 plays single 8 → phase stays cha-available (target value 6)
    });

    it("keeps chaGoPhase as cha-available", () => {
      expect(game.getState().chaGoPhase).toBe("cha-available");
    });

    it("updates currentPlay to the new single", () => {
      expect(game.getState().currentPlay?.playerId).toBe("p1");
      expect(game.getState().currentPlay?.playType).toBe("Single");
    });

    it("allows a CHA matching the new single's value", () => {
      const result = game.makeChaGoPlay("p2", [0, 1]); // pair of 8s
      expect(result.executed).toBe(true);
      expect(game.getState().chaGoPhase).toBe("go-available");
      expect(game.getState().currentPlay?.playerId).toBe("p2");
      expect(game.getState().currentPlay?.playType).toBe("Pair");
    });

    it("rejects a CHA matching the prior single's value", () => {
      // p4 has a pair of 5s — that was the original CHA target, but the
      // window has shifted to value 6 after p1's escalation.
      const result = game.makeChaGoPlay("p4", [0, 1]);
      expect(result.executed).toBe(false);
      expect(game.getState().chaGoPhase).toBe("cha-available");
      expect(game.getState().currentPlay?.playerId).toBe("p1");
    });
  });

  // Fixture where p2 (not the next-up player) holds the CHA pair, used to
  // exercise out-of-turn CHA: p0 opens single 5, currentTurn becomes 1 (p1),
  // but p2 is the one with a pair of 5s. p3 holds a Hearts 5 so a GO is still
  // possible after p2 CHAs (otherwise the phase auto-clears).
  function makeOutOfTurnHands(): card.Cards[] {
    return [
      [create(SUITS.Spades, 5), create(SUITS.Spades, 3)],
      [create(SUITS.Spades, 8), create(SUITS.Clubs, 8), create(SUITS.Hearts, 7)],
      [create(SUITS.Clubs, 5), create(SUITS.Diamonds, 5), create(SUITS.Spades, 9)],
      [create(SUITS.Diamonds, 10), create(SUITS.Hearts, 5)], // red team
      [create(SUITS.Diamonds, 3), create(SUITS.Diamonds, 4)],
      [create(SUITS.Hearts, 3), create(SUITS.Hearts, 4)],
    ];
  }

  describe("CHA succeeds out of turn", () => {
    beforeEach(() => {
      game = new Game("room1", makeLobbyPlayers(), makeOutOfTurnHands());
      game.makePlay([0]); // p0 plays single 5; turn is now p1
      game.makeChaGoPlay("p2", [0, 1]); // p2 CHAs out of turn
    });

    it("sets phase to go-available", () => {
      expect(game.getState().chaGoPhase).toBe("go-available");
    });

    it("makes the CHA pair the current play, played by p2", () => {
      const cp = game.getState().currentPlay;
      expect(cp?.playType).toBe("Pair");
      expect(cp?.playerId).toBe("p2");
    });

    it("moves the turn past the CHA player", () => {
      expect(game.getState().currentTurn).toBe(3);
    });
  });

  describe("CHA after window closed by bomb is a silent no-op", () => {
    // A bomb on top of the opener escalates the round out of the singles
    // ladder, closing the CHA window even though p2 still holds a pair of 5s.
    function makeBombClosesHands(): card.Cards[] {
      return [
        [create(SUITS.Spades, 5), create(SUITS.Spades, 3)],
        [create(SUITS.Clubs, 6), create(SUITS.Diamonds, 6), create(SUITS.Hearts, 6)],
        [create(SUITS.Clubs, 5), create(SUITS.Diamonds, 5), create(SUITS.Spades, 9)],
        [create(SUITS.Diamonds, 10), create(SUITS.Hearts, 5)], // red team
        [create(SUITS.Diamonds, 3), create(SUITS.Diamonds, 4)],
        [create(SUITS.Hearts, 3), create(SUITS.Hearts, 4)],
      ];
    }

    beforeEach(() => {
      game = new Game("room1", makeLobbyPlayers(), makeBombClosesHands());
      game.makePlay([0]); // p0 opens single 5
      game.makePlay([0, 1, 2]); // p1 bombs three 6s → window closes
    });

    it("does not mutate state when a stale CHA arrives", () => {
      const before = game.getState();
      const result = game.makeChaGoPlay("p2", [0, 1]); // p2 still has pair of 5s
      const after = game.getState();
      expect(result.executed).toBe(false);
      expect(after.chaGoPhase).toBeNull();
      expect(after.currentPlay?.playerId).toBe(before.currentPlay?.playerId);
      expect(after.currentTurn).toBe(before.currentTurn);
    });
  });

  describe("invalid CHA cards are silently ignored", () => {
    beforeEach(() => {
      game = new Game("room1", makeLobbyPlayers(), makeOutOfTurnHands());
      game.makePlay([0]); // p0 opens single 5
    });

    it("ignores a single (non-pair) sent during cha-available", () => {
      const result = game.makeChaGoPlay("p2", [0]); // p2 sends just one 5
      expect(result.executed).toBe(false);
      expect(game.getState().chaGoPhase).toBe("cha-available");
      expect(game.getState().currentPlay?.playerId).toBe("p0");
    });
  });

  describe("opener cannot CHA on their own play", () => {
    beforeEach(() => {
      game = new Game("room1", makeLobbyPlayers(), makeChaGoHands());
      game.makePlay([0]); // p0 plays single 5
    });

    it("silent no-op for lastPlayerId attempting CHA", () => {
      // p0 has only a single 5 in this fixture, but the guard runs before card
      // validation — even if they had a pair, lastPlayerId is rejected.
      const before = game.getState();
      game.makeChaGoPlay("p0", [0]);
      const after = game.getState();
      expect(after.chaGoPhase).toBe("cha-available");
      expect(after.currentPlay?.playerId).toBe(before.currentPlay?.playerId);
    });
  });

  describe("bomb during cha-go is silently ignored", () => {
    beforeEach(() => {
      // p1 has three 5s — a three-card bomb
      const hands = makeChaGoHands([
        create(SUITS.Clubs, 5),
        create(SUITS.Diamonds, 5),
        create(SUITS.Hearts, 5),
      ]);
      game = new Game("room1", makeLobbyPlayers(), hands);
      game.makePlay([0]); // p0 plays single 5 → cha-available
    });

    it("does not mutate state when a bomb is sent", () => {
      const result = game.makeChaGoPlay("p1", [0, 1, 2]);
      expect(result.executed).toBe(false);
      expect(game.getState().chaGoPhase).toBe("cha-available");
      expect(game.getState().currentPlay?.playerId).toBe("p0");
    });
  });

  describe("full CHA → GO cycle", () => {
    beforeEach(() => {
      game = new Game("room1", makeLobbyPlayers(), makeChaGoHands());
      game.makePlay([0]); // p0 plays single 5 → cha-available
      game.makeChaGoPlay("p1", [0, 1]); // p1 CHAs → go-available, locked
      game.makeChaGoPlay("p2", [0]); // p2 GOs → cha-available (locked), no remaining 5s
    });

    it("flips back to cha-available after the GO", () => {
      expect(game.getState().chaGoPhase).toBe("cha-available");
    });

    it("keeps the round locked even when no one can CHA again", () => {
      expect(game.getState().chaGoLocked).toBe(true);
    });

    it("keeps the GO player as lastPlayerId", () => {
      expect(game.getState().lastPlayerId).toBe("p2");
    });

    it("keeps the GO player's single as the current play", () => {
      const cp = game.getState().currentPlay;
      expect(cp?.playType).toBe("Single");
      expect(cp?.playerId).toBe("p2");
    });
  });

  describe("after CHA, higher pair via makePlay is rejected", () => {
    // p2 holds a pair of 6s; once p1 has CHA'd, the lock must reject it.
    function makeHigherPairHands(): card.Cards[] {
      return [
        [create(SUITS.Spades, 5), create(SUITS.Spades, 3)],
        [create(SUITS.Clubs, 5), create(SUITS.Diamonds, 5), create(SUITS.Spades, 8)],
        [create(SUITS.Spades, 6), create(SUITS.Clubs, 6), create(SUITS.Spades, 9)],
        [create(SUITS.Diamonds, 10), create(SUITS.Clubs, 4)], // red team
        [create(SUITS.Diamonds, 3), create(SUITS.Diamonds, 4)],
        [create(SUITS.Hearts, 3), create(SUITS.Hearts, 4)],
      ];
    }

    beforeEach(() => {
      game = new Game("room1", makeLobbyPlayers(), makeHigherPairHands());
      game.makePlay([0]); // p0 single 5
      game.makeChaGoPlay("p1", [0, 1]); // p1 CHAs
    });

    it("locks the round after the CHA", () => {
      expect(game.getState().chaGoLocked).toBe(true);
      expect(game.getState().chaGoPhase).toBe("go-available");
    });

    it("rejects p2's pair-of-6s play", () => {
      // currentTurn is p2 (advanced past CHA player p1)
      expect(game.getState().currentTurn).toBe(2);
      const before = game.getState();
      const result = game.makePlay([0, 1]); // pair of 6s
      const after = game.getState();
      expect(result.success).toBe(false);
      expect(after.currentPlay?.playerId).toBe(before.currentPlay?.playerId);
      expect(after.chaGoLocked).toBe(true);
    });
  });

  describe("after CHA with no eligible GO, round wraps back to CHA player", () => {
    // No player other than p1 holds a 5, so no GO is possible after p1 CHAs.
    function makeNoGoHands(): card.Cards[] {
      return [
        [create(SUITS.Spades, 5), create(SUITS.Spades, 3)],
        [create(SUITS.Clubs, 5), create(SUITS.Diamonds, 5), create(SUITS.Spades, 8), create(SUITS.Spades, 9)],
        [create(SUITS.Clubs, 3), create(SUITS.Clubs, 4)],
        [create(SUITS.Diamonds, 10), create(SUITS.Hearts, 4)], // red team
        [create(SUITS.Diamonds, 3), create(SUITS.Diamonds, 4)],
        [create(SUITS.Hearts, 3), create(SUITS.Hearts, 4)],
      ];
    }

    beforeEach(() => {
      game = new Game("room1", makeLobbyPlayers(), makeNoGoHands());
      game.makePlay([0]); // p0 single 5
      game.makeChaGoPlay("p1", [0, 1]); // p1 CHAs → locked
      // pass-around: p2, p3, p4, p5, p0 all pass
      game.pass();
      game.pass();
      game.pass();
      game.pass();
      game.pass();
    });

    it("clears the lock after pass-around", () => {
      expect(game.getState().chaGoLocked).toBe(false);
    });

    it("clears chaGoPhase and currentPlay", () => {
      expect(game.getState().chaGoPhase).toBeNull();
      expect(game.getState().currentPlay).toBeNull();
    });

    it("returns turn to the CHA player", () => {
      expect(game.getState().currentTurn).toBe(1);
    });

    it("lets the CHA player start a new sequence with any play", () => {
      // p1 has 8♠ left — a fresh single is allowed now that the lock is gone
      const result = game.makePlay([0]);
      expect(result.success).toBe(true);
      expect(game.getState().currentPlay?.playerId).toBe("p1");
    });
  });

  describe("after GO, higher single via makePlay is rejected", () => {
    // p2 GOs to complete 1→2→1; p3 holds a higher single 6 that the lock must reject.
    function makePostGoHands(): card.Cards[] {
      return [
        [create(SUITS.Spades, 5), create(SUITS.Spades, 3)],
        [create(SUITS.Clubs, 5), create(SUITS.Diamonds, 5), create(SUITS.Spades, 8)],
        [create(SUITS.Hearts, 5), create(SUITS.Spades, 9)],
        [create(SUITS.Diamonds, 10), create(SUITS.Spades, 6)], // red team, higher single
        [create(SUITS.Diamonds, 3), create(SUITS.Diamonds, 4)],
        [create(SUITS.Hearts, 3), create(SUITS.Hearts, 4)],
      ];
    }

    beforeEach(() => {
      game = new Game("room1", makeLobbyPlayers(), makePostGoHands());
      game.makePlay([0]); // p0 single 5
      game.makeChaGoPlay("p1", [0, 1]); // p1 CHAs
      game.makeChaGoPlay("p2", [0]); // p2 GOs
    });

    it("keeps the round locked", () => {
      expect(game.getState().chaGoLocked).toBe(true);
      expect(game.getState().chaGoPhase).toBe("cha-available");
    });

    it("rejects p3's higher single", () => {
      expect(game.getState().currentTurn).toBe(3);
      const before = game.getState();
      const result = game.makePlay([1]); // single 6
      const after = game.getState();
      expect(result.success).toBe(false);
      expect(after.currentPlay?.playerId).toBe(before.currentPlay?.playerId);
      expect(after.chaGoLocked).toBe(true);
    });
  });

  describe("round wraps back to opener clears chaGoPhase", () => {
    beforeEach(() => {
      // Give p1-p5 hands with no 5s and no card that beats single 5,
      // so they all pass and the round wraps back to p0.
      const hands: card.Cards[] = [
        [create(SUITS.Spades, 5), create(SUITS.Spades, 3)],
        [create(SUITS.Clubs, 3), create(SUITS.Clubs, 4)],
        [create(SUITS.Hearts, 3), create(SUITS.Hearts, 4)],
        [create(SUITS.Diamonds, 10), create(SUITS.Clubs, 4)], // red team
        [create(SUITS.Diamonds, 3), create(SUITS.Diamonds, 4)],
        [create(SUITS.Spades, 4), create(SUITS.Hearts, 4)],
      ];
      game = new Game("room1", makeLobbyPlayers(), hands);
      game.makePlay([0]); // p0 plays single 5 → cha-available
      // No one is eligible (no pair of 5s), so chaGoPhase clears immediately
    });

    it("clears chaGoPhase when no eligible CHA players", () => {
      expect(game.getState().chaGoPhase).toBeNull();
    });
  });
});

describe("bot cha/go preference", () => {
  function makeBotPlayers(): LobbyPlayer[] {
    return makeLobbyPlayers().map((p, i) => ({ ...p, isBot: i === 1 }));
  }

  describe("bot chas when cha-available and has matching pair", () => {
    let game: Game;
    beforeEach(() => {
      // p0 plays single 5 → cha-available; p1 (bot) has pair of 5s at indices 0,1
      game = new Game("room1", makeBotPlayers(), makeChaGoHands());
      game.makePlay([0]); // p0 plays single 5
      // turn is now p1 (bot)
      game.makeBotPlay();
    });

    it("plays a cha instead of a regular card", () => {
      expect(game.getState().chaGoPhase).toBe("go-available");
    });

    it("removes the pair from the bot's hand", () => {
      const p1 = game.getState().players.find((p) => p.id === "p1");
      expect(p1?.handSize).toBe(1);
    });
  });

  describe("bot goes when go-available and has matching single", () => {
    let game: Game;
    beforeEach(() => {
      // p0 opens single 5, p1 (human) chas → go-available, locked
      // p2 (bot) has single 5 and should go
      const players = makeLobbyPlayers().map((p, i) => ({ ...p, isBot: i === 2 }));
      game = new Game("room1", players, makeChaGoHands());
      game.makePlay([0]); // p0 plays single 5 → cha-available
      game.makeChaGoPlay("p1", [0, 1]); // p1 chas → go-available, locked; turn advances past p1
      // currentTurn is now p2 (bot)
      game.makeBotPlay();
    });

    it("goes instead of passing", () => {
      // After bot goes, phase flips back to cha-available (or null if no more)
      const state = game.getState();
      expect(state.chaGoPhase).not.toBe("go-available");
    });

    it("removes the single from the bot's hand", () => {
      const p2 = game.getState().players.find((p) => p.id === "p2");
      expect(p2?.handSize).toBe(1);
    });
  });

  describe("bot passes when chaGoLocked but has no matching cards", () => {
    let game: Game;
    beforeEach(() => {
      // p0 opens single 5; p1 (human) chas → go-available, locked
      // p2 has a 5 but p3 (bot) has no 5s — should pass
      const players = makeLobbyPlayers().map((p, i) => ({ ...p, isBot: i === 3 }));
      // Give p3 cards with no 5s; advance past p2 by having p2 go
      game = new Game("room1", players, makeChaGoHands());
      game.makePlay([0]); // p0 plays single 5 → cha-available
      game.makeChaGoPlay("p1", [0, 1]); // p1 chas → go-available, locked; turn = p2
      game.makeChaGoPlay("p2", [0]); // p2 goes → cha-available, locked; turn = p3
      // p3 (bot) has no 5s and chaGoLocked is true
      game.makeBotPlay();
    });

    it("passes when locked and has no matching cards", () => {
      const state = game.getState();
      // Bot passed, so turn should have advanced away from p3
      expect(state.currentTurn).not.toBe(3);
    });
  });
});
