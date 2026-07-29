import PropTypes from "prop-types";
import { useMemo } from "react";

import {
  CssBaseline,
  StyledEngineProvider,
} from "@mui/material";
import {
  alpha,
  createTheme,
  ThemeProvider,
} from "@mui/material/styles";

import useConfig from "utils/useConfig";
import Palette from "./palette";
import Typography from "./typography";
import CustomShadows from "./shadows";
import componentsOverride from "./overrides";

export default function ThemeCustomization({ children }) {
  const {
    themeDirection,
    fontFamily,
  } = useConfig();

  const theme = useMemo(
    () => Palette(),
    []
  );

  const themeTypography = useMemo(
    () => Typography(fontFamily, 14),
    [fontFamily]
  );

  const themeCustomShadows = useMemo(
    () => CustomShadows(theme),
    [theme]
  );

  const themeOptions = useMemo(
    () => ({
      breakpoints: {
        values: {
          xs: 0,
          sm: 768,
          md: 1024,
          lg: 1266,
          xl: 1440,
        },
      },

      direction: themeDirection,

      shape: {
        borderRadius: 13,
      },

      mixins: {
        toolbar: {
          minHeight: 60,
          paddingTop: 8,
          paddingBottom: 8,
        },
      },

      palette: theme.palette,
      customShadows: themeCustomShadows,
      typography: themeTypography,
    }),
    [
      themeDirection,
      theme,
      themeTypography,
      themeCustomShadows,
    ]
  );

  const baseTheme = createTheme(themeOptions);

  const componentOverrides =
    componentsOverride(baseTheme);

  const themes = createTheme(baseTheme, {
    components: {
      ...componentOverrides,

      MuiCssBaseline: {
        styleOverrides: {
          ":root": {
            colorScheme: "dark",
          },

          "*": {
            boxSizing: "border-box",
          },

          html: {
            minWidth: 320,
            minHeight: "100%",
            backgroundColor: "#071019",
          },

          body: {
            minWidth: 320,
            minHeight: "100%",
            margin: 0,
            color: "#eef7ff",
            backgroundColor: "#071019",
            backgroundImage: `
              radial-gradient(
                circle at 15% 12%,
                rgba(72, 215, 197, 0.10),
                transparent 28%
              ),
              radial-gradient(
                circle at 85% 28%,
                rgba(108, 168, 255, 0.09),
                transparent 28%
              ),
              linear-gradient(
                180deg,
                #071019 0%,
                #08131d 48%,
                #071019 100%
              )
            `,
            backgroundAttachment: "fixed",
            WebkitFontSmoothing: "antialiased",
          },

          "#root": {
            minHeight: "100dvh",
          },

          a: {
            color: "inherit",
            textDecoration: "none",
          },

          "::selection": {
            color: "#041312",
            backgroundColor: "#48d7c5",
          },

          "::-webkit-scrollbar": {
            width: 10,
            height: 10,
          },

          "::-webkit-scrollbar-track": {
            backgroundColor: "#071019",
          },

          "::-webkit-scrollbar-thumb": {
            border: "2px solid #071019",
            borderRadius: 8,
            backgroundColor: "#385064",
          },

          "::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#52697b",
          },
        },
      },

      MuiAppBar: {
        styleOverrides: {
          root: {
            color: "#eef7ff",
            borderBottom:
              "1px solid rgba(141, 181, 210, 0.16)",
            backgroundColor:
              "rgba(7, 16, 25, 0.78)",
            backgroundImage: "none",
            backdropFilter: "blur(18px)",
            boxShadow: "none",
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },

          rounded: {
            border:
              "1px solid rgba(141, 181, 210, 0.16)",
            borderRadius: 16,
            backgroundColor:
              "rgba(16, 30, 43, 0.88)",
            boxShadow:
              "inset 0 1px 0 rgba(255, 255, 255, 0.035)",
          },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            border:
              "1px solid rgba(141, 181, 210, 0.16)",
            borderRadius: 18,
            background:
              "linear-gradient(145deg, rgba(18, 34, 48, 0.88), rgba(10, 23, 34, 0.78))",
            backgroundImage:
              "linear-gradient(145deg, rgba(18, 34, 48, 0.88), rgba(10, 23, 34, 0.78))",
            boxShadow:
              "inset 0 1px 0 rgba(255, 255, 255, 0.035)",
          },
        },
      },

      MuiButton: {
        styleOverrides: {
          root: {
            minHeight: 40,
            borderRadius: 11,
            fontWeight: 700,
            textTransform: "none",
          },

          containedPrimary: {
            color: "#041312",
            boxShadow:
              "0 14px 34px rgba(72, 215, 197, 0.18)",

            "&:hover": {
              backgroundColor: "#78f3e3",
              boxShadow:
                "0 16px 38px rgba(72, 215, 197, 0.24)",
            },
          },

          outlined: {
            borderColor:
              "rgba(141, 181, 210, 0.20)",

            "&:hover": {
              borderColor:
                "rgba(72, 215, 197, 0.42)",
              backgroundColor:
                "rgba(72, 215, 197, 0.06)",
            },
          },
        },
      },

      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 11,

            "&:hover": {
              color: "#78f3e3",
              backgroundColor:
                "rgba(72, 215, 197, 0.08)",
            },
          },
        },
      },

      MuiTextField: {
        defaultProps: {
          variant: "outlined",
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 11,
            backgroundColor:
              "rgba(255, 255, 255, 0.025)",

            "& .MuiOutlinedInput-notchedOutline": {
              borderColor:
                "rgba(141, 181, 210, 0.20)",
            },

            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor:
                "rgba(72, 215, 197, 0.42)",
            },

            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#48d7c5",
            },
          },
        },
      },

      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            color: "#eef7ff",
            border:
              "1px solid rgba(141, 181, 210, 0.16)",
            borderRadius: 8,
            backgroundColor: "#101e2b",
          },
        },
      },
    },
  });

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={themes}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

ThemeCustomization.propTypes = {
  children: PropTypes.node,
};

export function getColors(
  theme,
  color = "primary"
) {
  const palette =
    theme.palette[color] ||
    theme.palette.primary ||
    {};

  const main =
    palette.main ||
    theme.palette.primary.main;

  return {
    lighter:
      palette.lighter ||
      alpha(main, 0.12),
    light:
      palette.light ||
      alpha(main, 0.24),
    main,
    dark:
      palette.dark ||
      alpha(main, 0.8),
    contrastText:
      palette.contrastText ||
      "#ffffff",
  };
}

export function getShadow(theme, key) {
  const customShadows =
    theme.customShadows || {};

  return (
    customShadows[key] ||
    customShadows.primaryButton ||
    "none"
  );
}