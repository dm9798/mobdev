// src/components/Flash.js
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import { TILE_SIZE } from "../constants/gameConfig";

export default function Flash({
  top,
  left,
  color = "yellow",
  mode = "pulse", // "pulse" | "blink"
  repeats = 10,
  duration = 2000,
  borderWidth = 3,
  onDone,
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let anim;
    if (mode === "blink") {
      anim = Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ]);
    } else {
      const one = Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ]);
      anim = Animated.sequence(Array.from({ length: repeats }, () => one));
    }

    anim.start(() => {
      onDone?.();
    });

    return () => anim.stop?.();
  }, [mode, repeats, duration, onDone, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.flash,
        {
          top,
          left,
          opacity,
          borderColor: color,
          borderWidth,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  flash: {
    position: "absolute",
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 2,
  },
});
