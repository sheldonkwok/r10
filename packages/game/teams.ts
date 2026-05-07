type PlayerLike = { hand: unknown[]; team: "red" | "black" | null };

export function getLosingTeam(players: PlayerLike[]): "red" | "black" | null {
  const withCards = players.filter((p) => p.hand.length > 0);
  if (withCards.length === 0) return null;
  const teams = new Set(withCards.map((p) => p.team));
  return teams.size === 1 ? withCards[0].team : null;
}

export function getWinningTeam(
  players: (PlayerLike & { id: string })[],
  firstFinisherId: string | null,
): "red" | "black" | "wash" | null {
  const losingTeam = getLosingTeam(players);
  if (!losingTeam || !firstFinisherId) return null;
  const first = players.find((p) => p.id === firstFinisherId);
  if (!first) return null;
  if (first.team === losingTeam) return "wash";
  return first.team;
}
