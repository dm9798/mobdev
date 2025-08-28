import { useState, useEffect, useRef } from "react";
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  VALID_POSITIONS,
  INITIAL_GROUNDED_COUNT, // make sure this is 2 in your gameConfig
} from "../constants/gameConfig";

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

  // NEW: preview phase + countdown (3 -> 2 -> 1 -> 0)
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [showNumbers, setShowNumbers] = useState(true);
  const [fadeBg, setFadeBg] = useState(false); // not used in memory mode, leave off

  const intervalRef = useRef(null);
  const lockTimeoutRef = useRef(null);
  const lastLockedRef = useRef(null);
  const previewTimerRef = useRef(null);

  const tilesLeft = VALID_POSITIONS.length - groundedTiles.length;

  const isCellOccupied = (row, col) =>
    groundedTiles.some((t) => t.row === row && t.col === col);

  const canMoveDown = (row, col) =>
    row + 1 < BOARD_HEIGHT && !isCellOccupied(row + 1, col);

  const chooseSpawn = (tiles) => {
    let spawnable = getSpawnableTargetsTwoTier(tiles).filter(
      (n) => !tiles.some((t) => t.number === n)
    );
    const viable = filterByLookahead(tiles, spawnable);
    const pool = viable.length ? viable : spawnable;
    let finalPool = pool;
    if (finalPool.length > 1) {
      finalPool = finalPool.filter((n) => n !== lastLockedRef.current);
      if (!finalPool.length) finalPool = pool;
    }
    return finalPool;
  };

  const spawnTile = () => {
    if (isGameOver || isWon || isPreviewing) return;
    const pool = chooseSpawn(groundedTiles);
    if (!pool.length) {
      setActiveTile(null);
      setIsGameOver(true);
      return;
    }
    const targetNumber = choice(pool);
    setActiveTile({ row: 0, col: randomTopCol(), targetNumber });
  };

  const lockAndTeleport = () => {
    if (!activeTile || isGameOver || isWon || isPreviewing) return;
    const targetRow = rowOf(activeTile.targetNumber);
    const targetCol = colOf(activeTile.targetNumber);

    setGroundedTiles((prev) => {
      if (prev.some((t) => t.number === activeTile.targetNumber)) {
        console.warn("Duplicate target prevented:", activeTile.targetNumber);
        return prev;
      }

      const newTiles = [
        ...prev,
        { row: targetRow, col: targetCol, number: activeTile.targetNumber },
      ];
      lastLockedRef.current = activeTile.targetNumber;

      // Win check: exact set equality
      const placed = new Set(newTiles.map((t) => t.number));
      const allPlaced = VALID_POSITIONS.every((n) => placed.has(n));
      if (allPlaced) {
        setActiveTile(null);
        setIsGameOver(false);
        setIsWon(true);
        return newTiles;
      }

      const pool = chooseSpawn(newTiles);
      if (!pool.length) {
        setActiveTile(null);
        setIsWon(false);
        setIsGameOver(true);
      } else {
        const targetNumber = pool[Math.floor(Math.random() * pool.length)];
        const startingCol = randomTopCol();
        setActiveTile({ row: 0, col: startingCol, targetNumber });
      }
      return newTiles;
    });
  };

  // Gravity — paused during preview
  useEffect(() => {
    if (!activeTile || isGameOver || isWon || isPreviewing) return;
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
    }, 1200);
    return () => clearInterval(intervalRef.current);
  }, [activeTile, groundedTiles, isGameOver, isWon, isPreviewing]);

  const startPreview = () => {
    // 3-second countdown: 3,2,1, then go
    setIsPreviewing(true);
    setCountdown(3);

    clearInterval(previewTimerRef.current);
    previewTimerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(previewTimerRef.current);
          setIsPreviewing(false);
          // after preview ends, seed initial tiles and spawn
          setTimeout(seedInitialAfterPreview, 0);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const seedInitialAfterPreview = () => {
    // do NOT re-clear preview flags here
    // seed 2 grounded tiles, then spawn first active
    let initialNumbers = [];
    let safety = 0;

    while (safety < 200) {
      const pool = [...VALID_POSITIONS];
      initialNumbers = [];
      while (initialNumbers.length < INITIAL_GROUNDED_COUNT && pool.length) {
        const idx = Math.floor(Math.random() * pool.length);
        const pick = pool.splice(idx, 1)[0];
        const temp = initialNumbers.map((n) => ({ number: n }));
        if (!violatesUnwantedCombination(temp, pick)) initialNumbers.push(pick);
      }
      const initialTiles = initialNumbers.map((num) => ({
        row: rowOf(num),
        col: colOf(num),
        number: num,
      }));
      if (chooseSpawn(initialTiles).length > 0) {
        setGroundedTiles(initialTiles);
        break;
      }
      safety++;
    }
    // spawn first active tile once groundedTiles are set (effect below will call spawn)
  };

  const seedNewGame = () => {
    clearSpawnMemo();
    lastLockedRef.current = null;
    setActiveTile(null);
    setGroundedTiles([]);
    setIsGameOver(false);
    setIsWon(false);
    // kick off preview phase
    startPreview();
  };

  useEffect(() => {
    seedNewGame();
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(lockTimeoutRef.current);
      clearInterval(previewTimerRef.current);
    };
  }, []);

  // spawn after initial grounded tiles appear (and not during preview)
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

  // Debug: sanity check win flag
  useEffect(() => {
    const placed = new Set(groundedTiles.map((t) => t.number));
    const missing = VALID_POSITIONS.filter((n) => !placed.has(n));
    if (isWon && missing.length) {
      console.warn("Won but missing tiles?!", missing);
    }
  }, [groundedTiles, isWon]);

  return {
    state: {
      groundedTiles,
      activeTile,
      isGameOver,
      isWon,
      isPreviewing,
      countdown, // 3..0 (show when isPreviewing)
      showNumbers,
      tilesLeft,
      fadeBg,
    },
    actions: {
      moveLeft: () => {
        if (!activeTile || isGameOver || isWon || isPreviewing) return;
        setActiveTile((p) => {
          const newCol = p.col - 1;
          return newCol >= 0 && !isCellOccupied(p.row, newCol)
            ? { ...p, col: newCol }
            : p;
        });
      },
      moveRight: () => {
        if (!activeTile || isGameOver || isWon || isPreviewing) return;
        setActiveTile((p) => {
          const newCol = p.col + 1;
          return newCol < BOARD_WIDTH && !isCellOccupied(p.row, newCol)
            ? { ...p, col: newCol }
            : p;
        });
      },
      moveDown: () => {
        if (!activeTile || isGameOver || isWon || isPreviewing) return;
        setActiveTile((p) => {
          if (p.row === BOARD_HEIGHT - 1 || !canMoveDown(p.row, p.col)) {
            clearInterval(intervalRef.current);
            lockTimeoutRef.current = setTimeout(lockAndTeleport, 200);
            return p;
          }
          return { ...p, row: p.row + 1 };
        });
      },
      toggleNumbers: () => setShowNumbers((v) => !v),
      toggleFadeBg: () => setFadeBg((v) => !v), // unused in memory mode, but harmless
      newGame: seedNewGame,
    },
  };
};
