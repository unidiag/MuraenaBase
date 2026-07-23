import React from "react";
import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { formatSmartDateTime } from "utils/functions";
import MuraenaTXActionsCell from "./MuraenaTXActionsCell";
import MuraenaTXDescriptionCell from "./MuraenaTXDescriptionCell";
import MuraenaTXOutputMap from "./MuraenaTXOutputMap";
import { highlightText } from "./muraenaTXUtils";
import MuraenaTXLocationCell from "./MuraenaTXLocationCell";

function SortableHeader({
  field,
  orderBy,
  order,
  onSort,
  children,
}) {
  return (
    <TableSortLabel
      active={orderBy === field}
      direction={
        orderBy === field ? order : "asc"
      }
      onClick={() => onSort(field)}
    >
      {children}
    </TableSortLabel>
  );
}

export default function MuraenaTXTable({
  rows,
  search,
  page,
  rowsPerPage,
  loading,
  orderBy,
  order,
  onSort,
  changingOutput,
  updatingDescr,
  updatingLocation,
  deletingAddress,
  actionsDisabled,
  onOutputClick,
  onDescriptionClick,
  onLocationClick,
  onEdit,
  onDelete,
  outputLabelsMode,
}) {
  const { t } = useTranslation();

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell width={80}>#</TableCell>

            <TableCell>
              <SortableHeader
                field="address"
                orderBy={orderBy}
                order={order}
                onSort={onSort}
              >
                {t("muraenatx.addresses.address")}
              </SortableHeader>
            </TableCell>

            <TableCell>
              <SortableHeader
                field="location"
                orderBy={orderBy}
                order={order}
                onSort={onSort}
              >
                {t("muraenatx.addresses.location")}
              </SortableHeader>
            </TableCell>

            <TableCell>
              {t("muraenatx.addresses.map")}
            </TableCell>

            <TableCell>
              <SortableHeader
                field="descr"
                orderBy={orderBy}
                order={order}
                onSort={onSort}
              >
                {t("muraenatx.addresses.descr")}
              </SortableHeader>
            </TableCell>

            <TableCell>
              <SortableHeader
                field="updated_at"
                orderBy={orderBy}
                order={order}
                onSort={onSort}
              >
                {t("muraenatx.addresses.updated")}
              </SortableHeader>
            </TableCell>

            <TableCell
              width={96}
              align="center"
              aria-label="Actions"
            />
          </TableRow>
        </TableHead>

        <TableBody>
          {loading && rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Box sx={{ py: 5 }}>
                  <CircularProgress size={32} />

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {t(
                      "muraenatx.addresses.loading"
                    )}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Typography
                  color="text.secondary"
                  sx={{ py: 5 }}
                >
                  {search.trim()
                    ? t(
                        "muraenatx.addresses.search_empty"
                      )
                    : t(
                        "muraenatx.addresses.empty"
                      )}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => {
                const hasDatabaseRecord = Number(row.id) > 0;

            return (
              <TableRow
                key={row.address}
                hover
                sx={{
                  opacity: row.id ? 1 : 0.25,
                }}
              >
                <TableCell>
                  {(page - 1) * rowsPerPage +
                    index +
                    1}
                </TableCell>

                <TableCell>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: "monospace",
                      fontWeight: 600,
                    }}
                  >
                    {highlightText(
                      row.address_hex,
                      search
                    )}
                  </Typography>
                </TableCell>

                <TableCell>
                  <MuraenaTXLocationCell
                    row={row}
                    search={search}
                    updating={
                      updatingLocation === row.address_hex
                    }
                    disabled={
                      actionsDisabled ||
                      !hasDatabaseRecord
                    }
                    onClick={onLocationClick}
                  />
                </TableCell>

                <TableCell>
                  <MuraenaTXOutputMap
                    row={row}
                    search={search}
                    labelsMode={outputLabelsMode}
                    changingOutput={changingOutput}
                    disabled={actionsDisabled}
                    onOutputClick={onOutputClick}
                  />
                </TableCell>

                <TableCell>
                  <MuraenaTXDescriptionCell
                    row={row}
                    search={search}
                    updating={
                      updatingDescr ===
                      row.address_hex
                    }
                    disabled={actionsDisabled}
                    onClick={onDescriptionClick}
                  />
                </TableCell>

                <TableCell
                  sx={{
                    whiteSpace: "nowrap",
                    fontSize: "0.75em",
                  }}
                >
                  {formatSmartDateTime(
                    row.updated_at
                  )}
                </TableCell>

                <TableCell align="center">
                  <MuraenaTXActionsCell
                    row={row}
                    disabled={actionsDisabled}
                    deleting={
                      deletingAddress ===
                      row.address_hex
                    }
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </TableCell>
              </TableRow>
            )})
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}