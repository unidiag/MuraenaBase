import React from "react";
import {
  Chip,
  CircularProgress,
  Stack,
  Tooltip,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { highlightText } from "./muraenaTXUtils";

function getRowBits(row) {
  const maskBits = String(
    row.mask_binary || "00000000"
  )
    .padStart(8, "0")
    .slice(-8)
    .split("");

  const commandValue = Number.isInteger(row.command)
    ? row.command
    : Number.parseInt(row.command_hex || "00", 16);

  const commandBits = commandValue
    .toString(2)
    .padStart(8, "0")
    .slice(-8)
    .split("");

  return {
    maskBits,
    commandBits,
  };
}

export default function MuraenaTXOutputMap({
  row,
  search,
  labelsMode = "map",
  changingOutput,
  disabled,
  onOutputClick,
}) {
  const { t } = useTranslation();

  const labelsValue =
    labelsMode === "billing"
      ? row.billing
      : row.map;

  const outputs = String(
    labelsValue || "0:0:0:0:0:0:0:0"
  )
    .split(":")
    .slice(0, 8);

  while (outputs.length < 8) {
    outputs.push("0");
  }
  
  const { maskBits, commandBits } = getRowBits(row);

  return (
    <Stack
      direction="row"
      spacing={0.5}
      useFlexGap
      flexWrap="wrap"
    >
      {outputs.map((item, outputIndex) => {
        const value = item.trim() || "0";

        const maskEnabled =
          maskBits[outputIndex] === "1";

        const commandEnabled =
          commandBits[outputIndex] === "1";

        const color = commandEnabled
          ? "warning"
          : maskEnabled
            ? "success"
            : "error";

        const actionKey =
          `${row.address_hex}-${outputIndex}`;

        const changing =
          changingOutput === actionKey;

        const tooltipKey =
          color === "success"
            ? "enabled"
            : color === "warning"
              ? "warning"
              : "disabled";

        return (
          <Tooltip
            key={actionKey}
            title={t(
              `muraenatx.output.${tooltipKey}`
            )}
          >
            <Chip
              size="small"
              color={color}
              variant="filled"
              clickable
              disabled={disabled}
              onClick={() =>
                onOutputClick(row, outputIndex)
              }
              label={
                changing ? (
                  <CircularProgress
                    size={14}
                    color="inherit"
                  />
                ) : (
                  highlightText(value, search)
                )
              }
              sx={{
                cursor: disabled
                  ? "default"
                  : "pointer",
                minWidth: 56,
                ml: outputIndex === 4 ? 2 : 0,
              }}
            />
          </Tooltip>
        );
      })}
    </Stack>
  );
}