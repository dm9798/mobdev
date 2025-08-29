// src/components/Tile.js
import React from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { TILE_SIZE, IMAGE_SIZE, BOARD_WIDTH } from "../constants/gameConfig";
import { rowOf, colOf, localColOf, px } from "../utils/positions";

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
  // if your puzzle start row varies, adjust this:
  const lr = r - 2; // e.g., if puzzle starts at row index 2
  const lc = localColOf(number);

  let borders = { top: true, right: true, bottom: true, left: true };
  if (isGrounded && groundedSet) {
    const up = number - BOARD_WIDTH;
    const down = number + BOARD_WIDTH;
    const left = number - 1;
    const right = number + 1;

    borders.top = r === 2 ? true : !groundedSet.has(up);
    borders.bottom = r === 5 ? true : !groundedSet.has(down);
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
