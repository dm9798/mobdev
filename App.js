import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { useState, useEffect, useRef } from "react";

// Get the device's screen width to make the layout responsive
const { width } = Dimensions.get("window");

// --- Responsive constants ---
const BORDER_WIDTH = 1;
const BOARD_WIDTH_IN_TILES = 4;
const BOARD_HEIGHT_IN_TILES = 6;

// Calculate the tile size based on the screen width
const TILE_SIZE = (width * 0.8) / BOARD_WIDTH_IN_TILES;
const CELL_SIZE = TILE_SIZE - 2 * BORDER_WIDTH;

// Calculate max positions using the new responsive tile size
const MAX_LEFT = (BOARD_WIDTH_IN_TILES - 1) * TILE_SIZE;
const MAX_TOP = (BOARD_HEIGHT_IN_TILES - 1) * TILE_SIZE;

// Component for the movable tile, which now displays a number
const MoveableTile = ({ tilePos, number, color }) => {
  return (
    <View
      style={[
        styles.movableTile,
        { top: tilePos.top, left: tilePos.left, backgroundColor: color },
      ]}
    >
      {/* Display the number on the tile */}
      <Text style={styles.movableTileText}>{number}</Text>
    </View>
  );
};

const GroundedTile = ({ tilePos, number, color }) => {
  return (
    <View
      style={[
        styles.movableTile,
        { top: tilePos.top, left: tilePos.left, backgroundColor: color },
      ]}
    >
      {/* Display the number on the tile */}
      <Text style={styles.movableTileText}>{number}</Text>
    </View>
  );
};

