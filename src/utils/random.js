import { BOARD_WIDTH } from "../constants/gameConfig";

export const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const randomTopCol = () => Math.floor(Math.random() * BOARD_WIDTH);
