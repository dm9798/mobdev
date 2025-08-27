// src/screens/PauseModal.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function PauseModal({ navigation }) {
  return (
    <View style={styles.backdrop}>
      <View style={styles.modal}>
        <Text style={styles.title}>Paused</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnText}>Resume</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: "#2196F3" }]}
          onPress={() => navigation.navigate("MainMenu")}
        >
          <Text style={styles.btnText}>Main Menu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    minWidth: 240,
    alignItems: "center",
  },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  btn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
    minWidth: 160,
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "bold" },
});
