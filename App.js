import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { useState, useEffect, useRef } from "react";

const { width } = Dimensions.get("window");

// --- Board constants ---
const BOARD_WIDTH = 4;
const BOARD_HEIGHT = 6;
const BORDER_WIDTH = 1;
const TILE_SIZE = (width * 0.8) / BOARD_WIDTH;
const VALID_POSITIONS = Array.from(
  { length: BOARD_WIDTH * BOARD_HEIGHT },
  (_, i) => i
).filter((i) => i >= 8 && i <= 23); // 8..23 inclusive (16 targets total)

// --- Position helpers ---
const rowOf = (n) => Math.floor(n / BOARD_WIDTH);
const colOf = (n) => n % BOARD_WIDTH;

// --- Random top-row spawn helper ---
const randomTopCol = () => Math.floor(Math.random() * BOARD_WIDTH);

// --- Unwanted Combinations (your set) ---
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
  {
    combination: [8, 9, 10, 11],
    requiredPositions: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
  },
  {
    combination: [9, 10, 11, 12],
    requiredPositions: [8, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
  },
  { combination: [10, 11, 13], requiredPositions: [14, 15] },
  { combination: [8, 9, 14], requiredPositions: [12, 13] },
  {
    combination: [8, 9, 10, 15],
    requiredPositions: [11, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22, 23],
  },
  {
    combination: [9, 10, 12, 15],
    requiredPositions: [8, 11, 13, 14, 16, 17, 18, 19, 20, 21, 22, 23],
  },
  {
    combination: [12, 13, 14, 15],
    requiredPositions: [16, 17, 18, 19, 20, 21, 22, 23],
  },
  {
    combination: [13, 14, 15, 16],
    requiredPositions: [17, 18, 19, 20, 21, 22, 23],
  },
  { combination: [14, 15, 17], requiredPositions: [18, 19] },
  { combination: [12, 13, 18], requiredPositions: [16, 17] },
  {
    combination: [12, 13, 14, 19],
    requiredPositions: [16, 17, 18, 20, 21, 22, 23],
  },
  {
    combination: [13, 14, 16, 19],
    requiredPositions: [17, 18, 20, 21, 22, 23],
  },
  { combination: [14, 17, 19], requiredPositions: [18] },
  { combination: [16, 17, 18, 19], requiredPositions: [20, 21, 22, 23] },
  { combination: [17, 18, 19, 20], requiredPositions: [21, 22, 23] },
  { combination: [18, 19, 21], requiredPositions: [22, 23] },
  { combination: [16, 17, 22], requiredPositions: [20, 21] },
  { combination: [17, 19, 20, 22], requiredPositions: [21, 23] },
  { combination: [16, 19, 21, 22], requiredPositions: [20, 23] },
  { combination: [16, 17, 18, 23], requiredPositions: [20, 21, 22] },
  { combination: [17, 18, 20, 23], requiredPositions: [21, 22] },
  { combination: [16, 18, 21, 23], requiredPositions: [20, 22] },
];

// ---------- Rule normalizer (dedupe & keep minimal) ----------
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

  // remove exact duplicates
  const dedup = [];
  for (const r of norm) if (!dedup.some((x) => rulesEqual(x, r))) dedup.push(r);

  // keep minimal rules only
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

const RULES = buildNormalizedRules(unwantedCombinationsDuringGame);

// --- Rule check ---
const violatesUnwantedCombination = (existingTiles, newNum) => {
  const occupied = [...existingTiles.map((t) => t.number), newNum];
  return RULES.some(({ combination, requiredPositions }) => {
    const hasCombination = combination.every((pos) => occupied.includes(pos));
    const missingRequired = requiredPositions.some(
      (pos) => !occupied.includes(pos)
    );
    return hasCombination && missingRequired;
  });
};

// --- Immediate-support helper (strict mode only) ---
const isTargetSupported = (num, tiles) => {
  const r = rowOf(num);
  const c = colOf(num);
  if (r === BOARD_HEIGHT - 1) return true;
  return tiles.some((t) => rowOf(t.number) === r + 1 && colOf(t.number) === c);
};

// ---------- Two-tier spawnability ----------
const getStrictSpawnableTargets = (tiles) => {
  const remainingTargets = VALID_POSITIONS.filter(
    (num) => !tiles.some((t) => t.number === num)
  );
  return remainingTargets.filter(
    (num) =>
      isTargetSupported(num, tiles) && !violatesUnwantedCombination(tiles, num)
  );
};

