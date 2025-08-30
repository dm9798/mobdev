// src/hooks/useGameState.js
import { useState, useEffect, useRef } from "react";
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  VALID_POSITIONS,
  INITIAL_GROUNDED_COUNT,
  EFFECT_COLORS,
  EFFECT_DEFAULTS,
  EFFECT_MODES,
} from "../constants/gameConfig";
import { LEVELS } from "../constants/levels";

import { rowOf, colOf } from "../utils/positions";
import { randomTopCol, choice } from "../utils/random";

import {
  getSpawnableTargetsTwoTier,
  filterByLookahead,
  clearSpawnMemo,
} from "./useSpawner";
import { violatesUnwantedCombination } from "./useRules";

export const useGameState = () => {
  const [groundedTiles, setGroundedTiles] = useState([]);
  const [activeTile, setActiveTile] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);

  // preview (full image for 3s)
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // FX list
  const [effects, setEffects] = useState([]);

  // level progression
  const [levelIndex, setLevelIndex] = useState(0);
  const [puzzleIndex, setPuzzleIndex] = useState(0);

  // timers/refs
  const intervalRef = useRef(null);
  const lockTimeoutRef = useRef(null);
  const lastLockedRef = useRef(null);
  const previewIntervalRef = useRef(null);
  const previewTimeoutRef = useRef(null);

  // “first spawn after preview” marker and seed capture for debug/consistency
  const firstSpawnRef = useRef(false);
  const seedTilesRef = useRef(null);

  // derived
  const tilesLeft = VALID_POSITIONS.length - groundedTiles.length;
  const currentLevel = LEVELS[levelIndex] || LEVELS[0];
  const currentPuzzle =
    currentLevel.puzzles[puzzleIndex] || currentLevel.puzzles[0];
  const currentPuzzleImage = currentPuzzle.image;

  // ---------- effects helpers ----------
  const removeEffect = (id) =>
    setEffects((prev) => prev.filter((e) => e.id !== id));

  const pushEffect = (fx = {}) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const type = fx.type || "correct";
    const merged = {
      id,
      color: EFFECT_COLORS[type] ?? EFFECT_COLORS.default,
      ...EFFECT_DEFAULTS,
      ...(EFFECT_MODES[type] || {}),
      ...fx,
    };
    if (!merged.onDone) merged.onDone = () => removeEffect(id);
    setEffects((prev) => [...prev, merged]);
    return id;
  };

  const fireEffect = (type, props) => pushEffect({ type, ...props });

  // ---------- board helpers ----------
  const isCellOccupied = (row, col) =>
    groundedTiles.some((t) => t.row === row && t.col === col);

  const canMoveDown = (row, col) =>
    row + 1 < BOARD_HEIGHT && !isCellOccupied(row + 1, col);

  // ---------- spawn helpers ----------
  const baseSpawnable = (tiles) => {
    const taken = new Set(tiles.map((t) => t.number));
    return getSpawnableTargetsTwoTier(tiles).filter((n) => !taken.has(n));
  };

  const listValidSeedPairs = () => {
    const valid = [];
    for (let i = 0; i < VALID_POSITIONS.length; i++) {
      for (let j = i + 1; j < VALID_POSITIONS.length; j++) {
        const a = VALID_POSITIONS[i];
        const b = VALID_POSITIONS[j];
        if (violatesUnwantedCombination([], a)) continue;
        if (violatesUnwantedCombination([{ number: a }], b)) continue;

        const tiles = [
          { number: a, row: rowOf(a), col: colOf(a) },
          { number: b, row: rowOf(b), col: colOf(b) },
        ];

        if (baseSpawnable(tiles).length > 0) valid.push([a, b]);
      }
    }
    return valid;
  };

  const chooseSpawn = (tiles) => {
    // For the very first spawn *after preview*, use the exact seed tiles
    const baselineTiles = firstSpawnRef.current
      ? seedTilesRef.current || tiles
      : tiles;

    const taken = new Set(baselineTiles.map((t) => t.number));
    const base = getSpawnableTargetsTwoTier(baselineTiles).filter(
      (n) => !taken.has(n)
    );

    if (firstSpawnRef.current) {
      // No lookahead / no lastLocked filtering on the very first spawn
      return base;
    }

    const viable = filterByLookahead(baselineTiles, base);
    const pool = viable.length ? viable : base;

    let finalPool = pool;
    if (finalPool.length > 1) {
      finalPool = finalPool.filter((n) => n !== lastLockedRef.current);
      if (!finalPool.length) finalPool = pool;
    }
    return finalPool;
  };

  const rerollsRef = useRef(0);

  const spawnTile = () => {
    if (isGameOver || isWon || isPreviewing) return;

    const pool = chooseSpawn(groundedTiles);
    if (!pool.length) {
      if (firstSpawnRef.current) {
        // If this ever happens, it’s the race we just fixed; keep a guard anyway.
        rerollsRef.current += 1;
        console.warn(
          "[Spawn] Empty pool right after preview — rerolling seed.",
          {
            rerolls: rerollsRef.current,
            seed: seedTilesRef.current
              ?.map((t) => t.number)
              .sort((a, b) => a - b),
          }
        );
        firstSpawnRef.current = false; // reset and reseed
        seedInitial();
        return;
      }
      console.warn("[Spawn] Empty pool mid-run → Game over.", {
        grounded: groundedTiles.map((t) => t.number).sort((a, b) => a - b),
      });
      setActiveTile(null);
      setIsGameOver(true);
      return;
    }

    firstSpawnRef.current = false; // first spawn succeeded
    const targetNumber = choice(pool);
    setActiveTile({ row: 0, col: randomTopCol(), targetNumber });
  };

  // ---------- progression ----------
  const advancePuzzle = () => {
    setPuzzleIndex((pi) => {
      const nextPi = pi + 1;
      if (nextPi < currentLevel.puzzles.length) return nextPi;
      setLevelIndex((li) => {
        const nextLi = li + 1;
        return nextLi < LEVELS.length ? nextLi : 0;
      });
      return 0;
    });
  };

  // ---------- lock & teleport ----------
  const lockAndTeleport = () => {
    if (!activeTile || isGameOver || isWon || isPreviewing) return;
    const targetRow = rowOf(activeTile.targetNumber);
    const targetCol = colOf(activeTile.targetNumber);
    const currentRow = activeTile.row;
    const currentCol = activeTile.col;
    const sameCol = currentCol === targetCol;

    if (sameCol) {
      setGroundedTiles((prev) => {
        if (prev.some((t) => t.number === activeTile.targetNumber)) return prev;

        const newTiles = [
          ...prev,
          { row: targetRow, col: targetCol, number: activeTile.targetNumber },
        ];
        lastLockedRef.current = activeTile.targetNumber;

        fireEffect("correct", { row: targetRow, col: targetCol });

        // win?
        const placed = new Set(newTiles.map((t) => t.number));
        const allPlaced = VALID_POSITIONS.every((n) => placed.has(n));
        if (allPlaced) {
          setActiveTile(null);
          setIsGameOver(false);
          setIsWon(true);
          setTimeout(() => {
            setIsWon(false);
            advancePuzzle();
          }, 900);
          return newTiles;
        }

        const pool = chooseSpawn(newTiles);
        if (!pool.length) {
          setActiveTile(null);
          setIsWon(false);
          setIsGameOver(true);
        } else {
          const nextTarget = pool[Math.floor(Math.random() * pool.length)];
          setActiveTile({
            row: 0,
            col: randomTopCol(),
            targetNumber: nextTarget,
          });
        }
        return newTiles;
      });
    } else {
      // wrong + settle
      fireEffect("wrong", { row: currentRow, col: currentCol });

      setTimeout(() => {
        setGroundedTiles((prev) => {
          if (prev.some((t) => t.number === activeTile.targetNumber))
            return prev;

          const newTiles = [
            ...prev,
            {
              row: targetRow,
              col: targetCol,
              number: activeTile.targetNumber,
            },
          ];
          lastLockedRef.current = activeTile.targetNumber;

          fireEffect("settle", { row: targetRow, col: targetCol });

          // win?
          const placed = new Set(newTiles.map((t) => t.number));
          const allPlaced = VALID_POSITIONS.every((n) => placed.has(n));
          if (allPlaced) {
            setActiveTile(null);
            setIsGameOver(false);
            setIsWon(true);
            setTimeout(() => {
              setIsWon(false);
              advancePuzzle();
            }, 900);
            return newTiles;
          }

          const pool = chooseSpawn(newTiles);
          if (!pool.length) {
            setActiveTile(null);
            setIsWon(false);
            setIsGameOver(true);
          } else {
            const nextTarget = pool[Math.floor(Math.random() * pool.length)];
            setActiveTile({
              row: 0,
              col: randomTopCol(),
              targetNumber: nextTarget,
            });
          }
          return newTiles;
        });
      }, 220);
    }
  };

  // ---------- gravity ----------
  useEffect(() => {
    if (!activeTile || isGameOver || isWon || isPreviewing) return;
    const id = setInterval(() => {
      setActiveTile((prev) => {
        if (!prev) return null;
        if (prev.row === BOARD_HEIGHT - 1 || !canMoveDown(prev.row, prev.col)) {
          clearInterval(id);
          lockTimeoutRef.current = setTimeout(lockAndTeleport, 500);
          return prev;
        }
        return { ...prev, row: prev.row + 1 };
      });
    }, 1200);
    return () => clearInterval(id);
  }, [activeTile, groundedTiles, isGameOver, isWon, isPreviewing]);

  // ---------- preview & seed ----------
  const startPreviewCountdown = () => {
    // countdown assumes isPreviewing is already true (we set it in seedInitial)
    setCountdown(3);

    previewIntervalRef.current = setInterval(() => {
      setCountdown((n) => {
        const next = n - 1;
        if (next <= 0) clearInterval(previewIntervalRef.current);
        return next;
      });
    }, 1000);

    previewTimeoutRef.current = setTimeout(() => {
      setCountdown(0);
      setIsPreviewing(false); // ← end preview
      firstSpawnRef.current = true; // mark first-spawn window
      spawnTile();
    }, 3100);
  };

  const seedInitial = () => {
    rerollsRef.current = 0;

    // clear timers & memos
    clearInterval(previewIntervalRef.current);
    clearTimeout(previewTimeoutRef.current);
    clearSpawnMemo();
    lastLockedRef.current = null;

    setActiveTile(null);
    setIsGameOver(false);
    setIsWon(false);
    setEffects([]);

    // IMPORTANT: prevent any auto-spawn window by enabling preview FIRST
    setIsPreviewing(true);
    firstSpawnRef.current = false; // preview end will flip to true

    // deterministically compute all valid seed pairs
    const candidates = listValidSeedPairs();

    if (candidates.length === 0) {
      console.warn(
        "[Seed] No valid seed pairs found — using best-effort fallback."
      );
      const pool = [...VALID_POSITIONS];
      const chosen = [];
      while (chosen.length < INITIAL_GROUNDED_COUNT && pool.length) {
        const idx = Math.floor(Math.random() * pool.length);
        const pick = pool.splice(idx, 1)[0];
        const temp = chosen.map((n) => ({ number: n }));
        if (!violatesUnwantedCombination(temp, pick)) chosen.push(pick);
      }
      while (chosen.length < INITIAL_GROUNDED_COUNT && pool.length) {
        chosen.push(pool.pop());
      }
      const initialTiles = chosen.map((num) => ({
        row: rowOf(num),
        col: colOf(num),
        number: num,
      }));
      seedTilesRef.current = initialTiles;
      setGroundedTiles(initialTiles);
      startPreviewCountdown();
      return;
    }

    // Choose a random valid pair
    const [a, b] = candidates[Math.floor(Math.random() * candidates.length)];
    const initialTiles = [
      { number: a, row: rowOf(a), col: colOf(a) },
      { number: b, row: rowOf(b), col: colOf(b) },
    ];
    seedTilesRef.current = initialTiles;
    setGroundedTiles(initialTiles);

    // show full completed image for 3s, then begin play
    startPreviewCountdown();
  };

  // re-seed when levelIndex/puzzleIndex changes
  useEffect(() => {
    seedInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIndex, puzzleIndex]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(lockTimeoutRef.current);
      clearInterval(previewIntervalRef.current);
      clearTimeout(previewTimeoutRef.current);
    };
  }, []);

  // spawn when ready (still guarded by isPreviewing)
  useEffect(() => {
    if (
      groundedTiles.length > 0 &&
      !activeTile &&
      !isGameOver &&
      !isWon &&
      !isPreviewing
    ) {
      spawnTile();
    }
  }, [groundedTiles, isGameOver, isWon, isPreviewing]);

  const newGame = () => {
    setLevelIndex(0);
    setPuzzleIndex(0);
  };

  return {
    state: {
      groundedTiles,
      activeTile,
      isGameOver,
      isWon,
      isPreviewing,
      countdown,
      tilesLeft,
      effects,
      levelIndex,
      puzzleIndex,
      currentLevel,
      currentPuzzle,
      currentPuzzleImage,
    },
    actions: {
      moveLeft: () =>
        setActiveTile((p) => {
          if (!p || isGameOver || isWon || isPreviewing) return p;
          const nc = p.col - 1;
          return nc >= 0 &&
            !groundedTiles.some((t) => t.row === p.row && t.col === nc)
            ? { ...p, col: nc }
            : p;
        }),
      moveRight: () =>
        setActiveTile((p) => {
          if (!p || isGameOver || isWon || isPreviewing) return p;
          const nc = p.col + 1;
          return nc < BOARD_WIDTH &&
            !groundedTiles.some((t) => t.row === p.row && t.col === nc)
            ? { ...p, col: nc }
            : p;
        }),
      moveDown: () =>
        setActiveTile((p) => {
          if (!p || isGameOver || isWon || isPreviewing) return p;
          if (p.row === BOARD_HEIGHT - 1 || !canMoveDown(p.row, p.col)) {
            clearInterval(intervalRef.current);
            lockTimeoutRef.current = setTimeout(lockAndTeleport, 200);
            return p;
          }
          return { ...p, row: p.row + 1 };
        }),
      newGame,
      nextPuzzle: advancePuzzle,
      setLevelIndex,
      setPuzzleIndex,
    },
  };
};
