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

/** Image puzzle URIs **/
export const PUZZLE_IMAGE_URI =
  "https://bellahomeco.com.au/cdn/shop/products/9_6d329c09-13b8-4e04-a1ed-b40b01f0d054.jpg";
export const PUZZLE_IMAGE_URI_GRAYSCALE =
  "https://i.imghippo.com/files/k1057el.jpg";
export const USE_GRAYSCALE_BG = true;

/** Gameplay seeds **/
export const INITIAL_GROUNDED_COUNT = 2; // <- was 3

// export const UNWANTED_COMBINATIONS = [
//   {
//     combination: [6, 10],
//     requiredPositions: [9],
//   },
//   {
//     combination: [9, 13],
//     requiredPositions: [12],
//   },
//   {
//     combination: [8, 10],
//     requiredPositions: [11],
//   },
//   {
//     combination: [11, 13],
//     requiredPositions: [14],
//   },
//   {
//     combination: [6, 7, 8],
//     requiredPositions: [9, 10, 11, 12, 13, 14],
//   },
//   {
//     combination: [6, 7, 11],
//     requiredPositions: [9, 10, 12, 13, 14],
//   },
//   {
//     combination: [6, 8, 10],
//     requiredPositions: [9, 11, 12, 13, 14],
//   },
//   {
//     combination: [6, 10, 11],
//     requiredPositions: [9, 12, 13, 14],
//   },
//   {
//     combination: [6, 10, 14],
//     requiredPositions: [9, 12, 13],
//   },
//   {
//     combination: [6, 10, 13],
//     requiredPositions: [9, 12],
//   },
//   {
//     combination: [7, 8, 9],
//     requiredPositions: [10, 11, 12, 13, 14],
//   },
//   {
//     combination: [8, 9, 10],
//     requiredPositions: [11, 12, 13, 14],
//   },
//   {
//     combination: [8, 10, 12],
//     requiredPositions: [11, 13, 14],
//   },
//   {
//     combination: [8, 10, 13],
//     requiredPositions: [11, 14],
//   },
//   {
//     combination: [7, 9, 11],
//     requiredPositions: [10, 12, 13, 14],
//   },
//   {
//     combination: [9, 10, 11],
//     requiredPositions: [12, 13, 14],
//   },
//   {
//     combination: [9, 10, 14],
//     requiredPositions: [12, 13],
//   },
//   {
//     combination: [10, 11, 12],
//     requiredPositions: [13, 14],
//   },
//   {
//     combination: [10, 12, 14],
//     requiredPositions: [13],
//   },
// ];

// export const UNWANTED_COMBINATIONS = [
//   { combination: [6, 10], requiredPositions: [9] },
//   { combination: [9, 13], requiredPositions: [12] },
//   { combination: [8, 10], requiredPositions: [11] },
//   { combination: [11, 13], requiredPositions: [14] },
//   { combination: [6, 7, 8], requiredPositions: [9, 10, 11, 12, 13, 14] },
//   { combination: [6, 7, 11], requiredPositions: [9, 10, 12, 13, 14] },
//   { combination: [7, 8, 9], requiredPositions: [10, 11, 12, 13, 14] },
//   { combination: [7, 9, 11], requiredPositions: [10, 12, 13, 14] },
//   { combination: [9, 10, 11], requiredPositions: [12, 13, 14] },
//   { combination: [9, 10, 14], requiredPositions: [12, 13] },
//   { combination: [10, 11, 12], requiredPositions: [13, 14] },
//   { combination: [10, 12, 14], requiredPositions: [13] },
// ];

export const UNWANTED_COMBINATIONS = RULES;
