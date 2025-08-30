// src/components/Flash.js
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { TILE_SIZE } from "../constants/gameConfig";

/**
 * Flash fill effect:
 * - Starts as a 0-height bar at the bottom of the tile, full width.
 * - Grows upward to full height.
 * - Then quickly fades out.
 * - Repeats `repeats` times (default 1).
 *
 * Props:
 *  - top, left: pixel position of the tile (use gridToPixel(row,col))
 *  - color: fill color (e.g., "yellow", "red", "orange")
 *  - duration: grow duration in ms (default 180)
 *  - repeats: number of cycles (default 1)
 *  - onDone: callback when all repeats complete
 */
const Flash = ({
  top = 0,
  left = 0,
  color = "green",
  duration = 50,
  repeats = 1,
  onDone,
}) => {
  const heightAnim = useRef(new Animated.Value(0)).current; // 0 -> TILE_SIZE
  const opacityAnim = useRef(new Animated.Value(0)).current; // 0.9 -> 0

  useEffect(() => {
    const oneCycle = Animated.sequence([
      // Start state: height 0, opacity ~0.9
      Animated.timing(opacityAnim, {
        toValue: 0.9,
        duration: 1,
        useNativeDriver: false,
      }),
      Animated.timing(heightAnim, {
        toValue: TILE_SIZE,
        duration,
        useNativeDriver: false,
      }),
      // Fade out quickly
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: Math.max(80, Math.floor(duration * 0.45)),
        useNativeDriver: false,
      }),
      // Reset for next repeat
      Animated.timing(heightAnim, {
        toValue: 0,
        duration: 1,
        useNativeDriver: false,
      }),
    ]);

    // Repeat the cycle N times
    const full = Animated.sequence(
      Array.from({ length: Math.max(1, repeats) }, () => oneCycle)
    );

    full.start(({ finished }) => {
      if (finished && typeof onDone === "function") onDone();
    });

    return () => {
      heightAnim.stopAnimation();
      opacityAnim.stopAnimation();
    };
  }, [duration, repeats, onDone, heightAnim, opacityAnim]);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        { top, left, width: TILE_SIZE, height: TILE_SIZE },
      ]}
    >
      {/* We anchor the fill to the bottom via absolute positioning + bottom: 0 */}
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: color,
            height: heightAnim,
            opacity: opacityAnim,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    bottom: 0, // grow upward from the bottom
    left: 0,
    right: 0,
    borderRadius: 2, // subtle rounding (optional)
  },
});

export default Flash;
