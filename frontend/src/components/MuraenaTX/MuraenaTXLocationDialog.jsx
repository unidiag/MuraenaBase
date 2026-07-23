import React, { useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useTranslation } from "react-i18next";

export default function MuraenaTXLocationDialog({
  open,
  row,
  loading = false,
  onClose,
  onSave,
}) {
  const { t } = useTranslation();

  const [value, setValue] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setValue(row?.location || "");
  }, [open, row]);

  const handleSave = () => {
    if (!row || loading) {
      return;
    }

    onSave(value.trim());
  };

  const handleKeyDown = (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    handleSave();
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {t("muraenatx.location.dialog_title", {
          address: row?.address_hex || "",
        })}
      </DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          value={value}
          onChange={(event) =>
            setValue(event.target.value)
          }
          onKeyDown={handleKeyDown}
          label={t("muraenatx.location.field")}
          placeholder={t(
            "muraenatx.location.placeholder"
          )}
          disabled={loading}
          sx={{ mt: 1 }}
          slotProps={{
            htmlInput: {
              maxLength: 255,
            },
          }}
          helperText={t(
            "muraenatx.location.save_hint"
          )}
        />
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
          {t("common.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}