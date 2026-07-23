import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import MemoryIcon from "@mui/icons-material/Memory";
import { useTranslation } from "react-i18next";

import { sendDataToServer } from "utils/functions";

export default function MainPage() {
  const { t } = useTranslation();

  const [rows, setRows] = useState([]);
  const [device, setDevice] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await sendDataToServer({
        op: "getMuraenaTXAddresses",
      });

      if (!res) {
        setRows([]);
        setError(t("muraenatx.errors.no_response"));
        return;
      }

      if (res.status !== "OK") {
        setRows([]);
        setError(res.status || t("muraenatx.errors.load_failed"));
        return;
      }

      setRows(Array.isArray(res.rows) ? res.rows : []);
      setDevice(res.device || "");
    } catch (err) {
      console.error(err);

      setRows([]);
      setError(t("muraenatx.errors.load_failed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <MemoryIcon color="primary" />

            <Typography variant="h5">
              {t("muraenatx.addresses.title")}
            </Typography>
          </Stack>

          <Typography variant="body2" color="text.secondary">
            {t("muraenatx.addresses.description")}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={
            loading
              ? <CircularProgress size={18} />
              : <RefreshIcon />
          }
          disabled={loading}
          onClick={loadAddresses}
        >
          {t("muraenatx.addresses.refresh")}
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
        sx={{ mb: 2 }}
      >
        <Chip
          label={t("muraenatx.addresses.count", {
            count: rows.length,
          })}
          color="primary"
          variant="outlined"
        />

        {device && (
          <Chip
            label={t("muraenatx.addresses.device", {
              device,
            })}
            variant="outlined"
          />
        )}
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={80}>
                #
              </TableCell>

              <TableCell>
                {t("muraenatx.addresses.address")}
              </TableCell>

              <TableCell>
                {t("muraenatx.addresses.command")}
              </TableCell>

              <TableCell>
                {t("muraenatx.addresses.mask")}
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Box sx={{ py: 5 }}>
                    <CircularProgress size={32} />

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {t("muraenatx.addresses.loading")}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography
                    color="text.secondary"
                    sx={{ py: 5 }}
                  >
                    {t("muraenatx.addresses.empty")}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow
                  key={row.address}
                  hover
                >
                  <TableCell>
                    {index + 1}
                  </TableCell>

                  <TableCell>
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: "monospace",
                        fontWeight: 600,
                      }}
                    >
                      {row.address_hex}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography
                      component="span"
                      sx={{ fontFamily: "monospace" }}
                    >
                      0x{row.command_hex}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: "monospace",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {row.mask_binary}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}