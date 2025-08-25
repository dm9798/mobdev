// generateUnwantedCombinations.js

const BOARD_WIDTH = 4;
const BOARD_HEIGHT = 6;
const VALID_POSITIONS = Array.from(
  { length: BOARD_WIDTH * BOARD_HEIGHT },
  (_, i) => i
).filter((i) => i >= 8 && i <= 23);

// Insert your actual unwanted combinations here:
const unwantedCombinationsDuringGame = [
  { combination: [16, 21], requiredPositions: [20] },
  { combination: [19, 22], requiredPositions: [23] },
  { combination: [12, 17, 22], requiredPositions: [16, 20, 21] },
  { combination: [15, 18, 21], requiredPositions: [19, 22, 23] },
  { combination: [8, 13], requiredPositions: [12] },
  { combination: [11, 14], requiredPositions: [15] },
  { combination: [15, 18], requiredPositions: [19] },
  { combination: [12, 17], requiredPositions: [16] },
  { combination: [18, 19, 21], requiredPositions: [22, 23] },
  { combination: [12, 17, 21], requiredPositions: [16, 20] },
  { combination: [16, 17, 22], requiredPositions: [20, 21] },
  { combination: [14, 17, 19], requiredPositions: [18] },
  { combination: [10, 13, 15], requiredPositions: [14] },
  { combination: [9, 12, 14], requiredPositions: [13] },
  { combination: [15, 18, 22], requiredPositions: [19, 23] },
  { combination: [13, 16, 18], requiredPositions: [17] },
  { combination: [18, 21, 23], requiredPositions: [22] },
  { combination: [17, 20, 22], requiredPositions: [21] },
  { combination: [8, 13, 18], requiredPositions: [12, 16, 17] },
  { combination: [11, 14, 17], requiredPositions: [15, 18, 19] },
  { combination: [9, 12, 14], requiredPositions: [13] },
  { combination: [11, 14, 18], requiredPositions: [15, 19] },
  { combination: [8, 13, 17], requiredPositions: [12, 16] },
  { combination: [11, 14, 17], requiredPositions: [15, 18, 19] },
  { combination: [8, 13, 17, 20], requiredPositions: [12, 16] },
  { combination: [8, 13, 17, 21], requiredPositions: [12, 16, 20] },
  { combination: [8, 13, 17, 22], requiredPositions: [12, 16, 20, 21] },
  { combination: [8, 13, 18, 21], requiredPositions: [12, 16, 17, 20] },
  { combination: [8, 13, 18, 22], requiredPositions: [12, 16, 17, 20, 21] },
  { combination: [8, 13, 18, 23], requiredPositions: [12, 16, 17, 20, 21, 22] },
  { combination: [14, 15, 17, 21], requiredPositions: [18, 19, 22, 23] },
  { combination: [12, 13, 18, 22], requiredPositions: [16, 17, 20, 21] },
];

const rowOf = (n) => Math.floor(n / BOARD_WIDTH);
const colOf = (n) => n % BOARD_WIDTH;

const isTargetSupported = (num, tiles) => {
  const r = rowOf(num);
  const c = colOf(num);
  if (r === BOARD_HEIGHT - 1) return true;
  return tiles.some((t) => rowOf(t.number) === r + 1 && colOf(t.number) === c);
};

const violatesUnwantedCombination = (tiles, newNum) => {
  const current = [...tiles.map((t) => t.number), newNum];
  return unwantedCombinationsDuringGame.some(
    (rule) =>
      rule.combination.every((n) => current.includes(n)) &&
      rule.requiredPositions.some((rp) => !current.includes(rp))
  );
};

const getSpawnableTargets = (tiles) => {
  const remaining = VALID_POSITIONS.filter(
    (num) => !tiles.some((t) => t.number === num)
  );
  return remaining.filter(
    (num) =>
      isTargetSupported(num, tiles) && !violatesUnwantedCombination(tiles, num)
  );
};

// DFS search to check if we can complete the board
const memo = new Map();

function canComplete(tiles) {
  const key = tiles
    .map((t) => t.number)
    .sort((a, b) => a - b)
    .join(",");
  if (memo.has(key)) return memo.get(key);

  if (tiles.length === VALID_POSITIONS.length) {
    memo.set(key, true);
    return true;
  }

  const spawns = getSpawnableTargets(tiles);
  if (spawns.length === 0) {
    memo.set(key, false);
    return false;
  }

  for (const num of spawns) {
    const newTiles = [...tiles, { number: num }];
    if (canComplete(newTiles)) {
      memo.set(key, true);
      return true;
    }
  }

  memo.set(key, false);
  return false;
}

// Generate minimal unsolvable subsets
function getMinimalUnsolvableSubsets() {
  const subsets = generateAllSubsets(VALID_POSITIONS);
  const unsolvable = subsets.filter(
    (subset) => !canComplete(subset.map((n) => ({ number: n })))
  );
  return unsolvable.filter(
    (subset) =>
      !unsolvable.some(
        (other) =>
          other.length < subset.length && other.every((n) => subset.includes(n))
      )
  );
}

function generateAllSubsets(array) {
  const subsets = [];
  const total = 1 << array.length;
  for (let mask = 1; mask < total; mask++) {
    const subset = [];
    for (let i = 0; i < array.length; i++) {
      if (mask & (1 << i)) subset.push(array[i]);
    }
    subsets.push(subset);
  }
  return subsets;
}

function run() {
  const minimal = getMinimalUnsolvableSubsets();
  const results = minimal.map((set) => ({
    combination: set,
    requiredPositions: VALID_POSITIONS.filter((n) => !set.includes(n)),
  }));

  console.log("Minimal Unwanted Combinations:");
  console.log(JSON.stringify(results, null, 2));
  console.log(`Found ${results.length} minimal unwanted combinations`);
}

run();
