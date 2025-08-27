// src/screens/GameScreen.js
import React, { useEffect } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Board } from "../components/Board";
import { Controls } from "../components/Controls";
import { Progress } from "../components/Progress";
import { useGameState } from "../hooks/useGameState";

export default function GameScreen({ navigation, route }) {
  const { levelId = "normal" } = route.params || {};
  const { state, actions } = useGameState();

  // when finished, navigate to GameOver
  useEffect(() => {
    if (state.isWon || (state.isGameOver && !state.isWon)) {
      navigation.replace("GameOver", {
        outcome: state.isWon ? "win" : "lose",
        tilesPlaced: 16 - state.tilesLeft,
        levelId,
      });
    }
  }, [state.isWon, state.isGameOver]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.pauseBtn}
        onPress={() => navigation.navigate("Pause")}
      >
        <Text style={styles.pauseText}>Pause</Text>
      </TouchableOpacity>

      <Board
        groundedTiles={state.groundedTiles}
        activeTile={state.activeTile}
        isGameOver={state.isGameOver}
        isWon={state.isWon}
        showNumbers={state.showNumbers}
        fadeBg={state.fadeBg}
      />
      <Progress tilesLeft={state.tilesLeft} />
      <Controls
        onLeft={actions.moveLeft}
        onDown={actions.moveDown}
        onRight={actions.moveRight}
        onToggleNumbers={actions.toggleNumbers}
        onNewGame={actions.newGame}
        onToggleFadeBg={actions.toggleFadeBg}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  pauseBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  pauseText: { color: "white", fontWeight: "bold" },
});
