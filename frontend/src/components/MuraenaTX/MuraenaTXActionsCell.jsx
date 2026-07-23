import React from "react";
import {
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useTranslation } from "react-i18next";

export default function MuraenaTXActionsCell({
  row,
  disabled,
  deleting,
  onEdit,
  onDelete,
}) {
  const { t } = useTranslation();

  return (
    <Stack
      direction="row"
      spacing={0.5}
      justifyContent="center"
    >
      <Tooltip
        title={t("common.edit", {
          address: row.address_hex,
        })}
      >
        <span>
          <IconButton
            size="small"
            color="primary"
            disabled={disabled}
            onClick={() => onEdit(row)}
            aria-label={t("common.edit", {
              address: row.address_hex,
            })}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      {row.address !== 0 && (
        <Tooltip
          title={t("muraenatx.delete.tooltip", {
            address: row.address_hex,
          })}
        >
          <span>
            <IconButton
              size="small"
              color="error"
              disabled={disabled}
              onClick={() => onDelete(row)}
              aria-label={t(
                "muraenatx.delete.tooltip",
                {
                  address: row.address_hex,
                }
              )}
            >
              {deleting ? (
                <CircularProgress
                  size={20}
                  color="inherit"
                />
              ) : (
                <DeleteOutlineIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Stack>
  );
}