// src/screens/LevelSelectScreen.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LEVELS } from "../constants/levels";

export default function LevelSelectScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose a Category</Text>

      {LEVELS.map((lvl) => (
        <TouchableOpacity
          key={lvl.key}
          style={styles.button}
          onPress={() => navigation.navigate("Game", { levelKey: lvl.key })}
        >
          <Text style={styles.buttonText}>{lvl.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  button: {
    width: 240,
    paddingVertical: 14,
    backgroundColor: "#2196F3",
    borderRadius: 8,
    marginVertical: 8,
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
