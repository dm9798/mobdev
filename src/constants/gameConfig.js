// /src/constants/gameConfig.js
import { Dimensions } from "react-native";
import RULES from "./rules-3x3.json";

const { width } = Dimensions.get("window");

/** Board geometry **/
export const BOARD_WIDTH = 3; // <- was 4
export const BOARD_HEIGHT = 5; // <- was 6
export const BORDER_WIDTH = 1;
export const TILE_SIZE = Math.round((width * 0.8) / BOARD_WIDTH);

// Puzzle footprint (target area) = 3x3 anchored at bottom
export const PUZZLE_COLS = 3;
export const PUZZLE_ROWS = 3;
export const PUZZLE_START_ROW = BOARD_HEIGHT - PUZZLE_ROWS; // 5 - 3 = 2
export const PUZZLE_END_ROW = BOARD_HEIGHT - 1; // 4
export const IMAGE_SIZE = TILE_SIZE * PUZZLE_COLS;

// Valid target board indexes inside the 3x3 area
export const VALID_POSITIONS = Array.from(
  { length: PUZZLE_ROWS * PUZZLE_COLS },
  (_, k) => {
    const r = PUZZLE_START_ROW + Math.floor(k / PUZZLE_COLS);
    const c = k % PUZZLE_COLS;
    return r * BOARD_WIDTH + c;
  }
); // => [6..14] for 5x3 grid

// --- Effect styling (centralized) ---
export const EFFECT_COLORS = {
  correct: "#008000", // dark green
  wrong: "#FF1744", // red
  settle: "yellow", // yellow
  default: "#008000", //dark green
};

export const EFFECT_DEFAULTS = {
  repeats: 3,
  duration: 160, // ms per cycle
  borderWidth: 3, // harmless for fill animation
};

// Optional: per-mode tweaks (merged on top of EFFECT_DEFAULTS)
export const EFFECT_MODES = {
  correct: { repeats: 2, duration: 180 },
  wrong: { repeats: 1, duration: 150 },
  settle: { repeats: 3, duration: 150 },
};

// how long to show "PUZZLE COMPLETE" before starting next preview
export const INTER_PUZZLE_DELAY_MS = 2500;

/** Gameplay seeds **/
export const INITIAL_GROUNDED_COUNT = 2; // <- was 3

export const UNWANTED_COMBINATIONS = RULES;
