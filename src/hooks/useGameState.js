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
import { randomTopCol } from "../utils/random";
import { violatesUnwantedCombination } from "./useRules";
import { planOrder } from "./usePlanner";

// --------------------------------------

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

  //scoring system
  const [score, setScore] = useState(0); // running total across puzzles
  const [madeMistake, setMadeMistake] = useState(false); // per-puzzle flag

  // timers/refs
  const intervalRef = useRef(null);
  const lockTimeoutRef = useRef(null);
  const previewIntervalRef = useRef(null);
  const previewTimeoutRef = useRef(null);

  // deterministic plan for current run (excludes initial two)
  const planRef = useRef([]); // e.g., [9,12,13, ...]
  const planPosRef = useRef(0); // index into planRef.current

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

  // ---------- spawns driven by plan ----------
  const spawnNextFromPlan = () => {
    if (isGameOver || isWon || isPreviewing) return;
    //dev-only check
    if (__DEV__) {
      const target = planRef.current[planPosRef.current];
      if (!VALID_POSITIONS.includes(target)) {
        console.warn("[DEV] Plan produced illegal target:", target);
      }
      if (groundedTiles.some((t) => t.number === target)) {
        console.warn(
          "[DEV] Plan produced duplicate target already grounded:",
          target
        );
      }
    }
    const plan = planRef.current;
    const k = planPosRef.current;

    // if we've placed all from the plan, we should be done (win check elsewhere)
    if (k >= plan.length) {
      setActiveTile(null);
      return;
    }

    const targetNumber = plan[k];
    setActiveTile({ row: 0, col: randomTopCol(), targetNumber });
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

        setScore((s) => s + 100); // correctly grounded tile score

        fireEffect("correct", { row: targetRow, col: targetCol });

        // win?
        const placed = new Set(newTiles.map((t) => t.number));
        const allPlaced = VALID_POSITIONS.every((n) => placed.has(n));
        if (allPlaced) {
          if (!madeMistake) {
            setScore((s) => s + 300); //bonus points correctly completed puzzle
          }
          setActiveTile(null);
          setIsGameOver(false);
          setIsWon(true);
          setTimeout(() => {
            setIsWon(false);
            advancePuzzle();
          }, 900);
          return newTiles;
        }
        //dev-only checks
        if (__DEV__) {
          const nums = new Set(newTiles.map((t) => t.number));
          if (nums.size !== newTiles.length) {
            console.warn(
              "[DEV] Duplicate grounded tile detected!",
              newTiles.map((t) => t.number)
            );
          }
        }

        // advance the plan index and spawn the next
        planPosRef.current += 1;
        spawnNextFromPlan();
        return newTiles;
      });
    } else {
      // wrong + settle
      setScore((s) => s - 100);
      setMadeMistake(true);
      fireEffect("wrong", { row: currentRow, col: currentCol });

      setTimeout(() => {
        setGroundedTiles((prev) => {
          if (prev.some((t) => t.number === activeTile.targetNumber))
            return prev;

          const newTiles = [
            ...prev,
            { row: targetRow, col: targetCol, number: activeTile.targetNumber },
          ];

          fireEffect("settle", { row: targetRow, col: targetCol });

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
          // dev-only checks
          if (__DEV__) {
            const nums = new Set(newTiles.map((t) => t.number));
            if (nums.size !== newTiles.length) {
              console.warn(
                "[DEV] Duplicate grounded tile detected!",
                newTiles.map((t) => t.number)
              );
            }
          }

          planPosRef.current += 1;
          spawnNextFromPlan();
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
    setIsPreviewing(true);
    setCountdown(5);

    previewIntervalRef.current = setInterval(() => {
      setCountdown((n) => {
        const next = n - 1;
        if (next <= 0) clearInterval(previewIntervalRef.current);
        return next;
      });
    }, 1000);

    previewTimeoutRef.current = setTimeout(() => {
      setIsPreviewing(false);
      setCountdown(0);
      // first spawn follows the plan
      spawnNextFromPlan();
    }, 5100);
  };

  const seedInitial = () => {
    // clear timers
    clearInterval(previewIntervalRef.current);
    clearTimeout(previewTimeoutRef.current);

    // clear state
    setActiveTile(null);
    setIsGameOver(false);
    setIsWon(false);
    setEffects([]);
    planRef.current = [];
    planPosRef.current = 0;
    setMadeMistake(false);

    // choose 2 valid seeds and compute a plan
    let tries = 0;
    const MAX_TRIES = 400;

    while (tries < MAX_TRIES) {
      // pick 2 non-violating seeds
      const pool = [...VALID_POSITIONS];
      const chosen = [];
      while (chosen.length < INITIAL_GROUNDED_COUNT && pool.length) {
        const ix = Math.floor(Math.random() * pool.length);
        const pick = pool.splice(ix, 1)[0];
        const temp = chosen.map((n) => ({ number: n }));
        if (!violatesUnwantedCombination(temp, pick)) chosen.push(pick);
      }

      if (chosen.length < INITIAL_GROUNDED_COUNT) {
        tries++;
        continue;
      }

      const initialTiles = chosen.map((num) => ({
        row: rowOf(num),
        col: colOf(num),
        number: num,
      }));

      // compute a full plan; if none, try another seed
      const plan = planOrder(initialTiles);
      if (
        plan &&
        plan.length === VALID_POSITIONS.length - INITIAL_GROUNDED_COUNT
      ) {
        setGroundedTiles(initialTiles);
        planRef.current = plan;
        planPosRef.current = 0;
        startPreviewCountdown();
        return;
      }

      tries++;
    }

    // fallback (should be very rare if rules are reasonable)
    console.warn("[Planner] Could not find a solvable seed after many tries.");
    // Just set any two seeds (no plan), mark game over to avoid loop.
    const a = VALID_POSITIONS[0],
      b = VALID_POSITIONS[1];
    setGroundedTiles([
      { number: a, row: rowOf(a), col: colOf(a) },
      { number: b, row: rowOf(b), col: colOf(b) },
    ]);
    setIsGameOver(true);
  };

  // seed when level/puzzle changes
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

  // Controls
  const newGame = () => {
    setLevelIndex(0);
    setPuzzleIndex(0);
    setScore(0);
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
      score,
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
      nextPuzzle: advancePuzzle, // optional debug
      setLevelIndex,
      setPuzzleIndex,
    },
  };
};
