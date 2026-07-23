import React from "react";
import { Box } from "@mui/material";

export const ROWS_PER_PAGE = 25;

export const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlightText(value, search) {
  const text = String(value ?? "");
  const query = search.trim();

  if (!query) {
    return text;
  }

  const parts = text.split(
    new RegExp(`(${escapeRegExp(query)})`, "gi")
  );

  return parts.map((part, index) => {
    const matched =
      part.toLowerCase() === query.toLowerCase();

    if (!matched) {
      return (
        <React.Fragment key={index}>
          {part}
        </React.Fragment>
      );
    }

    return (
      <Box
        key={index}
        component="span"
        sx={{
          bgcolor: "yellow",
          color: "red",
          px: 0.25,
          borderRadius: 0.25,
        }}
      >
        {part}
      </Box>
    );
  });
}

export function getNextOutputState(
  maskEnabled,
  commandEnabled
) {
  if (maskEnabled && !commandEnabled) {
    return {
      maskEnabled: true,
      commandEnabled: true,
    };
  }

  if (commandEnabled) {
    return {
      maskEnabled: false,
      commandEnabled: false,
    };
  }

  return {
    maskEnabled: true,
    commandEnabled: false,
  };
}

export function bitsToByte(bits) {
  return Number.parseInt(bits.join(""), 2);
}

function compareText(a, b) {
  return String(a ?? "").localeCompare(
    String(b ?? ""),
    undefined,
    {
      numeric: true,
      sensitivity: "base",
    }
  );
}

export function compareRows(a, b, field) {
  switch (field) {
    case "address":
      return Number(a.address ?? 0) -
        Number(b.address ?? 0);

    case "location":
      return compareText(a.location, b.location);

    case "descr":
      return compareText(a.descr, b.descr);

    case "updated_at":
      return (
        new Date(a.updated_at || 0).getTime() -
        new Date(b.updated_at || 0).getTime()
      );

    default:
      return 0;
  }
}