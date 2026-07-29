import { alpha } from "@mui/material/styles";

export default function CustomShadows(theme) {
  const transparent = alpha(theme.palette.common.black, 0.1);

  return {
    button: `0 2px 0 ${transparent}`,
    text: `0 -1px 0 ${alpha(
      theme.palette.common.black,
      0.12
    )}`,
    z1: `0 1px 2px 0 ${alpha(
      theme.palette.common.black,
      0.22
    )}`,
    primary: `0 0 0 2px ${alpha(
      theme.palette.primary.main,
      0.12
    )}`,
    primaryButton: `0 14px 34px ${alpha(
      theme.palette.primary.main,
      0.18
    )}`,
    secondary: `0 0 0 2px ${alpha(
      theme.palette.secondary.main,
      0.12
    )}`,
    error: `0 0 0 2px ${alpha(
      theme.palette.error.main,
      0.12
    )}`,
    warning: `0 0 0 2px ${alpha(
      theme.palette.warning.main,
      0.12
    )}`,
    info: `0 0 0 2px ${alpha(
      theme.palette.info.main,
      0.12
    )}`,
    success: `0 0 0 2px ${alpha(
      theme.palette.success.main,
      0.12
    )}`,
    grey: `0 0 0 2px ${alpha(
      theme.palette.grey[500],
      0.12
    )}`,
  };
}