// src/screens/MainMenuScreen.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function MainMenuScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Numzle</Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate("LevelSelect")}
      >
        <Text style={styles.btnText}>Play</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: "#666" }]}
        onPress={() => {
          /* future: Settings */
        }}
      >
        <Text style={styles.btnText}>Settings</Text>
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
  title: { color: "white", fontSize: 36, marginBottom: 24, fontWeight: "bold" },
  btn: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  btnText: { color: "white", fontWeight: "bold" },
});
