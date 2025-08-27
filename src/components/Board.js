import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  TILE_SIZE,
  IMAGE_SIZE,
  BORDER_WIDTH,
  PUZZLE_IMAGE_URI,
  PUZZLE_IMAGE_URI_GRAYSCALE,
  USE_GRAYSCALE_BG,
  VALID_POSITIONS,
} from "../constants/gameConfig";
import { Tile } from "./Tile";

export const Board = ({
  groundedTiles,
  activeTile,
  isGameOver,
  isWon,
  showNumbers,
  fadeBg,
}) => {
  // build a set of grounded numbers for per-edge border logic
  const groundedSet = useMemo(
    () => new Set(groundedTiles.map((t) => t.number)),
    [groundedTiles]
  );

  // pixel coords from grid coords
  const gridToPixel = (row, col) => ({
    top: row * TILE_SIZE,
    left: col * TILE_SIZE,
  });

  const bgUri =
    USE_GRAYSCALE_BG && PUZZLE_IMAGE_URI_GRAYSCALE
      ? PUZZLE_IMAGE_URI_GRAYSCALE
      : PUZZLE_IMAGE_URI;

  const progress = groundedTiles.length / VALID_POSITIONS.length; // 0..1
  const bgOpacity = fadeBg ? 1 - progress : 1; // linear fade

  return (
    <View style={styles.board}>
      {/* Background image under rows 2..5 (the 4x4 area) */}
      <View
        style={{
          position: "absolute",
          top: 2 * TILE_SIZE,
          left: 0,
          width: IMAGE_SIZE,
          height: IMAGE_SIZE,
        }}
        pointerEvents="none"
      >
        <Image
          source={{ uri: bgUri }}
          cachePolicy="memory-disk"
          style={{ width: "100%", height: "100%", opacity: bgOpacity }}
          contentFit="cover"
          transition={120}
        />
      </View>

      {/* Grid (drawn over background) */}
      {[...Array(BOARD_HEIGHT * BOARD_WIDTH)].map((_, i) => (
        <View key={i} style={styles.cell} />
      ))}

      {/* Grounded tiles */}
      {groundedTiles.map((tile) => (
        <Tile
          key={tile.number} // stable key by target number
          tilePos={gridToPixel(tile.row, tile.col)}
          number={tile.number}
          imageUri={PUZZLE_IMAGE_URI}
          showNumbers={showNumbers}
          isGrounded
          groundedSet={groundedSet}
        />
      ))}

      {/* Active tile */}
      {activeTile && (
        <Tile
          tilePos={gridToPixel(activeTile.row, activeTile.col)}
          number={activeTile.targetNumber}
          imageUri={PUZZLE_IMAGE_URI}
          showNumbers={showNumbers}
          isActive
        />
      )}

      {/* Overlays */}
      {isWon && (
        <Text style={[styles.overlayText, { color: "lime" }]}>
          PUZZLE COMPLETE
        </Text>
      )}
      {isGameOver && !isWon && (
        <Text style={styles.overlayText}>GAME OVER</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  board: {
    width: BOARD_WIDTH * TILE_SIZE,
    height: BOARD_HEIGHT * TILE_SIZE,
    backgroundColor: "white",
    flexDirection: "row",
    flexWrap: "wrap",
    position: "relative",
  },
  cell: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderWidth: BORDER_WIDTH,
    borderColor: "rgba(0,0,0,0.35)",
  },
  overlayText: {
    position: "absolute",
    top: 3 * TILE_SIZE, // 4th row
    left: 0,
    width: BOARD_WIDTH * TILE_SIZE,
    textAlign: "center",
    fontSize: TILE_SIZE / 2,
    fontWeight: "bold",
    color: "red",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: TILE_SIZE * 0.1,
    zIndex: 10,
  },
});
