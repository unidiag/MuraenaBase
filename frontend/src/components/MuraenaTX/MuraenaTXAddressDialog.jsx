import React, { useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { useTranslation } from "react-i18next";

const DEFAULT_OUTPUT_VALUES = "0:0:0:0:0:0:0:0";

const defaultValues = {
  address: "",
  command: "00",
  mask: "00000000",
  location: "",
  descr: "",
  map: DEFAULT_OUTPUT_VALUES,
  billing: DEFAULT_OUTPUT_VALUES,
};

function normalizeAddress(value) {
  return value
    .toUpperCase()
    .replace(/[^0-9A-F]/g, "")
    .slice(0, 4);
}

function normalizeCommand(value) {
  return value
    .toUpperCase()
    .replace(/^0X/, "")
    .replace(/[^0-9A-F]/g, "")
    .slice(0, 2);
}

function normalizeMask(value) {
  return value
    .replace(/[^01]/g, "")
    .slice(0, 8);
}

function normalizeOutputValues(value) {
  return String(value ?? "")
    .split(":")
    .map((item) => item.trim() || "0")
    .join(":");
}

function validateOutputValues(value) {
  return String(value ?? "").split(":").length === 8;
}

export default function MuraenaTXAddressDialog({
  open,
  row = null,
  loading = false,
  onClose,
  onSave,
}) {
  const { t } = useTranslation();

  const [values, setValues] = useState(defaultValues);
  const [errors, setErrors] = useState({});

  const editing = Boolean(row);

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(
      row
        ? {
            address: row.address_hex || "",
            command: row.command_hex || "00",
            mask: row.mask_binary || "00000000",
            location: row.location || "",
            descr: row.descr || "",
            map: row.map || DEFAULT_OUTPUT_VALUES,
            billing:
              row.billing || DEFAULT_OUTPUT_VALUES,
          }
        : {
            ...defaultValues,
          }
    );

    setErrors({});
  }, [open, row]);

  const setFieldValue = (field, value) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = {
        ...current,
      };

      delete nextErrors[field];

      return nextErrors;
    });
  };

  const validate = () => {
    const nextErrors = {};

    if (!/^[0-9A-F]{4}$/.test(values.address)) {
      nextErrors.address = t(
        "muraenatx.address_form.errors.address"
      );
    } else {
      const address = Number.parseInt(
        values.address,
        16
      );

      if (address > 0x7fff) {
        nextErrors.address = t(
          "muraenatx.address_form.errors.address"
        );
      }
    }

    if (!/^[0-9A-F]{2}$/.test(values.command)) {
      nextErrors.command = t(
        "muraenatx.address_form.errors.command"
      );
    }

    if (!/^[01]{8}$/.test(values.mask)) {
      nextErrors.mask = t(
        "muraenatx.address_form.errors.mask"
      );
    }

    if (!validateOutputValues(values.map)) {
      nextErrors.map = t(
        "muraenatx.address_form.errors.map"
      );
    }

    if (!validateOutputValues(values.billing)) {
      nextErrors.billing = t(
        "muraenatx.address_form.errors.billing"
      );
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (loading || !validate()) {
      return;
    }

    onSave({
      old_address: row?.address_hex || "",
      address: values.address,
      command: values.command,
      mask: values.mask,
      location: values.location.trim(),
      descr: values.descr.trim(),
      map: normalizeOutputValues(values.map),
      billing: normalizeOutputValues(
        values.billing
      ),
    });
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !loading
    ) {
      event.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={
        loading
          ? undefined
          : onClose
      }
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle>
        {editing
          ? t(
              "muraenatx.address_form.edit_title"
            )
          : t(
              "muraenatx.address_form.add_title"
            )}
      </DialogTitle>

      <DialogContent>
        <Stack
          spacing={2}
          sx={{ pt: 1 }}
          onKeyDown={handleKeyDown}
        >
          <TextField
            autoFocus
            fullWidth
            label={t(
              "muraenatx.address_form.address"
            )}
            value={values.address}
            onChange={(event) =>
              setFieldValue(
                "address",
                normalizeAddress(
                  event.target.value
                )
              )
            }
            error={Boolean(errors.address)}
            helperText={
              errors.address ||
              t(
                "muraenatx.address_form.address_helper"
              )
            }
            disabled={loading}
            slotProps={{
              htmlInput: {
                maxLength: 4,
                inputMode: "text",
              },
            }}
          />

          <TextField
            fullWidth
            label={t(
              "muraenatx.address_form.command"
            )}
            value={values.command}
            onChange={(event) =>
              setFieldValue(
                "command",
                normalizeCommand(
                  event.target.value
                )
              )
            }
            error={Boolean(errors.command)}
            helperText={
              errors.command ||
              t(
                "muraenatx.address_form.command_helper"
              )
            }
            disabled={loading}
            slotProps={{
              htmlInput: {
                maxLength: 2,
                inputMode: "text",
              },
            }}
          />

          <TextField
            fullWidth
            label={t(
              "muraenatx.address_form.mask"
            )}
            value={values.mask}
            onChange={(event) =>
              setFieldValue(
                "mask",
                normalizeMask(
                  event.target.value
                )
              )
            }
            error={Boolean(errors.mask)}
            helperText={
              errors.mask ||
              t(
                "muraenatx.address_form.mask_helper"
              )
            }
            disabled={loading}
            slotProps={{
              htmlInput: {
                maxLength: 8,
                inputMode: "numeric",
              },
            }}
          />

          <TextField
            fullWidth
            label={t(
              "muraenatx.address_form.location"
            )}
            value={values.location}
            onChange={(event) =>
              setFieldValue(
                "location",
                event.target.value
              )
            }
            disabled={loading}
            slotProps={{
              htmlInput: {
                maxLength: 255,
              },
            }}
          />

          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={5}
            label={t(
              "muraenatx.address_form.descr"
            )}
            value={values.descr}
            onChange={(event) =>
              setFieldValue(
                "descr",
                event.target.value
              )
            }
            disabled={loading}
            slotProps={{
              htmlInput: {
                maxLength: 1024,
              },
            }}
          />

          <TextField
            fullWidth
            label={t(
              "muraenatx.address_form.map"
            )}
            value={values.map}
            onChange={(event) =>
              setFieldValue(
                "map",
                event.target.value
              )
            }
            error={Boolean(errors.map)}
            helperText={
              errors.map ||
              t(
                "muraenatx.address_form.map_helper"
              )
            }
            placeholder={DEFAULT_OUTPUT_VALUES}
            disabled={loading}
            slotProps={{
              htmlInput: {
                maxLength: 1024,
              },
            }}
          />

          <TextField
            fullWidth
            label={t(
              "muraenatx.address_form.billing"
            )}
            value={values.billing}
            onChange={(event) =>
              setFieldValue(
                "billing",
                event.target.value
              )
            }
            error={Boolean(errors.billing)}
            helperText={
              errors.billing ||
              t(
                "muraenatx.address_form.billing_hint"
              )
            }
            placeholder={DEFAULT_OUTPUT_VALUES}
            disabled={loading}
            slotProps={{
              htmlInput: {
                maxLength: 1024,
              },
            }}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          disabled={loading}
        >
          {t("common.cancel")}
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress
                size={18}
                color="inherit"
              />
            ) : null
          }
        >
          {editing
            ? t("common.save")
            : t("common.add")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}