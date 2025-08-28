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
  PUZZLE_START_ROW,
  VALID_POSITIONS,
} from "../constants/gameConfig";
import { Tile } from "./Tile";

export const Board = ({
  groundedTiles,
  activeTile,
  isGameOver,
  isWon,
  isPreviewing,
  countdown, // 3..0 during preview
  showNumbers,
}) => {
  const groundedSet = useMemo(
    () => new Set(groundedTiles.map((t) => t.number)),
    [groundedTiles]
  );

  const gridToPixel = (row, col) => ({
    top: row * TILE_SIZE,
    left: col * TILE_SIZE,
  });

  return (
    <View style={styles.board}>
      {/* Preview phase: show the completed picture only (no grid, no borders) */}
      {isPreviewing ? (
        <>
          <View
            style={{
              position: "absolute",
              top: PUZZLE_START_ROW * TILE_SIZE,
              left: 0,
              width: IMAGE_SIZE,
              height: IMAGE_SIZE,
            }}
            pointerEvents="none"
          >
            <Image
              source={{ uri: PUZZLE_IMAGE_URI }}
              cachePolicy="memory-disk"
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={120}
            />
          </View>

          {/* Big countdown overlay */}
          {countdown > 0 && (
            <Text style={styles.previewCountdown}>{countdown}</Text>
          )}
        </>
      ) : (
        <>
          {/* Grid (drawn during gameplay; board is otherwise blank) */}
          {[...Array(BOARD_HEIGHT * BOARD_WIDTH)].map((_, i) => (
            <View key={i} style={styles.cell} />
          ))}

          {/* Grounded tiles with borders */}
          {groundedTiles.map((tile) => (
            <Tile
              key={tile.number}
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
        </>
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
    top: 2 * TILE_SIZE, // middle-ish for 5 rows
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
  previewCountdown: {
    position: "absolute",
    top: (BOARD_HEIGHT * TILE_SIZE) / 2 - TILE_SIZE * 0.6,
    left: 0,
    width: BOARD_WIDTH * TILE_SIZE,
    textAlign: "center",
    fontSize: TILE_SIZE * 1.4,
    fontWeight: "900",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
