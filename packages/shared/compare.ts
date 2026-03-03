import * as play from "./play";

interface Compare {
  valid: boolean;
  error?: string;
}

const VALID = { valid: true };

const ERRORS = {
  similar: { valid: false, error: "Must play similar to current best" },
  value: { valid: false, error: "Must submit a higher value play" },
};

export default function compare(curr: play.Play, incoming: play.Play): Compare {
  // Dragon curr: only a higher Dragon or bomb4+ can beat it
  if (curr.name === play.PLAYS.dragon.name) {
    if (incoming.name === play.PLAYS.dragon.name) {
      return incoming.value > curr.value ? VALID : ERRORS.value;
    }
    if (incoming.rank >= play.PLAYS.bomb4.rank) return VALID;
    return ERRORS.similar;
  }

  // Dragon incoming: cannot be played as a bomb over any other play type
  if (incoming.name === play.PLAYS.dragon.name) return ERRORS.similar;

  // Standard comparison
  if (incoming.rank > curr.rank) return VALID;
  if (curr.name !== incoming.name) return ERRORS.similar;
  if (curr.value >= incoming.value) return ERRORS.value;
  return VALID;
}
