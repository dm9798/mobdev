import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

export const Controls = ({
  onLeft,
  onDown,
  onRight,
  onToggleNumbers,
  onNewGame,
  onToggleFadeBg,
}) => (
  <View style={styles.controls}>
    <TouchableOpacity onPress={onLeft} style={styles.button}>
      <Text style={styles.text}>Left</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onDown} style={styles.button}>
      <Text style={styles.text}>Down</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onRight} style={styles.button}>
      <Text style={styles.text}>Right</Text>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={onToggleNumbers}
      style={[styles.button, { backgroundColor: "#8E44AD" }]}
    >
      <Text style={styles.text}>Toggle Numbers</Text>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={onNewGame}
      style={[styles.button, { backgroundColor: "#4CAF50" }]}
    >
      <Text style={styles.text}>New Game</Text>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={onToggleFadeBg}
      style={[styles.button, { backgroundColor: "#FF9800" }]}
    >
      <Text style={styles.text}>Fade BG</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  controls: {
    flexDirection: "row",
    marginTop: 20,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  button: {
    backgroundColor: "#2196F3",
    marginHorizontal: 5,
    marginVertical: 4,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  text: { color: "white", fontWeight: "bold" },
});