const getRelaxedSpawnableTargets = (tiles) => {
  const remainingTargets = VALID_POSITIONS.filter(
    (num) => !tiles.some((t) => t.number === num)
  );
  return remainingTargets.filter(
    (num) => !violatesUnwantedCombination(tiles, num)
  );
};

const getSpawnableTargetsTwoTier = (tiles) => {
  const strict = getStrictSpawnableTargets(tiles);
  return strict.length > 0 ? strict : getRelaxedSpawnableTargets(tiles);
};

// ---------- Look-ahead solver ----------
const memo = new Map();
const keyFor = (tiles) =>
  tiles
    .map((t) => t.number)
    .sort((a, b) => a - b)
    .join(",");

function canCompleteFrom(tiles) {
  if (tiles.length === VALID_POSITIONS.length) return true;
  const key = keyFor(tiles);
  if (memo.has(key)) return memo.get(key);

  const options = getRelaxedSpawnableTargets(tiles);
  if (options.length === 0) {
    memo.set(key, false);
    return false;
  }
  for (const num of options) {
    const next = [...tiles, { number: num }];
    if (canCompleteFrom(next)) {
      memo.set(key, true);
      return true;
    }
  }
  memo.set(key, false);
  return false;
}

const filterByLookahead = (tiles, candidates) => {
  const good = [];
  for (const num of candidates) {
    const next = [...tiles, { number: num }];
    if (canCompleteFrom(next)) good.push(num);
  }
  return good;
};

// ---------- UI components ----------
const Tile = ({ tilePos, number, color }) => (
  <View
    style={[
      styles.tile,
      { top: tilePos.top, left: tilePos.left, backgroundColor: color },
    ]}
  >
    <Text style={styles.tileText}>{number}</Text>
  </View>
);

