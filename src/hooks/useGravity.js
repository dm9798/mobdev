import { useEffect, useRef } from "react";
import { BOARD_HEIGHT } from "../constants/gameConfig";

export const useGravity = ({
  activeTile,
  canMoveDown,
  onLock,
  speed = 800,
  enabled = true,
}) => {
  const intervalRef = useRef(null);
  const lockTimeoutRef = useRef(null);

  useEffect(() => {
    if (!enabled || !activeTile) return;
    intervalRef.current = setInterval(() => {
      // delegate movement to caller via updater
      if (
        activeTile.row === BOARD_HEIGHT - 1 ||
        !canMoveDown(activeTile.row, activeTile.col)
      ) {
        clearInterval(intervalRef.current);
        lockTimeoutRef.current = setTimeout(onLock, 500);
      } else {
        // caller should update activeTile.row + 1
      }
    }, speed);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(lockTimeoutRef.current);
    };
  }, [activeTile, enabled, speed]);
};
