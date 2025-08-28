// src/screens/GameScreen.js
import React from "react";
import { View, StyleSheet } from "react-native";
import { Board } from "../components/Board";
import { Controls } from "../components/Controls";
import { useGameState } from "../hooks/useGameState";

export default function GameScreen() {
  const {
    state: {
      groundedTiles,
      activeTile,
      isGameOver,
      isWon,
      isPreviewing,
      countdown,
      showNumbers,
      fadeBg,
    },
    actions: {
      moveLeft,
      moveRight,
      moveDown,
      toggleNumbers,
      toggleFadeBg,
      newGame,
    },
  } = useGameState();

  return (
    <View style={styles.container}>
      <Board
        groundedTiles={groundedTiles}
        activeTile={activeTile}
        isGameOver={isGameOver}
        isWon={isWon}
        isPreviewing={isPreviewing}
        countdown={countdown}
        showNumbers={showNumbers}
        fadeBg={fadeBg}
      />

      <Controls
        isPreviewing={isPreviewing}
        isGameOver={isGameOver}
        isWon={isWon}
        showNumbers={showNumbers}
        moveLeft={moveLeft}
        moveRight={moveRight}
        moveDown={moveDown}
        toggleNumbers={toggleNumbers}
        toggleFadeBg={toggleFadeBg} // optional
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
