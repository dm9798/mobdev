import { BOARD_HEIGHT, VALID_POSITIONS } from "../constants/gameConfig";

import { rowOf, colOf } from "../utils/positions";
import { violatesUnwantedCombination } from "./useRules";

const isTargetSupported = (num, tiles) => {
  const r = rowOf(num);
  const c = colOf(num);
  if (r === BOARD_HEIGHT - 1) return true;
  return tiles.some((t) => rowOf(t.number) === r + 1 && colOf(t.number) === c);
};

const getStrictSpawnable = (tiles) =>
  VALID_POSITIONS.filter((n) => !tiles.some((t) => t.number === n)).filter(
    (n) => isTargetSupported(n, tiles) && !violatesUnwantedCombination(tiles, n)
  );

const getRelaxedSpawnable = (tiles) =>
  VALID_POSITIONS.filter((n) => !tiles.some((t) => t.number === n)).filter(
    (n) => !violatesUnwantedCombination(tiles, n)
  );

export const getSpawnableTargetsTwoTier = (tiles) => {
  const strict = getStrictSpawnable(tiles);
  return strict.length ? strict : getRelaxedSpawnable(tiles);
};

// Simple memoized DFS look-ahead
const memo = new Map();
const keyFor = (tiles) =>
  tiles
    .map((t) => t.number)
    .sort((a, b) => a - b)
    .join(",");

export const canCompleteFrom = (tiles) => {
  if (tiles.length === VALID_POSITIONS.length) return true;
  const key = keyFor(tiles);
  if (memo.has(key)) return memo.get(key);

  const options = getRelaxedSpawnable(tiles);
  if (!options.length) {
    memo.set(key, false);
    return false;
  }
  for (const n of options) {
    if (canCompleteFrom([...tiles, { number: n }])) {
      memo.set(key, true);
      return true;
    }
  }
  memo.set(key, false);
  return false;
};

export const filterByLookahead = (tiles, candidates) =>
  candidates.filter((n) => canCompleteFrom([...tiles, { number: n }]));

export const clearSpawnMemo = () => memo.clear();