export default function App() {
  const [groundedTiles, setGroundedTiles] = useState([]);
  const [activeTile, setActiveTile] = useState(null);
  const intervalRef = useRef(null);
  const lockTimeoutRef = useRef(null);
  const lastLockedRef = useRef(null);

  const gridToPixel = (row, col) => ({
    top: row * TILE_SIZE,
    left: col * TILE_SIZE,
  });
  const isCellOccupied = (row, col) =>
    groundedTiles.some((t) => t.row === row && t.col === col);
  const canMoveDown = (row, col) =>
    row + 1 < BOARD_HEIGHT && !isCellOccupied(row + 1, col);

  // ---------- Spawning with look-ahead and random top-row column ----------
  const chooseSpawn = (tiles) => {
    let spawnable = getSpawnableTargetsTwoTier(tiles);
    spawnable = spawnable.filter((num) => !tiles.some((t) => t.number === num));
    const viable = filterByLookahead(tiles, spawnable);
    const pool = viable.length > 0 ? viable : spawnable;

    let finalPool = pool;
    if (finalPool.length > 1) {
      finalPool = finalPool.filter((num) => num !== lastLockedRef.current);
      if (finalPool.length === 0) finalPool = pool; // if all filtered, revert
    }
    return finalPool;
  };

  const spawnTile = () => {
    const pool = chooseSpawn(groundedTiles);
    if (pool.length === 0) {
      console.log("No valid spawn targets remain. Game over.");
      setActiveTile(null);
      return;
    }
    const targetNumber = pool[Math.floor(Math.random() * pool.length)];
    const startingCol = randomTopCol(); // <-- random top-row column
    setActiveTile({ row: 0, col: startingCol, targetNumber });
  };

  const lockAndTeleport = () => {
    if (!activeTile) return;
    const targetRow = rowOf(activeTile.targetNumber);
    const targetCol = colOf(activeTile.targetNumber);

    setGroundedTiles((prev) => {
      const newTiles = [
        ...prev,
        {
          row: targetRow,
          col: targetCol,
          number: activeTile.targetNumber,
          color: "#9B51E0",
        },
      ];
      lastLockedRef.current = activeTile.targetNumber;

      const pool = chooseSpawn(newTiles);
      if (pool.length === 0) {
        console.log("No valid spawn targets remain. Game over.");
        setActiveTile(null);
      } else {
        const targetNumber = pool[Math.floor(Math.random() * pool.length)];
        const startingCol = randomTopCol(); // <-- random top-row column
        setActiveTile({ row: 0, col: startingCol, targetNumber });
      }
      return newTiles;
    });
  };

  // ---------- Gravity ----------
  useEffect(() => {
    if (!activeTile) return;
    intervalRef.current = setInterval(() => {
      setActiveTile((prev) => {
        if (!prev) return null;
        if (prev.row === BOARD_HEIGHT - 1 || !canMoveDown(prev.row, prev.col)) {
          clearInterval(intervalRef.current);
          lockTimeoutRef.current = setTimeout(lockAndTeleport, 500);
          return prev;
        }
        return { ...prev, row: prev.row + 1 };
      });
    }, 800);
    return () => clearInterval(intervalRef.current);
  }, [activeTile, groundedTiles]);

  // ---------- Controls ----------
  const moveLeft = () => {
    if (!activeTile) return;
    setActiveTile((prev) => {
      const newCol = prev.col - 1;
      if (newCol >= 0 && !isCellOccupied(prev.row, newCol))
        return { ...prev, col: newCol };
      return prev;
    });
  };

  const moveRight = () => {
    if (!activeTile) return;
    setActiveTile((prev) => {
      const newCol = prev.col + 1;
      if (newCol < BOARD_WIDTH && !isCellOccupied(prev.row, newCol))
        return { ...prev, col: newCol };
      return prev;
    });
  };

  const moveDown = () => {
    if (!activeTile) return;
    setActiveTile((prev) => {
      if (prev.row === BOARD_HEIGHT - 1 || !canMoveDown(prev.row, prev.col)) {
        clearInterval(intervalRef.current);
        lockTimeoutRef.current = setTimeout(lockAndTeleport, 200);
        return prev;
      }
      return { ...prev, row: prev.row + 1 };
    });
  };

  // ---------- Initial seed ----------
  useEffect(() => {
    let initialNumbers = [];
    let safety = 0;

    while (safety < 200) {
      const pool = [...VALID_POSITIONS];
      initialNumbers = [];
      while (initialNumbers.length < 3 && pool.length) {
        const idx = Math.floor(Math.random() * pool.length);
        const pick = pool.splice(idx, 1)[0];
        const tentativeTiles = initialNumbers.map((n) => ({ number: n }));
        if (!violatesUnwantedCombination(tentativeTiles, pick))
          initialNumbers.push(pick);
      }

      const initialTiles = initialNumbers.map((num) => ({
        row: rowOf(num),
        col: colOf(num),
        number: num,
        color: "yellow",
      }));

      if (chooseSpawn(initialTiles).length > 0) {
        setGroundedTiles(initialTiles);
        break;
      }
      safety++;
    }

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(lockTimeoutRef.current);
    };
  }, []);

  // spawn only after initial groundedTiles are set / after a clear
  useEffect(() => {
    if (groundedTiles.length > 0 && !activeTile) {
      spawnTile();
    }
  }, [groundedTiles]);

  return (
    <View style={styles.container}>
      <View style={styles.board}>
        {[...Array(BOARD_HEIGHT * BOARD_WIDTH)].map((_, i) => (
          <View key={i} style={styles.cell} />
        ))}

        {groundedTiles.map((tile, idx) => (
          <Tile
            key={`g-${idx}`}
            tilePos={gridToPixel(tile.row, tile.col)}
            number={tile.number}
            color={tile.color}
          />
        ))}

        {activeTile && (
          <Tile
            tilePos={gridToPixel(activeTile.row, activeTile.col)}
            number={activeTile.targetNumber}
            color="#9B51E0"
          />
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={moveLeft} style={styles.button}>
          <Text style={styles.buttonText}>Left</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={moveDown} style={styles.button}>
          <Text style={styles.buttonText}>Down</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={moveRight} style={styles.button}>
          <Text style={styles.buttonText}>Right</Text>
        </TouchableOpacity>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "gray",
    justifyContent: "center",
    alignItems: "center",
  },
  board: {
    width: BOARD_WIDTH * TILE_SIZE,
    height: BOARD_HEIGHT * TILE_SIZE,
    backgroundColor: "white",
    flexDirection: "row",
    flexWrap: "wrap",
    position: "relative",
  },
  cell: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderWidth: BORDER_WIDTH,
    borderColor: "black",
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  tileText: {
    color: "white",
    fontWeight: "bold",
    fontSize: TILE_SIZE / 3,
  },
  controls: {
    flexDirection: "row",
    marginTop: 20,
  },
  button: {
    backgroundColor: "#2196F3",
    marginHorizontal: 5,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
