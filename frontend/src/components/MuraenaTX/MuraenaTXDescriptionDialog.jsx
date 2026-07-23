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

export default function MuraenaTXDescriptionDialog({
  open,
  row,
  loading = false,
  onClose,
  onSave,
}) {
  const { t } = useTranslation();

  const [value, setValue] = useState("");

  useEffect(() => {
    if (!open) return;

    setValue(row?.descr || "");
  }, [open, row]);

  const handleSave = () => {
    if (!row || loading) return;

    onSave(value.trim());
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      (event.ctrlKey || event.metaKey)
    ) {
      event.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {t("muraenatx.description.dialog_title", {
          address: row?.address_hex || "",
        })}
      </DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={4}
          maxRows={12}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          label={t("muraenatx.description.field")}
          placeholder={t(
            "muraenatx.description.placeholder"
          )}
          disabled={loading}
          sx={{ mt: 1 }}
          slotProps={{
            htmlInput: {
              maxLength: 1024,
            },
          }}
          helperText={t(
            "muraenatx.description.save_hint"
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