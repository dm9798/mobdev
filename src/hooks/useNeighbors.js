import { useMemo } from "react";
import { BOARD_WIDTH } from "../constants/gameConfig";

import { rowOf, colOf } from "../utils/positions";

export const useNeighbors = (groundedTiles) => {
  const set = useMemo(
    () => new Set(groundedTiles.map((t) => t.number)),
    [groundedTiles]
  );

  const isCellOccupied = (row, col) =>
    groundedTiles.some((t) => t.row === row && t.col === col);

  const edgeExposureFor = (number) => {
    const r = rowOf(number);
    const c = colOf(number);
    const up = number - BOARD_WIDTH;
    const down = number + BOARD_WIDTH;
    const left = number - 1;
    const right = number + 1;

    return {
      top: r === 2 ? true : !set.has(up),
      bottom: r === 5 ? true : !set.has(down),
      left: c === 0 ? true : !set.has(left),
      right: c === BOARD_WIDTH - 1 ? true : !set.has(right),
    };
  };

  return { groundedSet: set, isCellOccupied, edgeExposureFor };
};
