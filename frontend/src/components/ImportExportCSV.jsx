import React, {
  useRef,
  useState,
} from "react";
import {
  Alert,
  Button,
  ButtonGroup,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FileUploadIcon from "@mui/icons-material/FileUpload";

import { sendDataToServer } from "utils/functions";

export default function ImportExportCSV({
  onImported,
}) {
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({
    open: false,
    severity: "success",
    text: "",
  });

  const showMessage = (
    text,
    severity = "success"
  ) => {
    setMessage({
      open: true,
      severity,
      text,
    });
  };

  const handleExport = async () => {
    setLoading(true);

    try {
      const response = await sendDataToServer({
        op: "exportAddressesCSV",
      });

      if (!response) {
        throw new Error(
          "Empty server response"
        );
      }

      if (response.status !== "OK") {
        throw new Error(
          response.status ||
            "Export failed"
        );
      }

      if (
        typeof response.csv !== "string"
      ) {
        throw new Error(
          "CSV data is missing"
        );
      }

      const blob = new Blob(
        [
          "\uFEFF",
          response.csv,
        ],
        {
          type: "text/csv;charset=utf-8",
        }
      );

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download =
        response.filename ||
        "muraenabase-addresses.csv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      showMessage(
        `Exported ${response.count || 0} records`
      );
    } catch (error) {
      console.error(
        "Address CSV export failed:",
        error
      );

      showMessage(
        error.message ||
          "Export failed",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImportButtonClick = () => {
    if (loading) {
      return;
    }

    fileInputRef.current?.click();
  };

  const handleImportFile = async (
    event
  ) => {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    const fileName =
      file.name.toLowerCase();

    if (!fileName.endsWith(".csv")) {
      showMessage(
        "Please select a CSV file",
        "warning"
      );

      return;
    }

    setLoading(true);

    try {
      const csv = await file.text();

      if (!csv.trim()) {
        throw new Error(
          "CSV file is empty"
        );
      }

      const response =
        await sendDataToServer({
          op: "importAddressesCSV",
          csv,
        });

      if (!response) {
        throw new Error(
          "Empty server response"
        );
      }

      if (response.status !== "OK") {
        throw new Error(
          response.status ||
            "Import failed"
        );
      }

      const created =
        Number(response.created) || 0;

      const updated =
        Number(response.updated) || 0;

      showMessage(
        `Imported: ${created} created, ${updated} updated`
      );

      if (
        typeof onImported === "function"
      ) {
        onImported(response);
      }
    } catch (error) {
      console.error(
        "Address CSV import failed:",
        error
      );

      showMessage(
        error.message ||
          "Import failed",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={handleImportFile}
      />

      <ButtonGroup
        variant="outlined"
        size="small"
        disabled={loading}
      >
        <Button
          startIcon={
            loading ? (
              <CircularProgress
                size={16}
              />
            ) : (
              <FileUploadIcon />
            )
          }
          onClick={
            handleImportButtonClick
          }
        >
          Import
        </Button>

        <Button
          startIcon={
            <FileDownloadIcon />
          }
          onClick={handleExport}
        >
          Export
        </Button>
      </ButtonGroup>

      <Snackbar
        open={message.open}
        autoHideDuration={5000}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        onClose={() => {
          setMessage((current) => ({
            ...current,
            open: false,
          }));
        }}
      >
        <Alert
          severity={message.severity}
          variant="filled"
          onClose={() => {
            setMessage((current) => ({
              ...current,
              open: false,
            }));
          }}
        >
          {message.text}
        </Alert>
      </Snackbar>
    </>
  );
}