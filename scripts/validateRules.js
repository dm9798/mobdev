#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Numzle rules validator for 5x3 board with 3x3 puzzle (indices 6..14).
 * Run with: node scripts/validateRules.js
 *
 * What it does:
 *  - Normalizes UNWANTED_COMBINATIONS (dedupe + remove supersets)
 *  - Checks global solvability from empty set
 *  - Finds valid 2-tile seeds that can still complete
 *  - Scans all 512 subsets to find deadlocks (no legal next move, not complete)
 *  - Flags redundant rules
 *  - (Optional) writes normalized rules to scripts/normalized-rules.json
 */

/* ---------- Board / puzzle geometry (keep in sync with app) ---------- */
const BOARD_WIDTH = 3;
const BOARD_HEIGHT = 5;
const PUZZLE_ROWS = 3;
const PUZZLE_COLS = 3;
const PUZZLE_START_ROW = BOARD_HEIGHT - PUZZLE_ROWS; // 2
const VALID_POSITIONS = Array.from(
  { length: PUZZLE_ROWS * PUZZLE_COLS },
  (_, k) => {
    const r = PUZZLE_START_ROW + Math.floor(k / PUZZLE_COLS);
    const c = k % PUZZLE_COLS;
    return r * BOARD_WIDTH + c;
  }
); // [6..14]

/* ---------- Paste your rules here OR load from a JSON file ---------- */
// Option A: paste directly (RECOMMENDED for simplicity)
const UNWANTED_COMBINATIONS = [
  {
    combination: [6, 10],
    requiredPositions: [9],
  },
  {
    combination: [9, 13],
    requiredPositions: [12],
  },
  {
    combination: [8, 10],
    requiredPositions: [11],
  },
  {
    combination: [11, 13],
    requiredPositions: [14],
  },
  {
    combination: [6, 7, 8],
    requiredPositions: [9, 10, 11, 12, 13, 14],
  },
  {
    combination: [6, 7, 11],
    requiredPositions: [9, 10, 12, 13, 14],
  },
  {
    combination: [6, 8, 10],
    requiredPositions: [9, 11, 12, 13, 14],
  },
  {
    combination: [6, 10, 11],
    requiredPositions: [9, 12, 13, 14],
  },
  {
    combination: [6, 10, 14],
    requiredPositions: [9, 12, 13],
  },
  {
    combination: [6, 10, 13],
    requiredPositions: [9, 12],
  },
  {
    combination: [7, 8, 9],
    requiredPositions: [10, 11, 12, 13, 14],
  },
  {
    combination: [8, 9, 10],
    requiredPositions: [11, 12, 13, 14],
  },
  {
    combination: [8, 10, 12],
    requiredPositions: [11, 13, 14],
  },
  {
    combination: [8, 10, 13],
    requiredPositions: [11, 14],
  },
  {
    combination: [7, 9, 11],
    requiredPositions: [10, 12, 13, 14],
  },
  {
    combination: [9, 10, 11],
    requiredPositions: [12, 13, 14],
  },
  {
    combination: [9, 10, 14],
    requiredPositions: [12, 13],
  },
  {
    combination: [10, 11, 12],
    requiredPositions: [13, 14],
  },
];

// Option B: load from a JSON file (uncomment if you prefer external file)
// const UNWANTED_COMBINATIONS = require('./rules-3x3.json');

/* ---------- Normalization helpers ---------- */
const normRule = (r) => ({
  combination: [...r.combination].sort((a, b) => a - b),
  requiredPositions: [...r.requiredPositions].sort((a, b) => a - b),
});
const rulesEqual = (a, b) =>
  a.combination.length === b.combination.length &&
  a.requiredPositions.length === b.requiredPositions.length &&
  a.combination.every((v, i) => v === b.combination[i]) &&
  a.requiredPositions.every((v, i) => v === b.requiredPositions[i]);

function buildNormalizedRules(rules) {
  const norm = rules.map(normRule);

  // de-dup exact matches
  const dedup = [];
  for (const r of norm) if (!dedup.some((x) => rulesEqual(x, r))) dedup.push(r);

  // keep only minimal rules (drop supersets with same required subset)
  const minimal = dedup.filter((r, i) => {
    return !dedup.some(
      (s, j) =>
        j !== i &&
        s.combination.length < r.combination.length &&
        s.combination.every((x) => r.combination.includes(x)) &&
        s.requiredPositions.every((x) => r.requiredPositions.includes(x))
    );
  });

  return minimal;
}

/* ---------- Rule checker ---------- */
const RULES = buildNormalizedRules(UNWANTED_COMBINATIONS);

