// src/components/GameCompleteModal.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";

export default function GameCompleteModal({
  visible,
  score,
  categoryTitle,
  onPlayAgain,
  onMainMenu,
}) {
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Category Complete!</Text>
          <Text style={styles.subtitle}>{categoryTitle}</Text>
          <Text style={styles.score}>Final Score: {score}</Text>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#4CAF50" }]}
            onPress={onPlayAgain}
          >
            <Text style={styles.btnText}>Play Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#2196F3" }]}
            onPress={onMainMenu}
          >
            <Text style={styles.btnText}>Main Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: 300,
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#222",
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "bold", color: "white", marginBottom: 6 },
  subtitle: { color: "#bbb", marginBottom: 12 },
  score: { color: "white", fontWeight: "bold", marginBottom: 14 },
  btn: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "bold" },
});
