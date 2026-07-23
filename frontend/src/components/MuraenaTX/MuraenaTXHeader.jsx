import React from "react";
import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Pagination,
  Stack,
  TextField,
  Tooltip,
  Typography,
  FormControlLabel,
  Switch,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MemoryIcon from "@mui/icons-material/Memory";
import SearchIcon from "@mui/icons-material/Search";
import { useTranslation } from "react-i18next";
import SyncIcon from "@mui/icons-material/Sync";

import TitleBlock from "components/TitleBlock";

export default function MuraenaTXHeader({
  search,
  onSearchChange,
  filteredCount,
  totalCount,
  page,
  pageCount,
  onPageChange,
  device,
  loading,
  resetting,
  syncing,
  syncDisabled,
  addDisabled,
  onSync,
  onAdd,
  onReset,
  outputLabelsMode,
  onOutputLabelsModeChange,
}) {
  const { t } = useTranslation();

  return (
    <TitleBlock
      t1={
        <TextField
          size="small"
          value={search}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          placeholder={t(
            "muraenatx.addresses.search"
          )}
          sx={{
            width: {
              xs: "100%",
              sm: 320,
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      }
      t2={
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ whiteSpace: "nowrap" }}
          >
            {t(
              "muraenatx.addresses.filtered_count",
              {
                count: filteredCount,
                total: totalCount,
              }
            )}
          </Typography>

          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, value) =>
              onPageChange(value)
            }
            size="small"
            color="primary"
            disabled={
              loading || filteredCount === 0
            }
            showFirstButton
            showLastButton
          />
        </Stack>
      }
      t3={
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
        >
          <FormControlLabel
            control={
              <Switch
                size="small"
                color="warning"
                checked={
                  outputLabelsMode === "billing"
                }
                onChange={
                  onOutputLabelsModeChange
                }
              />
            }
            label={
              outputLabelsMode === "billing"
                ? t("muraenatx.output_labels.billing")
                : t("muraenatx.output_labels.map")
            }
            sx={{
              mr: 0.5,
              whiteSpace: "nowrap",
            }}
          />

          <Button
            variant="outlined"
            color="error"
            startIcon={
              syncing ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : (
                <SyncIcon />
              )
            }
            onClick={onSync}
            disabled={syncDisabled}
          >
            {syncing
              ? t("muraenatx.sync.syncing")
              : t("muraenatx.sync.button")}
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAdd}
            disabled={addDisabled}
          >
            {t("muraenatx.addresses.add")}
          </Button>
        </Stack>
      }
    >
      <Tooltip
        title={
          resetting
            ? t("muraenatx.reset.restarting")
            : device
              ? t("muraenatx.reset.tooltip", {
                  device,
                })
              : t(
                  "muraenatx.addresses.device_unavailable"
                )
        }
      >
        <Box
          component="span"
          onClick={
            device && !resetting
              ? onReset
              : undefined
          }
          sx={{
            display: "inline-flex",
            alignItems: "center",
            cursor:
              device && !resetting
                ? "pointer"
                : "default",
          }}
        >
          {resetting ? (
            <CircularProgress size={22} />
          ) : (
            <MemoryIcon
              color={device ? "success" : "error"}
            />
          )}
        </Box>
      </Tooltip>

      {t("muraenatx.addresses.title")}
    </TitleBlock>
  );
}