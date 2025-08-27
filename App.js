import React from "react";
import { View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Board } from "./src/components/Board";
import { Controls } from "./src/components/Controls";
import { Progress } from "./src/components/Progress";
import { useGameState } from "./src/hooks/useGameState";

const PUZZLE_IMAGE_URI =
  "https://bellahomeco.com.au/cdn/shop/products/9_6d329c09-13b8-4e04-a1ed-b40b01f0d054.jpg";
const PUZZLE_IMAGE_URI_GRAYSCALE = "https://i.imghippo.com/files/k1057el.jpg";

export default function App() {
  const { state, actions } = useGameState();

  return (
    <View style={styles.container}>
      <Board
        groundedTiles={state.groundedTiles}
        activeTile={state.activeTile}
        isGameOver={state.isGameOver}
        isWon={state.isWon}
        showNumbers={state.showNumbers}
        puzzleUri={PUZZLE_IMAGE_URI}
        puzzleGrayUri={PUZZLE_IMAGE_URI_GRAYSCALE}
        useGrayscale
      />
      <Progress tilesLeft={state.tilesLeft} />
      <Controls
        onLeft={actions.moveLeft}
        onDown={actions.moveDown}
        onRight={actions.moveRight}
        onToggleNumbers={actions.toggleNumbers}
        onNewGame={actions.newGame}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "gray",
    justifyContent: "center",
    alignItems: "center",
  },
});
