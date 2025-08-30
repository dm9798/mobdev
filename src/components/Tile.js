// src/components/Tile.js
import React from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
// import {
//   TILE_SIZE,
//   IMAGE_SIZE,
//   BOARD_WIDTH,
//   BOARD_HEIGHT,
//   PUZZLE_START_ROW, // <-- use these
//   PUZZLE_SIZE, // <-- (should be 3 for 3×3)
// } from "../constants/gameConfig";

import {
  TILE_SIZE,
  IMAGE_SIZE,
  BOARD_WIDTH,
  PUZZLE_START_ROW,
  PUZZLE_ROWS,
} from "../constants/gameConfig";

import { rowOf, colOf, localColOf, px } from "../utils/positions";

const toImageSource = (src) => {
  if (!src) return null;
  if (typeof src === "string") return { uri: src };
  if (typeof src === "object" && src.uri) return src;
  return src;
};

export const Tile = ({
  tilePos,
  number,
  imageUri,
  isGrounded = false,
  isActive = false,
  groundedSet,
}) => {
  // compute slice within the 3x3
  const r = rowOf(number);
  const c = colOf(number);

  const lr = r - PUZZLE_START_ROW; // 0..2 within 3x3
  const lc = localColOf(number); // 0..2 within 3x3 (since puzzle starts at col 0)

  // edges relative to the 3x3 window
  const topEdge = r === PUZZLE_START_ROW;
  const bottomEdge = r === PUZZLE_START_ROW + (PUZZLE_ROWS - 1);
  const leftEdge = c === 0; // puzzle starts at col 0
  const rightEdge = c === BOARD_WIDTH - 1; // BOARD_WIDTH is 3

  let borders = { top: true, right: true, bottom: true, left: true };
  if (isGrounded && groundedSet) {
    const up = number - BOARD_WIDTH;
    const down = number + BOARD_WIDTH;
    const left = number - 1;
    const right = number + 1;

    borders.top = topEdge ? true : !groundedSet.has(up);
    borders.bottom = bottomEdge ? true : !groundedSet.has(down);
    borders.left = leftEdge ? true : !groundedSet.has(left);
    borders.right = rightEdge ? true : !groundedSet.has(right);
  }

  return (
    <View
      style={[styles.tile, { top: px(tilePos.top), left: px(tilePos.left) }]}
    >
      <View style={styles.mask}>
        <Image
          source={toImageSource(imageUri)}
          cachePolicy="memory-disk"
          style={{
            position: "absolute",
            width: px(IMAGE_SIZE),
            height: px(IMAGE_SIZE),
            top: -lr * TILE_SIZE,
            left: -lc * TILE_SIZE,
          }}
          contentFit="cover"
          transition={100}
        />
      </View>

      {isGrounded ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderColor: "yellow",
              borderTopWidth: borders.top ? 3 : 0,
              borderRightWidth: borders.right ? 3 : 0,
              borderBottomWidth: borders.bottom ? 3 : 0,
              borderLeftWidth: borders.left ? 3 : 0,
            },
          ]}
        />
      ) : isActive ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderColor: "red", borderWidth: 3 },
          ]}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  mask: { width: TILE_SIZE, height: TILE_SIZE, overflow: "hidden" },
});
