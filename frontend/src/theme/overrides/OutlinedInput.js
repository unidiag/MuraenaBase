import { alpha } from "@mui/material/styles";

export default function OutlinedInput(theme) {
  return {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 11,
          backgroundColor: alpha(
            theme.palette.common.white,
            0.025
          ),

          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha(
              theme.palette.grey[300],
              0.2
            ),
          },

          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha(
              theme.palette.primary.main,
              0.42
            ),
          },

          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.primary.main,
            borderWidth: 1,
          },

          "&.Mui-error .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.error.main,
          },

          "&.Mui-disabled": {
            color: theme.palette.text.disabled,
            backgroundColor: alpha(
              theme.palette.common.white,
              0.015
            ),

            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: alpha(
                theme.palette.grey[300],
                0.08
              ),
            },
          },
        },

        input: {
          "&::placeholder": {
            color: theme.palette.text.secondary,
            opacity: 0.72,
          },
        },

        inputSizeSmall: {
          padding: "8px 12px",
        },

        multiline: {
          padding: 0,
        },
      },
    },
  };
}