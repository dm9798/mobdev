// src/components/Board.js
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
} from "../constants/gameConfig";
import { Tile } from "./Tile";
import Flash from "./Flash";

const toImageSource = (src) => {
  if (!src) return null;
  if (typeof src === "string") return { uri: src }; // URL string
  if (typeof src === "object" && src.uri) return src; // already { uri: ... }
  return src; // assume require(...) module
};

export const Board = ({
  groundedTiles,
  activeTile,
  isGameOver,
  isWon,
  isPreviewing,
  countdown,
  effects = [],
  imageUri,
}) => {
  const groundedSet = useMemo(
    () => new Set(groundedTiles.map((t) => t.number)),
    [groundedTiles]
  );

  const gridToPixel = (row, col) => ({
    top: row * TILE_SIZE,
    left: col * TILE_SIZE,
  });

  //console.log("Board imageUri =", imageUri);

  return (
    <View style={styles.board}>
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
            {imageUri && (
              <Image
                source={toImageSource(imageUri)}
                cachePolicy="memory-disk"
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={120}
              />
            )}
          </View>
          {countdown > 0 && (
            <Text style={styles.previewCountdown}>{countdown}</Text>
          )}
        </>
      ) : (
        <>
          {[...Array(BOARD_HEIGHT * BOARD_WIDTH)].map((_, i) => (
            <View key={i} style={styles.cell} />
          ))}

          {groundedTiles.map((tile) => (
            <Tile
              key={tile.number}
              tilePos={gridToPixel(tile.row, tile.col)}
              number={tile.number}
              imageUri={imageUri}
              isGrounded
              groundedSet={groundedSet}
            />
          ))}

          {activeTile && (
            <Tile
              tilePos={gridToPixel(activeTile.row, activeTile.col)}
              number={activeTile.targetNumber}
              imageUri={imageUri}
              isActive
            />
          )}

          {effects.map((fx) => {
            const { top, left } = gridToPixel(fx.row, fx.col);
            return (
              <Flash
                key={fx.id}
                top={top}
                left={left}
                color={fx.color}
                mode={fx.mode}
                repeats={fx.repeats}
                duration={fx.duration}
                borderWidth={fx.borderWidth}
                onDone={fx.onDone}
              />
            );
          })}

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
    backgroundColor: "#D3D3D3",
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
    top: 3 * TILE_SIZE,
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
    top: 0,
    left: 0,
    width: BOARD_WIDTH * TILE_SIZE,
    textAlign: "center",
    fontSize: TILE_SIZE,
    fontWeight: "900",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