export default function App() {
  const [gameboard, setGameboard] = useState([]);

  // State for the number on the movable tile
  const [movableTileNumber, setMovableTileNumber] = useState(null);

  // New state to track the background color of the movable tile
  const [movableTileColor, setMovableTileColor] = useState("#9B51E0"); // Default color is purple

  // New state to track if the game has ended (tile is grounded and 3 seconds are up)
  const [isGameEnded, setIsGameEnded] = useState(false);

  // Possible initial positions for the movable tile
  const possibleLeftPositions = [0, TILE_SIZE, 2 * TILE_SIZE, 3 * TILE_SIZE];
  const randomIndex = Math.floor(Math.random() * possibleLeftPositions.length);

  const [tilePos, setTilePos] = useState({
    top: 0,
    left: possibleLeftPositions[randomIndex],
  });
  const intervalRef = useRef(null);

  const [groundedTiles, setGroundedTiles] = useState([]);

  useEffect(() => {
    // Function to initialize the 4x6 board cells
    const initializeBoard = () => {
      let initialArr = [];
      for (let i = 0; i < BOARD_WIDTH_IN_TILES * BOARD_HEIGHT_IN_TILES; i++) {
        initialArr.push({ loc: i });
      }
      setGameboard(initialArr);
    };

    // Function to set up the number for the movable tile
    const initializeMovableTileNumber = () => {
      // Numbers for the bottom row cells (loc 20-23)
      const numbers = [20, 21, 22, 23];
      // Select a random number and set the state
      const randomNum = numbers[Math.floor(Math.random() * numbers.length)];
      setMovableTileNumber(randomNum);
    };

    initializeBoard();
    initializeMovableTileNumber();
  }, []);

  // useEffect to handle the automatic downward movement of the tile
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTilePos((currentPos) => {
        // Stop the automatic movement once the tile reaches the bottom row
        if (currentPos.top >= MAX_TOP) {
          clearInterval(intervalRef.current);
          return currentPos;
        }
        return { ...currentPos, top: currentPos.top + TILE_SIZE };
      });
    }, 3000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  // New useEffect hook to handle the final landing logic (color change and game end)
  useEffect(() => {
    let timer;
    // Check if the tile has landed at the bottom
    if (tilePos.top >= MAX_TOP) {
      // Start a 3-second timer
      timer = setTimeout(() => {
        // Calculate the 'loc' number for the tile's final position
        const row = Math.round(tilePos.top / TILE_SIZE);
        const col = Math.round(tilePos.left / TILE_SIZE);
        const loc = row * BOARD_WIDTH_IN_TILES + col;

        // Check if the final location matches the target number
        if (loc === movableTileNumber) {
          setMovableTileColor("#9B51E0"); // Correct: Purple
        } else {
          setMovableTileColor("yellow"); // Incorrect: Yellow
        }
        console.log(`The tile has landed on cell number: ${loc}`);
        // End the game after the 3-second window
        setIsGameEnded(true);

        // Add tile to grounded tiles
        setGroundedTiles((prev) => [
          ...prev,
          { tilePos, number: movableTileNumber, color: movableTileColor },
        ]);

        // Spawn a new tile
        spawnNewTile();
      }, 3000); // 3-second delay
    } else {
      // Keep the tile purple while it is moving and not at the bottom
      setMovableTileColor("#9B51E0");
      setIsGameEnded(false);
    }

    // Cleanup function to clear the timer if the component unmounts or tilePos changes
    return () => clearTimeout(timer);
  }, [tilePos, movableTileNumber]);

  const spawnNewTile = () => {
    const newRandomIndex = Math.floor(
      Math.random() * possibleLeftPositions.length
    );
    const numbers = [20, 21, 22, 23];
    let newNumber;
    do {
      newNumber = numbers[Math.floor(Math.random() * numbers.length)];
    } while (newNumber === movableTileNumber);

    setTilePos({
      top: 0,
      left: possibleLeftPositions[newRandomIndex],
    });
    setMovableTileNumber(newNumber);
    setMovableTileColor("#9B51E0");
    setIsGameEnded(false);
  };

  const moveLeft = () => {
    // Only allow movement if the game is not over
    if (isGameEnded) return;

    setTilePos((currentPos) => {
      const newLeft = currentPos.left - TILE_SIZE;
      if (newLeft >= 0) {
        return { ...currentPos, left: newLeft };
      }
      return currentPos;
    });
  };

  const moveRight = () => {
    // Only allow movement if the game is not over
    if (isGameEnded) return;

    setTilePos((currentPos) => {
      const newLeft = currentPos.left + TILE_SIZE;
      if (newLeft <= MAX_LEFT) {
        return { ...currentPos, left: newLeft };
      }
      return currentPos;
    });
  };

  const moveDown = () => {
    // Only allow movement if the game is not over
    if (isGameEnded) return;

    setTilePos((currentPos) => {
      const newTop = currentPos.top + TILE_SIZE;
      if (newTop <= MAX_TOP) {
        return { ...currentPos, top: newTop };
      } else if (currentPos.top >= MAX_TOP) {
        // Consider as grounded if already at bottom row
        setIsGameEnded(true);
        const row = Math.round(currentPos.top / TILE_SIZE);
        const col = Math.round(currentPos.left / TILE_SIZE);
        const loc = row * BOARD_WIDTH_IN_TILES + col;
        if (loc === movableTileNumber) {
          setMovableTileColor("#9B51E0"); // Correct: Purple
        } else {
          setMovableTileColor("yellow"); // Incorrect: Yellow
        }
        console.log(`The tile has landed on cell number: ${loc}`);

        // Add tile to grounded tiles
        setGroundedTiles((prev) => [
          ...prev,
          {
            tilePos: currentPos,
            number: movableTileNumber,
            color: movableTileColor,
          },
        ]);

        return currentPos;
      }
      return currentPos;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.board}>
        {gameboard.map((el, index) => (
          <View key={index} style={styles.cellOuter}>
            <View style={styles.cellInner}>
              <Text>{el.loc}</Text>
            </View>
          </View>
        ))}
        {/* Render grounded tiles */}
        {groundedTiles.map((tile, index) => (
          <GroundedTile
            key={`grounded-${index}`}
            tilePos={tile.tilePos}
            number={tile.number}
            color={tile.color}
          />
        ))}
        {/* Pass the movableTileNumber and the current color to the MoveableTile component */}
        {movableTileNumber !== null && (
          <MoveableTile
            tilePos={tilePos}
            number={movableTileNumber}
            color={movableTileColor}
          />
        )}
      </View>
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButtonTouchable}
          onPress={moveLeft}
          disabled={isGameEnded}
        >
          <Text style={styles.controlButtonText}>Left</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButtonTouchable}
          onPress={moveDown}
          disabled={isGameEnded}
        >
          <Text style={styles.controlButtonText}>Down</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButtonTouchable}
          onPress={moveRight}
          disabled={isGameEnded}
        >
          <Text style={styles.controlButtonText}>Right</Text>
        </TouchableOpacity>
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
    flexDirection: "row",
    flexWrap: "wrap",
    width: BOARD_WIDTH_IN_TILES * TILE_SIZE,
    height: BOARD_HEIGHT_IN_TILES * TILE_SIZE,
    backgroundColor: "#fff",
    position: "relative",
  },
  cellOuter: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: "black",
    padding: BORDER_WIDTH,
  },
  cellInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 20,
  },
  controlButtonTouchable: {
    backgroundColor: "#2196F3",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  controlButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  // New style for the movable tile
  movableTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    position: "absolute",
    // We removed the fixed background color here so it can be set dynamically
    justifyContent: "center",
    alignItems: "center",
  },
  // New style for the text inside the movable tile
  movableTileText: {
    color: "white",
    fontSize: TILE_SIZE / 3, // Make the text size relative to the tile size
    fontWeight: "bold",
  },
});
