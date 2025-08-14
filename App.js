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

  const allTargetNumbers = useRef(
    [...Array(23 - 8 + 1).keys()]
      .map((i) => i + 8)
      .sort(() => Math.random() - 0.5)
  );
  const numberIndex = useRef(0);

  const isAboveGroundedTile = (tilePos, groundedTiles) => {
    const row = Math.round(tilePos.top / TILE_SIZE);
    const col = Math.round(tilePos.left / TILE_SIZE);
    const belowRow = row + 1;
    const belowPos = { top: belowRow * TILE_SIZE, left: col * TILE_SIZE };
    return groundedTiles.some(
      (tile) =>
        tile.tilePos.top === belowPos.top && tile.tilePos.left === belowPos.left
    );
  };

  const canSpawnTile = (number) => {
    const row = Math.floor(number / BOARD_WIDTH_IN_TILES);
    const col = number % BOARD_WIDTH_IN_TILES;

    // Check if there's a grounded tile below this number's position
    const belowRow = row + 1;
    if (belowRow < BOARD_HEIGHT_IN_TILES) {
      const belowPos = { top: belowRow * TILE_SIZE, left: col * TILE_SIZE };
      const hasGroundedBelow = groundedTiles.some(
        (tile) =>
          tile.tilePos.top === belowPos.top &&
          tile.tilePos.left === belowPos.left
      );
      if (hasGroundedBelow) return true;
    }

    // Or if it's in the bottom row
    return row === BOARD_HEIGHT_IN_TILES - 1;
  };

  useEffect(() => {
    const initializeBoard = () => {
      let initialArr = [];
      for (let i = 0; i < BOARD_WIDTH_IN_TILES * BOARD_HEIGHT_IN_TILES; i++) {
        initialArr.push({ loc: i });
      }
      setGameboard(initialArr);

      // Pick a random number between 8 and 23
      const randomNumber = Math.floor(Math.random() * (23 - 8 + 1)) + 8;

      // Add a random grounded tile with the random number at the position corresponding to the number
      const row = Math.floor(randomNumber / BOARD_WIDTH_IN_TILES);
      const col = randomNumber % BOARD_WIDTH_IN_TILES;
      const randomTilePos = {
        top: row * TILE_SIZE,
        left: col * TILE_SIZE,
      };
      setGroundedTiles((prev) => [
        ...prev,
        { tilePos: randomTilePos, number: randomNumber, color: "yellow" },
      ]);

      // Remove the random number from targetNumbers arrays if present
      [allTargetNumbers.current].forEach((arr) => {
        const index = arr.indexOf(randomNumber);
        if (index !== -1) {
          arr.splice(index, 1);
        }
      });
    };

    const initializeMovableTileNumber = () => {
      let newNumber;
      do {
        newNumber = allTargetNumbers.current[numberIndex.current];
        numberIndex.current += 1;
        if (numberIndex.current >= allTargetNumbers.current.length) {
          console.log("All numbers used up.");
          break;
        }
      } while (!canSpawnTile(newNumber));
      if (canSpawnTile(newNumber)) {
        setMovableTileNumber(newNumber);
      }
    };

    initializeBoard();
    initializeMovableTileNumber();
  }, []);

  // useEffect to handle the automatic downward movement of the tile
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTilePos((currentPos) => {
        if (
          currentPos.top >= MAX_TOP ||
          isAboveGroundedTile(currentPos, groundedTiles)
        ) {
          clearInterval(intervalRef.current);
          return currentPos;
        }
        return { ...currentPos, top: currentPos.top + TILE_SIZE };
      });
    }, 3000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [movableTileNumber, groundedTiles]);

  // New useEffect hook to handle the final landing logic (color change and game end)
  useEffect(() => {
    let timer;
    if (tilePos.top >= MAX_TOP || isAboveGroundedTile(tilePos, groundedTiles)) {
      timer = setTimeout(() => {
        const row = Math.round(tilePos.top / TILE_SIZE);
        const col = Math.round(tilePos.left / TILE_SIZE);
        const loc = row * BOARD_WIDTH_IN_TILES + col;

        const tileColor = loc === movableTileNumber ? "#9B51E0" : "yellow";
        let finalTilePos = tilePos;
        if (loc !== movableTileNumber) {
          const targetRow = Math.floor(
            movableTileNumber / BOARD_WIDTH_IN_TILES
          );
          const targetCol = movableTileNumber % BOARD_WIDTH_IN_TILES;
          finalTilePos = {
            top: targetRow * TILE_SIZE,
            left: targetCol * TILE_SIZE,
          };
        }

        console.log(`The tile has landed on cell number: ${loc}`);
        setIsGameEnded(true);

        setGroundedTiles((prev) => [
          ...prev,
          {
            tilePos: finalTilePos,
            number: movableTileNumber,
            color: tileColor,
          },
        ]);

        numberIndex.current += 1;
        if (numberIndex.current >= allTargetNumbers.current.length) {
          console.log("All numbers used up.");
        } else {
          spawnNewTile();
        }
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [tilePos, movableTileNumber, groundedTiles]);

  const spawnNewTile = () => {
    let newNumber;
    do {
      newNumber = allTargetNumbers.current[numberIndex.current];
      numberIndex.current += 1;
      if (numberIndex.current >= allTargetNumbers.current.length) {
        console.log("All numbers used up.");
        break;
      }
    } while (!canSpawnTile(newNumber));

    if (canSpawnTile(newNumber)) {
      const newRandomIndex = Math.floor(
        Math.random() * possibleLeftPositions.length
      );

      setTilePos({
        top: 0,
        left: possibleLeftPositions[newRandomIndex],
      });
      setMovableTileNumber(newNumber);
      setMovableTileColor("#9B51E0");
      setIsGameEnded(false);
    }
  };

  const moveLeft = () => {
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
    if (isGameEnded) return;

    setTilePos((currentPos) => {
      const newTop = currentPos.top + TILE_SIZE;
      if (newTop <= MAX_TOP) {
        const row = Math.round(newTop / TILE_SIZE);
        const col = Math.round(currentPos.left / TILE_SIZE);
        const belowPos = { top: row * TILE_SIZE, left: col * TILE_SIZE };
        const wouldMoveOntoGrounded = groundedTiles.some(
          (tile) =>
            tile.tilePos.top === belowPos.top &&
            tile.tilePos.left === belowPos.left
        );
        if (wouldMoveOntoGrounded) {
          return currentPos;
        }
        return { ...currentPos, top: newTop };
      } else if (currentPos.top >= MAX_TOP) {
        setIsGameEnded(true);
        const row = Math.round(currentPos.top / TILE_SIZE);
        const col = Math.round(currentPos.left / TILE_SIZE);
        const loc = row * BOARD_WIDTH_IN_TILES + col;
        const tileColor = loc === movableTileNumber ? "#9B51E0" : "yellow";
        let finalTilePos = currentPos;
        if (loc !== movableTileNumber) {
          const targetRow = Math.floor(
            movableTileNumber / BOARD_WIDTH_IN_TILES
          );
          const targetCol = movableTileNumber % BOARD_WIDTH_IN_TILES;
          finalTilePos = {
            top: targetRow * TILE_SIZE,
            left: targetCol * TILE_SIZE,
          };
        }

        console.log(`The tile has landed on cell number: ${loc}`);

        setGroundedTiles((prev) => [
          ...prev,
          {
            tilePos: finalTilePos,
            number: movableTileNumber,
            color: tileColor,
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
        {groundedTiles.map((tile, index) => (
          <GroundedTile
            key={`grounded-${index}`}
            tilePos={tile.tilePos}
            number={tile.number}
            color={tile.color}
          />
        ))}
        {movableTileNumber !== null && !isGameEnded && (
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
  movableTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  movableTileText: {
    color: "white",
    fontSize: TILE_SIZE / 3,
    fontWeight: "bold",
  },
});