function violates(existingArray, newNum) {
  const occupied = new Set(existingArray.concat(newNum));
  for (const { combination, requiredPositions } of RULES) {
    let hasCombo = true;
    for (const pos of combination) {
      if (!occupied.has(pos)) {
        hasCombo = false;
        break;
      }
    }
    if (!hasCombo) continue;

    // If any requiredPosition is missing, it's a violation.
    for (const req of requiredPositions) {
      if (!occupied.has(req)) return true;
    }
  }
  return false;
}

/* ---------- Generator helpers ---------- */
function remainingTargets(placed) {
  const placedSet = new Set(placed);
  return VALID_POSITIONS.filter((n) => !placedSet.has(n));
}

function relaxedOptions(placed) {
  const rem = remainingTargets(placed);
  return rem.filter((n) => !violates(placed, n));
}

/* ---------- DFS with memo to test solvability ---------- */
const memo = new Map();
const keyFor = (arr) =>
  arr
    .slice()
    .sort((a, b) => a - b)
    .join(",");

function canCompleteFrom(placed) {
  if (placed.length === VALID_POSITIONS.length) return true;
  const key = keyFor(placed);
  if (memo.has(key)) return memo.get(key);

  const options = relaxedOptions(placed);
  if (options.length === 0) {
    memo.set(key, false);
    return false;
  }
  for (const n of options) {
    const next = placed.concat(n);
    if (canCompleteFrom(next)) {
      memo.set(key, true);
      return true;
    }
  }
  memo.set(key, false);
  return false;
}

/* ---------- Subset utilities (9 targets => 512 subsets) ---------- */
function allSubsets(arr) {
  const res = [];
  const m = 1 << arr.length;
  for (let mask = 0; mask < m; mask++) {
    const sub = [];
    for (let i = 0; i < arr.length; i++) {
      if (mask & (1 << i)) sub.push(arr[i]);
    }
    res.push(sub);
  }
  return res;
}

/* ---------- Redundancy finder ---------- */
function findRedundantRules(minimalRules) {
  // A rule r is redundant if removing it keeps the exact same violation set.
  // Heuristic check: if every state that triggers r also triggers another rule.
  // We’ll approximate by checking all subsets that contain r.combination.
  const redundant = [];
  for (let i = 0; i < minimalRules.length; i++) {
    const r = minimalRules[i];
    let alwaysCovered = true;

    // Build all subsets that include r.combination (within VALID_POSITIONS)
    const others = VALID_POSITIONS.filter((x) => !r.combination.includes(x));
    const supersets = allSubsets(others).map((sub) =>
      r.combination.concat(sub)
    );

    for (const state of supersets) {
      // state triggers r if requiredPositions missing
      const hasAllCombo = r.combination.every((x) => state.includes(x));
      const missingReq = r.requiredPositions.some((x) => !state.includes(x));
      if (hasAllCombo && missingReq) {
        // does state also violate without rule r?
        const occupied = new Set(state);
        let violatedByAnother = false;
        for (let j = 0; j < minimalRules.length; j++) {
          if (j === i) continue;
          const { combination, requiredPositions } = minimalRules[j];
          if (combination.every((x) => occupied.has(x))) {
            if (requiredPositions.some((x) => !occupied.has(x))) {
              violatedByAnother = true;
              break;
            }
          }
        }
        if (!violatedByAnother) {
          alwaysCovered = false;
          break;
        }
      }
    }

    if (alwaysCovered) redundant.push(r);
  }
  return redundant;
}

