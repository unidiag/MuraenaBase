import { alpha, createTheme } from "@mui/material/styles";

const PRIMARY = "#48d7c5";
const PRIMARY_BRIGHT = "#78f3e3";
const SECONDARY = "#6ca8ff";

const Palette = () => {
  return createTheme({
    palette: {
      mode: "dark",

      common: {
        black: "#000000",
        white: "#ffffff",
      },

      primary: {
        lighter: alpha(PRIMARY, 0.1),
        light: PRIMARY_BRIGHT,
        main: PRIMARY,
        dark: "#2cb6a7",
        contrastText: "#041312",
      },

      secondary: {
        lighter: alpha(SECONDARY, 0.1),
        light: "#91c0ff",
        main: SECONDARY,
        dark: "#4689e8",
        contrastText: "#071019",
      },

      error: {
        lighter: alpha("#ff6b7a", 0.1),
        light: "#ff929d",
        main: "#ff6b7a",
        dark: "#d94c5a",
        contrastText: "#ffffff",
      },

      warning: {
        lighter: alpha("#f5b942", 0.1),
        light: "#ffd174",
        main: "#f5b942",
        dark: "#c98d21",
        contrastText: "#071019",
      },

      info: {
        lighter: alpha(SECONDARY, 0.1),
        light: "#91c0ff",
        main: SECONDARY,
        dark: "#4689e8",
        contrastText: "#071019",
      },

      success: {
        lighter: alpha(PRIMARY, 0.1),
        light: PRIMARY_BRIGHT,
        main: PRIMARY,
        dark: "#2cb6a7",
        contrastText: "#041312",
      },

      text: {
        primary: "#eef7ff",
        secondary: "#91a7b8",
        disabled: alpha("#91a7b8", 0.45),
      },

      background: {
        default: "#071019",
        paper: "#101e2b",
      },

      divider: alpha("#8db5d2", 0.16),

      action: {
        active: "#eef7ff",
        hover: alpha("#ffffff", 0.055),
        selected: alpha(PRIMARY, 0.1),
        disabled: alpha("#91a7b8", 0.35),
        disabledBackground: alpha("#91a7b8", 0.08),
        focus: alpha(PRIMARY, 0.14),
      },

      grey: {
        0: "#ffffff",
        50: "#eef7ff",
        100: "#d5e3ed",
        200: "#b7c9d6",
        300: "#91a7b8",
        400: "#6c8293",
        500: "#52697b",
        600: "#385064",
        700: "#243b4e",
        800: "#162a3b",
        900: "#101e2b",
        A50: "#0a1520",
        A100: "#101e2b",
        A200: "#162a3b",
        A400: "#071019",
        A700: "#91a7b8",
      },
    },
  });
};

export default Palette;