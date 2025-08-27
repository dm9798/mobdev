import { useState, useEffect, useRef, useMemo } from "react";
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  TILE_SIZE,
  VALID_POSITIONS,
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
  const [showNumbers, setShowNumbers] = useState(true);

  const intervalRef = useRef(null);
  const lockTimeoutRef = useRef(null);
  const lastLockedRef = useRef(null);

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
    if (isGameOver || isWon) return;
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
    if (!activeTile || isGameOver || isWon) return;
    const targetRow = rowOf(activeTile.targetNumber);
    const targetCol = colOf(activeTile.targetNumber);

    setGroundedTiles((prev) => {
      // Avoid ever inserting a duplicate (belt-and-braces)
      if (prev.some((t) => t.number === activeTile.targetNumber)) {
        console.warn("Duplicate target prevented:", activeTile.targetNumber);
        return prev;
      }

      const newTiles = [
        ...prev,
        { row: targetRow, col: targetCol, number: activeTile.targetNumber },
      ];
      lastLockedRef.current = activeTile.targetNumber;

      // WIN CHECK — exact set equality against VALID_POSITIONS
      const placed = new Set(newTiles.map((t) => t.number));
      const allPlaced = VALID_POSITIONS.every((n) => placed.has(n));
      if (allPlaced) {
        setActiveTile(null);
        setIsGameOver(false); // ensure lose flag isn't lingering
        setIsWon(true);
        return newTiles;
      }

      // otherwise continue spawning
      const pool = chooseSpawn(newTiles);
      if (pool.length === 0) {
        console.log("No valid spawn targets remain. Game over.");
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

  // gravity (inline; keep as-is from your current app if you prefer)
  useEffect(() => {
    if (!activeTile || isGameOver || isWon) return;
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
  }, [activeTile, groundedTiles, isGameOver, isWon]);

  //Debug helper checking if isWon flag is set but the board isn't actually complete
  useEffect(() => {
    const placed = new Set(groundedTiles.map((t) => t.number));
    const missing = VALID_POSITIONS.filter((n) => !placed.has(n));
    if (isWon && missing.length) {
      console.warn("Won but missing tiles?!", missing);
    }
  }, [groundedTiles, isWon]);

  const moveLeft = () => {
    if (!activeTile || isGameOver || isWon) return;
    setActiveTile((p) => {
      const newCol = p.col - 1;
      return newCol >= 0 && !isCellOccupied(p.row, newCol)
        ? { ...p, col: newCol }
        : p;
    });
  };

  const moveRight = () => {
    if (!activeTile || isGameOver || isWon) return;
    setActiveTile((p) => {
      const newCol = p.col + 1;
      return newCol < BOARD_WIDTH && !isCellOccupied(p.row, newCol)
        ? { ...p, col: newCol }
        : p;
    });
  };

  const moveDown = () => {
    if (!activeTile || isGameOver || isWon) return;
    setActiveTile((p) => {
      if (p.row === BOARD_HEIGHT - 1 || !canMoveDown(p.row, p.col)) {
        clearInterval(intervalRef.current);
        lockTimeoutRef.current = setTimeout(lockAndTeleport, 200);
        return p;
      }
      return { ...p, row: p.row + 1 };
    });
  };

  const seedInitial = () => {
    clearSpawnMemo();
    lastLockedRef.current = null;
    setActiveTile(null);
    setIsGameOver(false);
    setIsWon(false);

    let initialNumbers = [];
    let safety = 0;

    while (safety < 200) {
      const pool = [...VALID_POSITIONS];
      initialNumbers = [];
      while (initialNumbers.length < 3 && pool.length) {
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
  };

  useEffect(() => {
    seedInitial();
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(lockTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (groundedTiles.length > 0 && !activeTile && !isGameOver && !isWon) {
      spawnTile();
    }
  }, [groundedTiles, isGameOver, isWon]);

  return {
    state: {
      groundedTiles,
      activeTile,
      isGameOver,
      isWon,
      showNumbers,
      tilesLeft,
    },
    actions: {
      moveLeft,
      moveRight,
      moveDown,
      toggleNumbers: () => setShowNumbers((v) => !v),
      newGame: seedInitial,
    },
  };
};
