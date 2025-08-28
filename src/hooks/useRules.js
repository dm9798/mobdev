// src/hooks/useRules.js
// Centralized “unwanted combinations” logic.
// Reads UNWANTED_COMBINATIONS from gameConfig and exposes:
//  - getNormalizedRules(): the minimal, deduped rules
//  - violatesUnwantedCombination(existingTiles, newNum): boolean

import { UNWANTED_COMBINATIONS } from "../constants/gameConfig";

/** ---------- Normalization helpers ---------- **/

const normalizeRule = (r) => ({
  combination: [...r.combination].sort((a, b) => a - b),
  requiredPositions: [...r.requiredPositions].sort((a, b) => a - b),
});

const rulesEqual = (a, b) =>
  a.combination.length === b.combination.length &&
  a.requiredPositions.length === b.requiredPositions.length &&
  a.combination.every((v, i) => v === b.combination[i]) &&
  a.requiredPositions.every((v, i) => v === b.requiredPositions[i]);

// Remove exact duplicates, then keep only “minimal” rules
// (i.e., drop any rule that is a superset of another with same requireds)
const buildNormalizedRules = (rules) => {
  if (!Array.isArray(rules) || rules.length === 0) return [];

  const norm = rules.map(normalizeRule);

  // de-dup exact matches
  const dedup = [];
  for (const r of norm) if (!dedup.some((x) => rulesEqual(x, r))) dedup.push(r);

  // keep only minimal rules
  const minimal = dedup.filter((r, i) => {
    return !dedup.some(
      (s, j) =>
        j !== i &&
        s.combination.every((x) => r.combination.includes(x)) &&
        s.combination.length < r.combination.length &&
        s.requiredPositions.every((x) => r.requiredPositions.includes(x))
    );
  });

  return minimal;
};

/** ---------- Build once at module load ---------- **/

const NORMALIZED_RULES = buildNormalizedRules(UNWANTED_COMBINATIONS);

/** Optional: export if you want to inspect in dev tools */
export const getNormalizedRules = () => NORMALIZED_RULES;

/** ---------- Public checker ---------- **/
/**
 * existingTiles: array of { number: <boardIndex> }
 * newNum: candidate board index to add
 * returns true if adding newNum would violate any rule
 */
export const violatesUnwantedCombination = (existingTiles, newNum) => {
  const rules = NORMALIZED_RULES;
  if (rules.length === 0) return false;

  const occupied = [...existingTiles.map((t) => t.number), newNum];

  return rules.some(({ combination, requiredPositions }) => {
    const hasCombination = combination.every((pos) => occupied.includes(pos));
    if (!hasCombination) return false;

    const missingRequired = requiredPositions.some(
      (pos) => !occupied.includes(pos)
    );
    return hasCombination && missingRequired;
  });
};
