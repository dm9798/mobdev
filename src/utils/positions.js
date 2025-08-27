import { BOARD_WIDTH } from "../constants/gameConfig";

export const rowOf = (n) => Math.floor(n / BOARD_WIDTH);
export const colOf = (n) => n % BOARD_WIDTH;
export const localRowOf = (n) => rowOf(n) - 2; // 8..23 -> 0..3
export const localColOf = (n) => colOf(n);
export const indexOf = (row, col) => row * BOARD_WIDTH + col;
export const px = (n) => Math.round(n);
