import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useState, useEffect } from "react";

const Tile = ({ tilePos }) => {
  return (
    <View
      style={[styles.tile, { top: tilePos.top, left: tilePos.left }]}
    ></View>
  );
};

export default function App() {
  const [gameboard, setGameboard] = useState([]);
  const [tilePos, setTilePos] = useState({ top: 0, left: 0 });

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
        <Tile tilePos={tilePos} />
      </View>
      <View style={styles.controls}>
        <Button
          style={styles.controlButton}
          title="Left"
          onPress={() => {
            console.log("Button pressed!");
            setTilePos((tilePos) => ({ ...tilePos, left: tilePos.left - 80 }));
          }}
        />
        <Button
          style={styles.controlButton}
          title="Down"
          onPress={() => {
            console.log("Button pressed!");
            setTilePos((tilePos) => ({ ...tilePos, top: tilePos.top + 80 }));
          }}
        />
        <Button
          style={styles.controlButton}
          title="Right"
          onPress={() => {
            console.log("Button pressed!");
            setTilePos((tilePos) => ({ ...tilePos, left: tilePos.left + 80 }));
          }}
        />
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
    backgroundColor: "gray",
  },
  board: {
    flex: 2,
    flexDirection: "row",
    flexWrap: "wrap",
    width: 3 * 80,
    height: 5 * 80,
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
  controls: {
    flex: 1,
    flexDirection: "row",
  },
  controlButton: {
    width: 50,
    height: 50,
    flex: 2,
    margin: 20,
  },
  tile: {
    width: 80,
    height: 80,
    backgroundColor: "purple",
    position: "absolute",
  },
});
