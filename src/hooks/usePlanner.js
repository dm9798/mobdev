// src/hooks/usePlanner.js
import { BOARD_WIDTH, VALID_POSITIONS } from "../constants/gameConfig";
import { violatesUnwantedCombination } from "./useRules";

const rowOf = (n) => Math.floor(n / BOARD_WIDTH);
const colOf = (n) => n % BOARD_WIDTH;

/**
 * Build a full placement plan (order of the remaining targets) that never
 * violates the unwanted-combination rule at any step.
 *
 * NOTE: No support dependency is enforced — any target can be placed at any time,
 * provided it doesn't violate your rule set.
 *
 * @param {Array<{number:number}>} initialTiles e.g., [{number:6}, {number:10}]
 * @returns {Array<number>|null} plan for the remaining positions, or null if none exists
 */
export function planOrder(initialTiles) {
  const placed = new Set(initialTiles.map((t) => t.number));
  const remaining = VALID_POSITIONS.filter((n) => !placed.has(n));

  // The rule check expects (existingTiles, newNum) in incremental order.
  // initialTiles were already chosen incrementally in seeding (so they’re safe).

  // Heuristic: prefer lower rows first (purely to make search stable),
  // then left->right — but candidates are ALL remaining positions.
  const sortHeuristic = (nums) =>
    nums.slice().sort((a, b) => {
      const ra = rowOf(a),
        rb = rowOf(b);
      if (ra !== rb) return rb - ra; // prefer lower rows first
      return colOf(a) - colOf(b); // then left -> right
    });

  const plan = [];

  function dfs() {
    if (plan.length === remaining.length) return true;

    const options = sortHeuristic(remaining.filter((n) => !placed.has(n)));

    if (options.length === 0) return false;

    for (const n of options) {
      const currentTiles = [...placed].map((x) => ({ number: x }));
      if (violatesUnwantedCombination(currentTiles, n)) continue;

      // choose
      placed.add(n);
      plan.push(n);

      if (dfs()) return true;

      // backtrack
      plan.pop();
      placed.delete(n);
    }

    return false;
  }

  return dfs() ? plan : null;
}
