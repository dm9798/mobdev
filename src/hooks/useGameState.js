// src/hooks/useGameState.js
import { useState, useEffect, useRef } from "react";
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  VALID_POSITIONS,
  INITIAL_GROUNDED_COUNT,
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

  // preview (full completed image for 3s)
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // flash effects (yellow/red/orange borders)
  const [effects, setEffects] = useState([]);

  const intervalRef = useRef(null);
  const lockTimeoutRef = useRef(null);
  const lastLockedRef = useRef(null);
  const previewIntervalRef = useRef(null);
  const previewTimeoutRef = useRef(null);

  const tilesLeft = VALID_POSITIONS.length - groundedTiles.length;

  // --- effect helpers ---
  const pushEffect = (fx) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const payload = {
      id,
      color: "yellow",
      mode: "pulse",
      repeats: 3,
      duration: 160,
      borderWidth: 3,
      ...fx,
    };
    setEffects((prev) => [...prev, payload]);
    return id;
  };
  const removeEffect = (id) =>
    setEffects((prev) => prev.filter((e) => e.id !== id));

  const isCellOccupied = (row, col) =>
    groundedTiles.some((t) => t.row === row && t.col === col);

  const canMoveDown = (row, col) =>
    row + 1 < BOARD_HEIGHT && !isCellOccupied(row + 1, col);

  // ---------- spawn helpers ----------
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

        // flash: correct placement
        const fxId = pushEffect({
          row: targetRow,
          col: targetCol,
          color: "yellow",
          mode: "pulse",
          repeats: 3,
          onDone: () => removeEffect(fxId),
        });

        // win check (exact set equality)
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
      // flash red at wrong spot, then teleport + orange pulse
      const redId = pushEffect({
        row: currentRow,
        col: currentCol,
        color: "red",
        mode: "blink",
        repeats: 1,
        duration: 180,
        onDone: () => removeEffect(redId),
      });

      setTimeout(() => {
        setGroundedTiles((prev) => {
          if (prev.some((t) => t.number === activeTile.targetNumber))
            return prev;

          const newTiles = [
            ...prev,
            { row: targetRow, col: targetCol, number: activeTile.targetNumber },
          ];
          lastLockedRef.current = activeTile.targetNumber;

          const orangeId = pushEffect({
            row: targetRow,
            col: targetCol,
            color: "orange",
            mode: "pulse",
            repeats: 3,
            duration: 160,
            onDone: () => removeEffect(orangeId),
          });

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

  // ---------- seed + preview ----------
  const startPreviewCountdown = () => {
    setIsPreviewing(true);
    setCountdown(3);

    // tick 3 -> 2 -> 1 -> 0
    previewIntervalRef.current = setInterval(() => {
      setCountdown((n) => {
        const next = n - 1;
        if (next <= 0) {
          clearInterval(previewIntervalRef.current);
        }
        return next;
      });
    }, 1000);

    // end preview after ~3s (a hair after last tick)
    previewTimeoutRef.current = setTimeout(() => {
      setIsPreviewing(false);
      setCountdown(0);
      spawnTile(); // start the game
    }, 3100);
  };

  const seedInitial = () => {
    // clear timers & memos
    clearInterval(previewIntervalRef.current);
    clearTimeout(previewTimeoutRef.current);
    clearSpawnMemo();
    lastLockedRef.current = null;

    setActiveTile(null);
    setIsGameOver(false);
    setIsWon(false);
    setEffects([]);

    // choose 2 initial grounded tiles that don't violate rules and allow progress
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

      if (initialTiles.length === INITIAL_GROUNDED_COUNT) {
        // ensure game can proceed from this seed
        if (chooseSpawn(initialTiles).length > 0) {
          setGroundedTiles(initialTiles);
          break;
        }
      }
      safety++;
    }

    // show full completed image for 3s, then begin play
    startPreviewCountdown();
  };

  useEffect(() => {
    seedInitial();
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(lockTimeoutRef.current);
      clearInterval(previewIntervalRef.current);
      clearTimeout(previewTimeoutRef.current);
    };
  }, []);

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
      newGame: seedInitial,
    },
  };
};
