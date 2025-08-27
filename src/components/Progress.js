import React from "react";
import { Text } from "react-native";

export const Progress = ({ tilesLeft }) => (
  <Text style={{ marginTop: 10, color: "white" }}>Tiles Left: {tilesLeft}</Text>
);
