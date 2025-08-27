// src/screens/GameOverScreen.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function GameOverScreen({ navigation, route }) {
  const {
    outcome = "win",
    tilesPlaced = 0,
    levelId = "normal",
  } = route.params || {};
  const won = outcome === "win";

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: won ? "lime" : "tomato" }]}>
        {won ? "PUZZLE COMPLETE" : "GAME OVER"}
      </Text>
      <Text style={styles.subtitle}>Level: {levelId}</Text>
      <Text style={styles.subtitle}>Tiles Placed: {tilesPlaced} / 16</Text>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: "#4CAF50" }]}
        onPress={() => navigation.replace("Game", { levelId })}
      >
        <Text style={styles.btnText}>Play Again</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: "#2196F3" }]}
        onPress={() => navigation.popToTop()} // back to MainMenu
      >
        <Text style={styles.btnText}>Main Menu</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#222",
  },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 12, color: "white" },
  subtitle: { color: "#ddd", marginBottom: 8 },
  btn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    width: 200,
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "bold" },
});
