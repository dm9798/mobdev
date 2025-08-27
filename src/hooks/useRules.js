import raw from "../data/unwantedCombinations.json";

const normalizeRule = (r) => ({
  combination: [...r.combination].sort((a, b) => a - b),
  requiredPositions: [...r.requiredPositions].sort((a, b) => a - b),
});

const rulesEqual = (a, b) =>
  a.combination.length === b.combination.length &&
  a.requiredPositions.length === b.requiredPositions.length &&
  a.combination.every((v, i) => v === b.combination[i]) &&
  a.requiredPositions.every((v, i) => v === b.requiredPositions[i]);

const buildNormalizedRules = (rules) => {
  const norm = rules.map(normalizeRule);
  const dedup = [];
  for (const r of norm) if (!dedup.some((x) => rulesEqual(x, r))) dedup.push(r);
  return dedup.filter(
    (r, i) =>
      !dedup.some(
        (s, j) =>
          j !== i &&
          s.combination.every((x) => r.combination.includes(x)) &&
          s.combination.length < r.combination.length &&
          s.requiredPositions.every((x) => r.requiredPositions.includes(x))
      )
  );
};

const RULES = buildNormalizedRules(raw);

export const violatesUnwantedCombination = (tiles, newNum) => {
  const occupied = [...tiles.map((t) => t.number), newNum];
  return RULES.some(({ combination, requiredPositions }) => {
    const hasCombo = combination.every((pos) => occupied.includes(pos));
    const missingReq = requiredPositions.some((pos) => !occupied.includes(pos));
    return hasCombo && missingReq;
  });
};
