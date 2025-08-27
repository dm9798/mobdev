// Centralized game config (replace utils/constants.js with this)
import { Dimensions } from "react-native";
const { width } = Dimensions.get("window");

// --- Board geometry ---
export const BOARD_WIDTH = 4;
export const BOARD_HEIGHT = 6;
export const BORDER_WIDTH = 1;

// Snap to whole pixels for crisp rendering
export const TILE_SIZE = Math.round((width * 0.8) / BOARD_WIDTH);
export const IMAGE_SIZE = TILE_SIZE * 4; // the 4x4 target area

// Valid target positions: rows 2..5 (indexes 8..23 inclusive)
export const VALID_POSITIONS = Array.from(
  { length: BOARD_WIDTH * BOARD_HEIGHT },
  (_, i) => i
).filter((i) => i >= 8 && i <= 23);

// --- Image puzzle URIs ---
// export const PUZZLE_IMAGE_URI =
//   "https://bellahomeco.com.au/cdn/shop/products/9_6d329c09-13b8-4e04-a1ed-b40b01f0d054.jpg";

// export const PUZZLE_IMAGE_URI_GRAYSCALE =
//   "https://i.imghippo.com/files/k1057el.jpg";
export const PUZZLE_IMAGE_URI = "https://i.imghippo.com/files/QIm7492PvA.jpg";

export const PUZZLE_IMAGE_URI_GRAYSCALE =
  "https://i.imghippo.com/files/lGDK7647LHc.jpg";
// export const PUZZLE_IMAGE_URI = "https://i.imghippo.com/files/dwo2733Cs.jpg";

// export const PUZZLE_IMAGE_URI_GRAYSCALE =
//   "https://i.imghippo.com/files/eRJu5089.jpg";

// Toggle grayscale background of the 4x4 area
export const USE_GRAYSCALE_BG = true;