/* ---------- Main report ---------- */
(function main() {
  console.log("=== Numzle Rules Validator (3x3 within 5x3) ===");
  console.log("VALID_POSITIONS:", VALID_POSITIONS.join(", "));
  console.log(`Raw rules: ${UNWANTED_COMBINATIONS.length}`);

  console.log(`Normalized minimal rules: ${RULES.length}`);
  if (RULES.length !== UNWANTED_COMBINATIONS.length) {
    console.log("› Note: normalization removed duplicates/supersets.");
  }

  // Global solvability
  memo.clear();
  const globallySolvable = canCompleteFrom([]);
  console.log(
    `Globally solvable from empty: ${globallySolvable ? "YES" : "NO"}`
  );

  // Seed pairs (choose 2 initial grounded tiles)
  const targets = VALID_POSITIONS.slice();
  const seedPairs = [];
  for (let i = 0; i < targets.length; i++) {
    for (let j = i + 1; j < targets.length; j++) {
      const a = targets[i],
        b = targets[j];
      if (!violates([], a) && !violates([a], b)) {
        seedPairs.push([a, b]);
      }
    }
  }
  console.log(`Valid seed pairs (no immediate violation): ${seedPairs.length}`);

  // Seed pairs that can still complete
  let completableSeeds = 0;
  for (const [a, b] of seedPairs) {
    memo.clear();
    if (canCompleteFrom([a, b])) completableSeeds++;
  }
  console.log(`Seed pairs that can complete: ${completableSeeds}`);

  // Deadlock states
  const subsets = allSubsets(VALID_POSITIONS);
  const deadlocks = [];
  for (const sub of subsets) {
    if (sub.length === VALID_POSITIONS.length) continue; // full
    const opts = relaxedOptions(sub);
    if (opts.length === 0) {
      deadlocks.push(sub.slice().sort((x, y) => x - y));
    }
  }
  console.log(`Deadlock states found: ${deadlocks.length}`);
  if (deadlocks.length) {
    console.log("Example deadlocks (up to 10):");
    deadlocks.slice(0, 10).forEach((s) => console.log("  -", s.join(",")));
  }

  // Redundant rules
  const redundant = findRedundantRules(RULES);
  console.log(`Redundant rules detected: ${redundant.length}`);
  if (redundant.length) {
    redundant.forEach((r, idx) =>
      console.log(
        `  #${idx + 1} combo=[${r.combination.join(
          ","
        )}], requires=[${r.requiredPositions.join(",")}]`
      )
    );
  }

  // Optional: write normalized rules
  const fs = require("fs");
  const out = { VALID_POSITIONS, RULES };
  fs.writeFileSync(
    "scripts/normalized-rules.json",
    JSON.stringify(out, null, 2),
    "utf-8"
  );
  console.log('Wrote normalized rules to "scripts/normalized-rules.json"');
})();

/** ---------- Reachable-state exploration (only legal moves) ---------- */
function canonical(arr) {
  return arr.slice().sort((a, b) => a - b);
}
function keyOf(arr) {
  return canonical(arr).join(",");
}
function expandLegal(state) {
  // legal next moves from this state
  return relaxedOptions(state); // already filters by violates(...)
}
function buildReachable() {
  const seen = new Set();
  const stack = [[]]; // DFS from empty
  seen.add(keyOf([]));

  while (stack.length) {
    const s = stack.pop();
    const opts = expandLegal(s);
    for (const n of opts) {
      const next = s.concat(n);
      const k = keyOf(next);
      if (!seen.has(k)) {
        seen.add(k);
        stack.push(next);
      }
    }
  }
  return seen;
}

function analyzeReachableDeadlocks() {
  const seen = buildReachable();
  const deadlocks = [];
  for (const k of seen) {
    const state = k === "" ? [] : k.split(",").map(Number);
    if (state.length === VALID_POSITIONS.length) continue; // complete
    const opts = relaxedOptions(state);
    if (opts.length === 0) {
      deadlocks.push(state);
    }
  }
  return deadlocks;
}

/** ---------- Which rules are “active” in a given state ---------- */
function activeRulesInState(state) {
  const occ = new Set(state);
  const acts = [];
  for (const r of RULES) {
    const hasCombo = r.combination.every((x) => occ.has(x));
    if (!hasCombo) continue;
    const missingReq = r.requiredPositions.some((x) => !occ.has(x));
    if (missingReq) acts.push(r);
  }
  return acts;
}

(function reachableReport() {
  console.log("\n=== Reachable Analysis ===");
  const reachable = buildReachable();
  // subtract 1 to exclude empty state from count
  console.log(`Reachable states (including empty): ${reachable.size}`);
  const deadlocks = analyzeReachableDeadlocks();
  console.log(`Reachable deadlocks: ${deadlocks.length}`);
  if (deadlocks.length) {
    console.log("Example reachable deadlocks (up to 10):");
    deadlocks.slice(0, 10).forEach((s) => console.log("  -", s.join(",")));
  }

  // Rank rules by how often they are active in reachable deadlocks
  const freq = new Map();
  for (const s of deadlocks) {
    const acts = activeRulesInState(s);
    for (const r of acts) {
      const key = JSON.stringify(r);
      freq.set(key, (freq.get(key) || 0) + 1);
    }
  }
  const ranked = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ rule: JSON.parse(k), count: v }));

  console.log("\n=== Rule Impact on Reachable Deadlocks ===");
  if (ranked.length === 0) {
    console.log("No active rules in reachable deadlocks (great!).");
  } else {
    ranked.slice(0, 10).forEach(({ rule, count }, i) => {
      console.log(
        `#${i + 1} hits=${count} combo=[${rule.combination.join(
          ","
        )}], requires=[${rule.requiredPositions.join(",")}]`
      );
    });
  }
})();
