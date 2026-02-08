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
  if (incoming.rank > curr.rank) return VALID;

  if (curr.name !== incoming.name) return ERRORS.similar;
  if (curr.value >= incoming.value) return ERRORS.value;

  return VALID;
}
