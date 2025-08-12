import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { useState, useEffect } from "react";

export default function App() {
  const [gameboard, setGameboard] = useState([]);

  useEffect(() => {
    const initializeBoard = () => {
      let initialArr = [];
      for (let i = 0; i < 15; i++) {
        initialArr.push({ loc: i });
      }
      setGameboard(initialArr);
    };
    initializeBoard();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.board}>
        {gameboard.map((el, index) => (
          <View key={index} style={styles.cell}>
            <Text>{el.loc}</Text>
          </View>
        ))}
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  board: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    width: 3 * 80,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  cell: {
    borderColor: "black",
    borderWidth: 1,
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
});
