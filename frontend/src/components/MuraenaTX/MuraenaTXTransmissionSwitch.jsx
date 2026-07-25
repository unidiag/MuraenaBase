import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  FormControlLabel,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";

import { sendDataToServer } from "utils/functions";
import { useToast } from "utils/useToast";

export default function MuraenaTXTransmissionSwitch({
  disabled = false,
}) {
  const toast = useToast();

  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);
  const [available, setAvailable] = useState(false);

  const loadState = useCallback(async () => {
    setLoading(true);

    try {
      const response = await sendDataToServer({
        op: "getMuraenaTXTransmissionState",
      });

      if (!response || response.status !== "OK") {
        throw new Error(
          response?.status ||
            "Failed to get MuraenaTX transmission state"
        );
      }

      setEnabled(Boolean(response.enabled));
      setAvailable(true);
    } catch (error) {
      setAvailable(false);
      toast.error(
        error?.message ||
          "Failed to get MuraenaTX transmission state"
      );
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const handleChange = async (event) => {
    const nextEnabled = event.target.checked;
    const previousEnabled = enabled;

    setEnabled(nextEnabled);
    setChanging(true);

    try {
      const response = await sendDataToServer({
        op: "setMuraenaTXTransmissionState",
        enabled: nextEnabled,
      });

      if (!response || response.status !== "OK") {
        throw new Error(
          response?.status ||
            "Failed to change MuraenaTX transmission state"
        );
      }

      setEnabled(Boolean(response.enabled));
      setAvailable(true);

      toast.success(
        response.enabled
          ? "MuraenaTX transmitter enabled"
          : "MuraenaTX transmitter disabled"
      );
    } catch (error) {
      setEnabled(previousEnabled);

      toast.error(
        error?.message ||
          "Failed to change MuraenaTX transmission state"
      );
    } finally {
      setChanging(false);
    }
  };

  const isDisabled =
    disabled || loading || changing || !available;

  const label = loading
    ? "TX"
    : enabled
      ? "TX ON"
      : "TX OFF";

  return (
    <Tooltip
      title={
        loading
          ? "Reading transmitter state"
          : available
            ? enabled
              ? "Disable MuraenaTX transmitter"
              : "Enable MuraenaTX transmitter"
            : "MuraenaTX transmitter is unavailable"
      }
    >
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          minWidth: 92,
        }}
      >
        <FormControlLabel
          control={
            changing || loading ? (
              <Box
                sx={{
                  width: 38,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <CircularProgress size={20} />
              </Box>
            ) : (
              <Switch
                size="small"
                color="success"
                checked={enabled}
                onChange={handleChange}
                disabled={isDisabled}
                inputProps={{
                  "aria-label":
                    "MuraenaTX transmitter state",
                }}
              />
            )
          }
          label={
            <Typography
              variant="body2"
              color={
                available
                  ? enabled
                    ? "success.main"
                    : "text.secondary"
                  : "error.main"
              }
              sx={{
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </Typography>
          }
          sx={{
            m: 0,
          }}
        />
      </Box>
    </Tooltip>
  );
}