// src/screens/GameScreen.js
import React from "react";
import { View, StyleSheet } from "react-native";
import { Board } from "../components/Board";
import { Controls } from "../components/Controls";
import { useGameState } from "../hooks/useGameState";

export default function GameScreen() {
  const { state, actions } = useGameState();

  const {
    groundedTiles,
    activeTile,
    isGameOver,
    isWon,
    isPreviewing,
    countdown,
    effects,
    currentPuzzleImage,
  } = state;

  const { moveLeft, moveRight, moveDown, newGame } = actions;

  return (
    <View style={styles.container}>
      <Board
        groundedTiles={groundedTiles}
        activeTile={activeTile}
        isGameOver={isGameOver}
        isWon={isWon}
        isPreviewing={isPreviewing}
        countdown={countdown}
        effects={effects}
        imageUri={currentPuzzleImage}
      />

      <Controls
        isPreviewing={isPreviewing}
        isGameOver={isGameOver}
        isWon={isWon}
        moveLeft={moveLeft}
        moveRight={moveRight}
        moveDown={moveDown}
        newGame={newGame}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "gray",
    alignItems: "center",
    justifyContent: "center",
  },
});
