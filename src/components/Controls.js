// components/Controls.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export const Controls = ({
  // state flags
  isPreviewing,
  isGameOver,
  isWon,
  showNumbers,

  // actions
  moveLeft,
  moveRight,
  moveDown,
  newGame,
  toggleNumbers,
  toggleFadeBg, // optional; harmless if not used by caller
}) => {
  // Only disable movement controls during preview / game over / win
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
    <View style={styles.controls}>
      <Btn label="Left" onPress={moveLeft} disabled={movementDisabled} />
      <Btn label="Down" onPress={moveDown} disabled={movementDisabled} />
      <Btn label="Right" onPress={moveRight} disabled={movementDisabled} />

      <Btn
        label={`Numbers: ${showNumbers ? "On" : "Off"}`}
        onPress={toggleNumbers}
        disabled={false}
        style={{ backgroundColor: "#8E44AD" }}
      />

      {/* If you don’t expose toggleFadeBg, you can remove this button */}
      {toggleFadeBg && (
        <Btn
          label="Toggle Fade BG"
          onPress={toggleFadeBg}
          disabled={false}
          style={{ backgroundColor: "#6C7A89" }}
        />
      )}

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
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
