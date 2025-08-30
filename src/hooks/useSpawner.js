// // src/hooks/useSpawner.js
// import { VALID_POSITIONS, BOARD_HEIGHT } from "../constants/gameConfig";
// import { rowOf, colOf } from "../utils/positions";
// import { violatesUnwantedCombination } from "./useRules";

// /**
//  * Internal: is the target cell immediately supported by a tile below it?
//  * Bottom row is always considered supported.
//  */
// const isTargetSupported = (num, tiles) => {
//   const r = rowOf(num);
//   const c = colOf(num);
//   if (r === BOARD_HEIGHT - 1) return true;
//   // tiles in this file are always like { number }, not grid-placed
//   return tiles.some((t) => rowOf(t.number) === r + 1 && colOf(t.number) === c);
// };

// /** Strict spawnables = supported AND not violating rules */
// const getStrictSpawnableTargets = (tiles) => {
//   const taken = new Set(tiles.map((t) => t.number));
//   const remaining = VALID_POSITIONS.filter((n) => !taken.has(n));
//   return remaining.filter(
//     (n) => isTargetSupported(n, tiles) && !violatesUnwantedCombination(tiles, n)
//   );
// };

// /** Relaxed spawnables = only rule-checked (no support requirement) */
// const getRelaxedSpawnableTargets = (tiles) => {
//   const taken = new Set(tiles.map((t) => t.number));
//   const remaining = VALID_POSITIONS.filter((n) => !taken.has(n));
//   return remaining.filter((n) => !violatesUnwantedCombination(tiles, n));
// };

// /**
//  * Public: strict→relaxed
//  * Try strict first; if empty, fall back to relaxed.
//  */
// export const getSpawnableTargetsTwoTier = (tiles) => {
//   const strict = getStrictSpawnableTargets(tiles);
//   return strict.length ? strict : getRelaxedSpawnableTargets(tiles);
// };

// /* ---------- Look-ahead solver (memoized, relaxed search) ---------- */

// const memo = new Map();
// const keyFor = (tiles) =>
//   tiles
//     .map((t) => t.number)
//     .sort((a, b) => a - b)
//     .join(",");

// /** DFS: can we complete the board from here (using relaxed options)? */
// function canCompleteFrom(tiles) {
//   if (tiles.length === VALID_POSITIONS.length) return true;
//   const key = keyFor(tiles);
//   if (memo.has(key)) return memo.get(key);

//   const options = getRelaxedSpawnableTargets(tiles);
//   if (options.length === 0) {
//     memo.set(key, false);
//     return false;
//   }

//   for (const num of options) {
//     const next = [...tiles, { number: num }];
//     if (canCompleteFrom(next)) {
//       memo.set(key, true);
//       return true;
//     }
//   }
//   memo.set(key, false);
//   return false;
// }

// /**
//  * Public: filter candidates to only those that keep the position solvable.
//  * Typically called with the (strict→relaxed) pool from getSpawnableTargetsTwoTier.
//  */
// export const filterByLookahead = (tiles, candidates) => {
//   const good = [];
//   for (const num of candidates) {
//     const next = [...tiles, { number: num }];
//     if (canCompleteFrom(next)) good.push(num);
//   }
//   return good;
// };

// /** Public: clear the look-ahead memo (call when starting a new game/puzzle) */
// export const clearSpawnMemo = () => memo.clear();
