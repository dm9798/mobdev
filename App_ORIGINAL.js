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

  const [tilePos, setTilePos] = useState({
    top: 0,
    left: possibleLeftPositions[0],
  });
  const intervalRef = useRef(null);
  const isMovingDown = useRef(false);

  const [groundedTiles, setGroundedTiles] = useState([]);

  const allTargetNumbers = useRef(
    Array.from(
      { length: BOARD_HEIGHT_IN_TILES * BOARD_WIDTH_IN_TILES },
      (_, i) => i
    ).filter((i) => i >= 8 && i <= 23)
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

  const isPathClear = (targetNumber, groundedTiles, tilePos) => {
    const targetRow = Math.floor(targetNumber / BOARD_WIDTH_IN_TILES);
    const targetCol = targetNumber % BOARD_WIDTH_IN_TILES;
    const currentRow = Math.round(tilePos.top / TILE_SIZE);
    const currentCol = Math.round(tilePos.left / TILE_SIZE);

    // Check if the path is clear horizontally
    if (targetRow === currentRow) {
      const startCol = Math.min(targetCol, currentCol);
      const endCol = Math.max(targetCol, currentCol);
      for (let col = startCol + 1; col < endCol; col++) {
        const pos = targetRow * BOARD_WIDTH_IN_TILES + col;
        if (groundedTiles.some((tile) => tile.number === pos)) {
          return false;
        }
      }
    }

    // Check if the path is clear vertically
    if (targetCol === currentCol) {
      const startRow = Math.min(targetRow, currentRow);
      const endRow = Math.max(targetRow, currentRow);
      for (let row = startRow + 1; row < endRow; row++) {
        const pos = row * BOARD_WIDTH_IN_TILES + targetCol;
        if (groundedTiles.some((tile) => tile.number === pos)) {
          return false;
        }
      }
    }

    return true;
  };

  const canSpawnTile = (number) => {
    const row = Math.floor(number / BOARD_WIDTH_IN_TILES);
    const col = number % BOARD_WIDTH_IN_TILES;

    // Check if there's a grounded tile below this number's position
    const belowRow = row + 1;
    if (belowRow < BOARD_HEIGHT_IN_TILES) {
      const hasGroundedBelow = groundedTiles.some(
        (tile) =>
          tile.tilePos.top === belowRow * TILE_SIZE &&
          tile.tilePos.left === col * TILE_SIZE
      );
      if (hasGroundedBelow) return true;
    }

    // Or if it's in the bottom row
    return row === BOARD_HEIGHT_IN_TILES - 1;
  };

  const unwantedCombinationsDuringGame = [
    {
      combination: [16, 21],
      requiredPositions: [20],
    },
    {
      combination: [19, 22],
      requiredPositions: [23],
    },
    {
      combination: [12, 17, 22],
      requiredPositions: [16, 20, 21],
    },
    {
      combination: [15, 18, 21],
      requiredPositions: [19, 22, 23],
    },
    {
      combination: [8, 13],
      requiredPositions: [12],
    },
    {
      combination: [11, 14],
      requiredPositions: [15],
    },
    {
      combination: [15, 18],
      requiredPositions: [19],
    },
    {
      combination: [12, 17],
      requiredPositions: [16],
    },
    {
      combination: [18, 19, 21],
      requiredPositions: [22, 23],
    },
    {
      combination: [12, 17, 21],
      requiredPositions: [16, 20],
    },
    {
      combination: [16, 17, 22],
      requiredPositions: [20, 21],
    },
    {
      combination: [14, 17, 19],
      requiredPositions: [18],
    },
    {
      combination: [10, 13, 15],
      requiredPositions: [14],
    },
    {
      combination: [9, 12, 14],
      requiredPositions: [13],
    },
    {
      combination: [15, 18, 22],
      requiredPositions: [19, 23],
    },
    {
      combination: [13, 16, 18],
      requiredPositions: [17],
    },
    {
      combination: [18, 21, 23],
      requiredPositions: [22],
    },
    {
      combination: [17, 20, 22],
      requiredPositions: [21],
    },
    {
      combination: [8, 13, 18],
      requiredPositions: [12, 16, 17],
    },
    {
      combination: [11, 14, 17],
      requiredPositions: [15, 18, 19],
    },
    {
      combination: [9, 12, 14],
      requiredPositions: [13],
    },
    {
      combination: [11, 14, 18],
      requiredPositions: [15, 19],
    },
    {
      combination: [8, 13, 17],
      requiredPositions: [12, 16],
    },
    {
      combination: [11, 14, 17],
      requiredPositions: [15, 18, 19],
    },
    {
      combination: [8, 13, 17, 20],
      requiredPositions: [12, 16],
    },
    {
      combination: [8, 13, 17, 21],
      requiredPositions: [12, 16, 20],
    },
    {
      combination: [8, 13, 17, 22],
      requiredPositions: [12, 16, 20, 21],
    },
    {
      combination: [8, 13, 18, 21],
      requiredPositions: [12, 16, 17, 20],
    },
    {
      combination: [8, 13, 18, 22],
      requiredPositions: [12, 16, 17, 20, 21],
    },
    {
      combination: [8, 13, 18, 23],
      requiredPositions: [12, 16, 17, 20, 21, 22],
    },
    {
      combination: [14, 15, 17, 21],
      requiredPositions: [18, 19, 22, 23],
    },
    {
      combination: [12, 13, 18, 22],
      requiredPositions: [16, 17, 20, 21],
    },
  ];

  const isValidPosition = (groundedTiles, targetNumber) => {
    const newGroundedTiles = [...groundedTiles, { number: targetNumber }];
    for (const uc of unwantedCombinationsDuringGame) {
      if (
        uc.combination.every((num) =>
          newGroundedTiles.some((tile) => tile.number === num)
        )
      ) {
        if (
          !uc.requiredPositions.every((pos) =>
            newGroundedTiles.some((tile) => tile.number === pos)
          )
        ) {
          return false;
        }
      }
    }
    return true;
  };

  const spawnNewTile = () => {
    if (allTargetNumbers.current.length === 0) {
      console.log("Board is completed!");
      return;
    }
    if (allTargetNumbers.current.length > 0) {
      const groundedTileNumbers = groundedTiles.map((tile) => tile.number);
      const availableNumbers = allTargetNumbers.current.filter(
        (number) => !groundedTiles.some((tile) => tile.number === number)
      );

      console.log("Available numbers:", availableNumbers);

      const spawnableNumbers = availableNumbers.filter((number) =>
        canSpawnTile(number)
      );

      console.log("Spawnable numbers:", spawnableNumbers);

      const validSpawnableNumbers = spawnableNumbers.filter((number) => {
        return (
          isPathClear(number, groundedTiles, { top: 0, left: 0 }) &&
          isValidPosition(groundedTiles, number)
        );
      });

      console.log("Valid spawnable numbers:", validSpawnableNumbers);

      if (validSpawnableNumbers.length === 0) {
        // If no valid spawnable numbers, try to add a new grounded tile that doesn't block any movable tiles
        const newGroundedTile = getNewGroundedTile();
        if (newGroundedTile) {
          setGroundedTiles([...groundedTiles, newGroundedTile]);
          const index = allTargetNumbers.current.indexOf(
            newGroundedTile.number
          );
          if (index !== -1) {
            allTargetNumbers.current.splice(index, 1);
          }
          spawnNewTile();
        } else {
          console.log("No valid grounded tile can be added.");
        }
        return;
      }

      const newNumber =
        validSpawnableNumbers[
          Math.floor(Math.random() * validSpawnableNumbers.length)
        ];
      setMovableTileNumber(newNumber);
      setMovableTileColor("#9B51E0");
      setIsGameEnded(false);
      const index = allTargetNumbers.current.indexOf(newNumber);
      if (index !== -1) {
        allTargetNumbers.current.splice(index, 1);
      }
    } else {
      console.log("All numbers used up.");
    }
  };

  const getNewGroundedTile = () => {
    const availableCells = [];
    for (let i = 8; i < BOARD_HEIGHT_IN_TILES * BOARD_WIDTH_IN_TILES; i++) {
      if (!groundedTiles.some((tile) => tile.number === i)) {
        availableCells.push(i);
      }
    }

    for (const cell of availableCells) {
      const row = Math.floor(cell / BOARD_WIDTH_IN_TILES);
      const col = cell % BOARD_WIDTH_IN_TILES;
      const tilePos = {
        top: row * TILE_SIZE,
        left: col * TILE_SIZE,
      };
      const newGroundedTile = { tilePos, number: cell, color: "yellow" };
      const allGroundedTiles = [...groundedTiles, newGroundedTile];
      const spawnableNumbers = allTargetNumbers.current.filter((number) =>
        canSpawnTile(number)
      );

      let isValid = true;
      for (const targetNumber of spawnableNumbers) {
        if (
          !isPathClear(targetNumber, allGroundedTiles, {
            top: 0,
            left: possibleLeftPositions[0],
          })
        ) {
          isValid = false;
          break;
        }
      }

      if (isValid) {
        return newGroundedTile;
      }
    }

    return null;
  };

  useEffect(() => {
    const initializeBoard = () => {
      let initialArr = [];
      for (let i = 0; i < BOARD_WIDTH_IN_TILES * BOARD_HEIGHT_IN_TILES; i++) {
        initialArr.push({ loc: i });
      }
      setGameboard(initialArr);
    };

    const initializeMovableTileNumber = () => {
      //normal
      const unwantedCombinations = [
        [16, 21],
        [19, 22],
        [12, 17, 22],
        [15, 18, 21],
        [8, 13],
        [11, 14],
        [15, 18],
        [12, 17],
        [18, 19, 21],
        [12, 17, 21],
        [16, 17, 22],
        [14, 17, 19],
        [10, 13, 15],
        [9, 12, 14],
        [15, 18, 22],
        [13, 16, 18],
        [18, 21, 23],
        [17, 20, 22],
      ];

      const isUnwantedCombination = (groundedTiles) => {
        const tileNumbers = groundedTiles
          .map((tile) => tile.number)
          .sort((a, b) => a - b);
        return unwantedCombinations.some((combination) => {
          return combination.every((number) => tileNumbers.includes(number));
        });
      };

      const generateGroundedTiles = (numTiles) => {
        let groundedTiles;
        do {
          groundedTiles = [];
          const numbers = [];
          for (let i = 0; i < numTiles; i++) {
            let randomCell;
            do {
              randomCell =
                Math.floor(
                  Math.random() *
                    (BOARD_HEIGHT_IN_TILES * BOARD_WIDTH_IN_TILES - 8)
                ) + 8;
            } while (numbers.includes(randomCell));
            numbers.push(randomCell);
            const row = Math.floor(randomCell / BOARD_WIDTH_IN_TILES);
            const col = randomCell % BOARD_WIDTH_IN_TILES;
            const tilePos = {
              top: row * TILE_SIZE,
              left: col * TILE_SIZE,
            };
            groundedTiles.push({
              tilePos,
              number: randomCell,
              color: "yellow",
            });
          }
        } while (isUnwantedCombination(groundedTiles));
        return groundedTiles;
      };

      const groundedTilesInit = generateGroundedTiles(3);
      if (groundedTilesInit) {
        const groundedTilesWithPositions = groundedTilesInit.map((tile) => {
          const row = Math.floor(tile.number / BOARD_WIDTH_IN_TILES);
          const col = tile.number % BOARD_WIDTH_IN_TILES;
          const tilePos = {
            top: row * TILE_SIZE,
            left: col * TILE_SIZE,
          };
          return { tilePos, number: tile.number, color: "yellow" };
        });
        setGroundedTiles(groundedTilesWithPositions);
        numberIndex.current = 0;
        if (allTargetNumbers.current.length > 0) {
          spawnNewTile();
        } else {
          console.log("Board is completed!");
        }
      } else {
        console.log("Failed to generate grounded tiles.");
      }
    };

    initializeBoard();
    initializeMovableTileNumber();
  }, []);

  useEffect(() => {
    if (
      groundedTiles.length > 0 &&
      movableTileNumber !== null &&
      allTargetNumbers.current.length > 0
    ) {
      const lastGroundedTile = groundedTiles[groundedTiles.length - 1];
      if (lastGroundedTile.number === movableTileNumber) {
        const newRandomIndex = Math.floor(
          Math.random() * possibleLeftPositions.length
        );
        setTilePos({
          top: 0,
          left: possibleLeftPositions[newRandomIndex],
        });
        if (allTargetNumbers.current.length > 0) {
          spawnNewTile();
        }
      }
    }
  }, [groundedTiles, movableTileNumber]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (movableTileNumber !== null) {
        setTilePos((currentPos) => {
          if (
            currentPos.top >= MAX_TOP ||
            isAboveGroundedTile(currentPos, groundedTiles)
          ) {
            clearInterval(intervalRef.current);
            const targetRow = Math.floor(
              movableTileNumber / BOARD_WIDTH_IN_TILES
            );
            const targetCol = movableTileNumber % BOARD_WIDTH_IN_TILES;
            setGroundedTiles((prev) => [
              ...prev,
              {
                tilePos: {
                  top: targetRow * TILE_SIZE,
                  left: targetCol * TILE_SIZE,
                },
                number: movableTileNumber,
                color: "#9B51E0",
              },
            ]);
            const index = allTargetNumbers.current.indexOf(movableTileNumber);
            if (index !== -1) {
              allTargetNumbers.current.splice(index, 1);
            }
            return currentPos;
          }
          return { ...currentPos, top: currentPos.top + TILE_SIZE };
        });
      }
    }, 3000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [movableTileNumber, groundedTiles]);

  const moveLeft = () => {
    if (isGameEnded) return;

    setTilePos((currentPos) => {
      const newLeft = currentPos.left - TILE_SIZE;
      if (newLeft >= 0) {
        const wouldMoveOntoGrounded = groundedTiles.some(
          (tile) =>
            tile.tilePos.top === currentPos.top && tile.tilePos.left === newLeft
        );
        if (!wouldMoveOntoGrounded) {
          return { ...currentPos, left: newLeft };
        }
      }
      return currentPos;
    });
  };

  const moveRight = () => {
    if (isGameEnded) return;

    setTilePos((currentPos) => {
      const newLeft = currentPos.left + TILE_SIZE;
      if (newLeft <= MAX_LEFT) {
        const wouldMoveOntoGrounded = groundedTiles.some(
          (tile) =>
            tile.tilePos.top === currentPos.top && tile.tilePos.left === newLeft
        );
        if (!wouldMoveOntoGrounded) {
          return { ...currentPos, left: newLeft };
        }
      }
      return currentPos;
    });
  };

  const moveDown = () => {
    if (isGameEnded || isMovingDown.current) return;

    isMovingDown.current = true;
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
          clearInterval(intervalRef.current);
          const targetRow = Math.floor(
            movableTileNumber / BOARD_WIDTH_IN_TILES
          );
          const targetCol = movableTileNumber % BOARD_WIDTH_IN_TILES;
          setGroundedTiles((prev) => [
            ...prev,
            {
              tilePos: {
                top: targetRow * TILE_SIZE,
                left: targetCol * TILE_SIZE,
              },
              number: movableTileNumber,
              color: "#9B51E0",
            },
          ]);
          const index = allTargetNumbers.current.indexOf(movableTileNumber);
          if (index !== -1) {
            allTargetNumbers.current.splice(index, 1);
          }
          isMovingDown.current = false;
          return currentPos;
        }
        isMovingDown.current = false;
        return { ...currentPos, top: newTop };
      } else {
        clearInterval(intervalRef.current);
        const targetRow = Math.floor(movableTileNumber / BOARD_WIDTH_IN_TILES);
        const targetCol = movableTileNumber % BOARD_WIDTH_IN_TILES;
        setGroundedTiles((prev) => [
          ...prev,
          {
            tilePos: {
              top: targetRow * TILE_SIZE,
              left: targetCol * TILE_SIZE,
            },
            number: movableTileNumber,
            color: "#9B51E0",
          },
        ]);
        const index = allTargetNumbers.current.indexOf(movableTileNumber);
        if (index !== -1) {
          allTargetNumbers.current.splice(index, 1);
        }
        isMovingDown.current = false;
        return currentPos;
      }
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
