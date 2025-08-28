import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import {
  TILE_SIZE,
  IMAGE_SIZE,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  PUZZLE_START_ROW,
  VALID_POSITIONS,
} from "../constants/gameConfig";

import { localColOf, rowOf, colOf, px } from "../utils/positions";

export const Tile = ({
  tilePos,
  number,
  imageUri,
  showNumbers,
  isGrounded = false,
  isActive = false,
  groundedSet, // pass Set of numbers for neighbors
}) => {
  const lr = rowOf(number) - PUZZLE_START_ROW; // 3x3 starts at dynamic start row
  const lc = localColOf(number);

  const base = VALID_POSITIONS[0]; // first target index (e.g., 6)
  const displayNumber = number - (base - 1); // maps [6..14] to [1..9]

  let borders = { top: true, right: true, bottom: true, left: true };
  if (isGrounded && groundedSet) {
    const r = rowOf(number);
    const c = colOf(number);
    const up = number - BOARD_WIDTH;
    const down = number + BOARD_WIDTH;
    const left = number - 1;
    const right = number + 1;

    borders.top = r === PUZZLE_START_ROW ? true : !groundedSet.has(up);
    borders.bottom = r === BOARD_HEIGHT - 1 ? true : !groundedSet.has(down);
    borders.left = c === 0 ? true : !groundedSet.has(left);
    borders.right = c === BOARD_WIDTH - 1 ? true : !groundedSet.has(right);
  }

  return (
    <View
      style={[styles.tile, { top: px(tilePos.top), left: px(tilePos.left) }]}
    >
      <View style={styles.mask}>
        <Image
          source={{ uri: imageUri }}
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

      {showNumbers && <Text style={styles.num}>{displayNumber}</Text>}
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
  num: {
    position: "absolute",
    bottom: 2,
    right: 4,
    color: "white",
    fontWeight: "bold",
    fontSize: TILE_SIZE / 4,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
