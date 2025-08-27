// src/screens/LevelSelectScreen.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const levels = [
  { id: "easy", label: "Easy" },
  { id: "normal", label: "Normal" },
  { id: "hard", label: "Hard" },
];

export default function LevelSelectScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Level</Text>
      {levels.map((lvl) => (
        <TouchableOpacity
          key={lvl.id}
          style={styles.btn}
          onPress={() => navigation.navigate("Game", { levelId: lvl.id })}
        >
          <Text style={styles.btnText}>{lvl.label}</Text>
        </TouchableOpacity>
      ))}
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
  title: { color: "white", fontSize: 28, marginBottom: 20, fontWeight: "bold" },
  btn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
    width: 200,
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "bold" },
});
