import React from "react";
import {
  Box,
  CircularProgress,
  Tooltip,
  Typography,
} from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { useTranslation } from "react-i18next";

import { highlightText } from "./muraenaTXUtils";

function truncateText(value, maxLength = 40) {
  const text = String(value ?? "");

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}…`;
}

export default function MuraenaTXLocationCell({
  row,
  search,
  updating,
  disabled,
  onClick,
}) {
  const { t } = useTranslation();

  return (
    <Tooltip
      title={
        row.location ||
        t("muraenatx.location.tooltip")
      }
    >
      <Box
        onClick={
          disabled
            ? undefined
            : () => onClick(row)
        }
        sx={{
          display: "inline-block",
          minWidth: 80,
          maxWidth: 320,
          cursor: disabled
            ? "default"
            : "pointer",
          py: 0.25,

          "&:hover": disabled
            ? undefined
            : {
                color: "primary.main",
              },
        }}
      >
        {updating ? (
          <CircularProgress size={16} />
        ) : (
          <Typography
            variant="body2"
            component="span"
            sx={{
              whiteSpace: "nowrap",
            }}
          >
            {row.location ? (
              highlightText(
                truncateText(row.location, 40),
                search
              )
            ) : (
              <MoreHorizIcon
                color="warning"
                sx={{
                  display: "block",
                  mx: "auto",
                  transform: "translateY(5px)",
                }}
              />
            )}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}