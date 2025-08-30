// src/screens/GameScreen.js
import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { useGameState } from "../hooks/useGameState";
import { Board } from "../components/Board";
import { Controls } from "../components/Controls";
import GameCompleteModal from "../components/GameCompleteModal";

export default function GameScreen({ route }) {
  const levelKey = route?.params?.levelKey ?? null;

  const { state, actions } = useGameState({ levelKey });

  const {
    groundedTiles,
    activeTile,
    isGameOver,
    isWon,
    isPreviewing,
    countdown,
    effects,
    currentPuzzleImage,
    currentLevel,
    score,
    isSeriesComplete,
  } = state;

  const { moveLeft, moveRight, moveDown, newGame } = actions;

  const previewTheme =
    state.currentLevel?.title ?? state.currentLevel?.name ?? "";
  const previewTitle =
    state.currentPuzzle?.title ?? state.currentPuzzle?.name ?? "";

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
        previewTheme={previewTheme}
        previewTitle={previewTitle}
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

      <GameCompleteModal
        visible={isSeriesComplete}
        score={score}
        categoryTitle={currentLevel?.title ?? ""}
        onPlayAgain={() => {
          resetCategory(); // back to puzzle 0 in same category
        }}
        onMainMenu={() => {
          navigation.popToTop(); // back to main menu
        }}
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
