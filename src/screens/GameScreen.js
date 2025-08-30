// src/screens/GameScreen.js
import React from "react";
import { View, StyleSheet, Text } from "react-native";
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
    score,
  } = state;

  const { moveLeft, moveRight, moveDown, newGame } = actions;

  return (
    <View style={styles.container}>
      <View style={styles.scoreWrapper}>
        <Text style={styles.scoreText}>Score: {state.score}</Text>
      </View>
      <Board
        groundedTiles={groundedTiles}
        activeTile={activeTile}
        isGameOver={isGameOver}
        isWon={isWon}
        isPreviewing={isPreviewing}
        countdown={countdown}
        effects={effects}
        imageUri={currentPuzzleImage}
        score={score}
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
  scoreWrapper: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 6, // space before board
    paddingRight: 10,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
  },
});
