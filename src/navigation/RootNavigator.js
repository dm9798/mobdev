// src/navigation/RootNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MainMenuScreen from "../screens/MainMenuScreen";
import LevelSelectScreen from "../screens/LevelSelectScreen";
import GameScreen from "../screens/GameScreen";
import GameOverScreen from "../screens/GameOverScreen";
import PauseModal from "../screens/PauseModal";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="MainMenu">
      <Stack.Screen
        name="MainMenu"
        component={MainMenuScreen}
        options={{ title: "Numzle" }}
      />
      <Stack.Screen
        name="LevelSelect"
        component={LevelSelectScreen}
        options={{ title: "Select Level" }}
      />
      <Stack.Screen
        name="Game"
        component={GameScreen}
        options={{ headerShown: false }} // full-screen gameplay
      />
      <Stack.Screen
        name="GameOver"
        component={GameOverScreen}
        options={{ title: "Puzzle Complete" }}
      />

      {/* Modal group for overlays like Pause */}
      <Stack.Group screenOptions={{ presentation: "transparentModal" }}>
        <Stack.Screen
          name="Pause"
          component={PauseModal}
          options={{ headerShown: false }}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
}
