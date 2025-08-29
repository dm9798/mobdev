// src/components/Controls.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export const Controls = ({
  isPreviewing,
  isGameOver,
  isWon,

  moveLeft,
  moveRight,
  moveDown,
  newGame,
}) => {
  const movementDisabled = isPreviewing || isGameOver || isWon;

  const Btn = ({ onPress, disabled, label, style }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.buttonDisabled, style]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="controls" style={styles.controls}>
      <Btn label="Left" onPress={moveLeft} disabled={movementDisabled} />
      <Btn label="Down" onPress={moveDown} disabled={movementDisabled} />
      <Btn label="Right" onPress={moveRight} disabled={movementDisabled} />
      <Btn
        label="New Game"
        onPress={newGame}
        disabled={false}
        style={{ backgroundColor: "#4CAF50" }}
      />
    </View>
  );
};

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
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "white", fontWeight: "bold" },
});
