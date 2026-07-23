import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Container } from "@mui/material";
import { useTranslation } from "react-i18next";

import { sendDataToServer } from "utils/functions";
import { useToast } from "utils/useToast";

import MuraenaTXAddressDialog from "components/MuraenaTX/MuraenaTXAddressDialog";
import MuraenaTXDescriptionDialog from "components/MuraenaTX/MuraenaTXDescriptionDialog";
import MuraenaTXHeader from "components/MuraenaTX/MuraenaTXHeader";
import MuraenaTXTable from "components/MuraenaTX/MuraenaTXTable";
import MuraenaTXLocationDialog from "components/MuraenaTX/MuraenaTXLocationDialog";

import {
  bitsToByte,
  compareRows,
  getNextOutputState,
  ROWS_PER_PAGE,
  sleep,
} from "components/MuraenaTX/muraenaTXUtils";

export default function MainPage() {
  const { t } = useTranslation();
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [device, setDevice] = useState("");
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [orderBy, setOrderBy] = useState("address");
  const [order, setOrder] = useState("asc");

  const [deletingAddress, setDeletingAddress] =
    useState("");

  const [changingOutput, setChangingOutput] =
    useState("");

  const [addressDialogOpen, setAddressDialogOpen] =
    useState(false);

  const [savingAddress, setSavingAddress] =
    useState(false);

  const [editingRow, setEditingRow] =
    useState(null);

  const [updatingDescr, setUpdatingDescr] =
    useState("");

  const [
    descriptionDialogOpen,
    setDescriptionDialogOpen,
  ] = useState(false);

  const [descriptionRow, setDescriptionRow] =
    useState(null);


  const [updatingLocation, setUpdatingLocation] =
    useState("");

    
  const OUTPUT_LABELS_MODE_KEY =
    "muraenatx.outputLabelsMode";

  const [outputLabelsMode, setOutputLabelsMode] =
    useState(() => {
      const savedMode = localStorage.getItem(
        OUTPUT_LABELS_MODE_KEY
      );

      return savedMode === "billing"
        ? "billing"
        : "map";
    });

  const [
    locationDialogOpen,
    setLocationDialogOpen,
  ] = useState(false);

  const [locationRow, setLocationRow] =
    useState(null);


  const [syncing, setSyncing] = useState(false);

  const rowsPerPage = ROWS_PER_PAGE;

  const actionsDisabled =
    loading ||
    resetting ||
    syncing ||
    savingAddress ||
    Boolean(deletingAddress) ||
    Boolean(changingOutput) ||
    Boolean(updatingDescr) ||
    Boolean(updatingLocation);



  const handleLocationClick = useCallback(
    (row) => {
      if (actionsDisabled) {
        return;
      }

      setLocationRow(row);
      setLocationDialogOpen(true);
    },
    [actionsDisabled]
  );



  const handleLocationDialogClose =
    useCallback(() => {
      if (updatingLocation) {
        return;
      }

      setLocationDialogOpen(false);
      setLocationRow(null);
    }, [updatingLocation]);












  const handleLocationSave = useCallback(
    async (location) => {
      if (
        !locationRow ||
        updatingLocation
      ) {
        return;
      }

      const nextLocation =
        String(location || "").trim();

      const currentLocation = String(
        locationRow.location || ""
      ).trim();

      if (nextLocation === currentLocation) {
        setLocationDialogOpen(false);
        setLocationRow(null);
        return;
      }

      const address =
        locationRow.address_hex;

      setUpdatingLocation(address);

      try {
        const res = await sendDataToServer({
          op: "updateMuraenaTXAddressLocation",
          address,
          location: nextLocation,
        });

        if (!res) {
          toast.error(
            t("muraenatx.errors.no_response")
          );
          return;
        }

        if (res.status !== "OK") {
          toast.error(
            res.status ||
              t(
                "muraenatx.location.update_failed"
              )
          );
          return;
        }

        setRows((currentRows) =>
          currentRows.map((currentRow) => {
            if (
              currentRow.address_hex !==
              address
            ) {
              return currentRow;
            }

            return {
              ...currentRow,
              location:
                res.location ?? nextLocation,
              updated_at:
                res.updated_at ??
                currentRow.updated_at,
            };
          })
        );

        toast.success(
          t(
            "muraenatx.location.update_success",
            {
              address,
            }
          )
        );

        setLocationDialogOpen(false);
        setLocationRow(null);
      } catch (err) {
        console.error(err);

        toast.error(
          t("muraenatx.location.update_failed")
        );
      } finally {
        setUpdatingLocation("");
      }
    },
    [
      locationRow,
      t,
      toast,
      updatingLocation,
    ]
  );





  const loadAddresses = useCallback(async () => {
    setLoading(true);

    try {
      const res = await sendDataToServer({
        op: "getMuraenaTXAddresses",
      });

      if (!res) {
        setRows([]);
        setDevice("");

        toast.error(
          t("muraenatx.errors.no_response")
        );

        return;
      }

      if (res.status !== "OK") {
        setRows([]);
        setDevice("");

        toast.error(
          res.status ||
            t("muraenatx.errors.load_failed")
        );

        return;
      }

      setRows(
        Array.isArray(res.rows)
          ? res.rows
          : []
      );

      setDevice(res.device || "");
    } catch (err) {
      console.error(err);

      setRows([]);
      setDevice("");

      toast.error(
        t("muraenatx.errors.load_failed")
      );
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handleSort = useCallback((field) => {
    setOrderBy((currentField) => {
      if (currentField === field) {
        setOrder((currentOrder) =>
          currentOrder === "asc"
            ? "desc"
            : "asc"
        );

        return currentField;
      }

      setOrder("asc");

      return field;
    });

    setPage(1);
  }, []);



  const handleOutputLabelsModeChange =
    useCallback((event) => {
      const nextMode = event.target.checked
        ? "billing"
        : "map";

      setOutputLabelsMode(nextMode);

      localStorage.setItem(
        OUTPUT_LABELS_MODE_KEY,
        nextMode
      );
    }, []);




   const handleSync = useCallback(async () => {
    if (!device || actionsDisabled) {
      return;
    }

    const confirmed = window.confirm(
      t("muraenatx.sync.confirm")
    );

    if (!confirmed) {
      return;
    }

    setSyncing(true);

    try {
      const res = await sendDataToServer({
        op: "syncMuraenaTX",
      });

      if (!res) {
        toast.error(
          t("muraenatx.errors.no_response")
        );
        return;
      }

      if (res.status !== "OK") {
        toast.error(
          res.status ||
            t("muraenatx.sync.failed")
        );
        return;
      }

      toast.success(
        t("muraenatx.sync.success", {
          count: Number(res.synced) || 0,
        })
      );

      await loadAddresses();
    } catch (err) {
      console.error(err);

      toast.error(
        t("muraenatx.sync.failed")
      );
    } finally {
      setSyncing(false);
    }
  }, [
    actionsDisabled,
    device,
    loadAddresses,
    t,
    toast,
  ]);
  
  




  const handleReset = useCallback(async () => {
    if (
      !device ||
      resetting ||
      actionsDisabled
    ) {
      return;
    }

    if (
      !window.confirm(
        t("muraenatx.reset.confirm")
      )
    ) {
      return;
    }

    setResetting(true);

    try {
      const res = await sendDataToServer({
        op: "resetMuraenaTX",
      });

      if (!res) {
        toast.error(
          t("muraenatx.errors.no_response")
        );

        return;
      }

      if (res.status !== "OK") {
        toast.error(
          res.status ||
            t("muraenatx.reset.failed")
        );

        return;
      }

      toast.success(
        t("muraenatx.reset.success")
      );

      setRows([]);
      setDevice("");

      await sleep(1500);
      await loadAddresses();
    } catch (err) {
      console.error(err);

      toast.error(
        t("muraenatx.reset.failed")
      );
    } finally {
      setResetting(false);
    }
  }, [
    actionsDisabled,
    device,
    loadAddresses,
    resetting,
    t,
    toast,
  ]);

  const handleOutputClick = useCallback(
    async (row, outputIndex) => {
      if (
        loading ||
        resetting ||
        savingAddress ||
        deletingAddress ||
        changingOutput ||
        updatingDescr
      ) {
        return;
      }

      const actionKey =
        `${row.address_hex}-${outputIndex}`;

      const maskBits = String(
        row.mask_binary || "00000000"
      )
        .padStart(8, "0")
        .slice(-8)
        .split("");

      const commandValue =
        Number.isInteger(row.command)
          ? row.command
          : Number.parseInt(
              row.command_hex || "00",
              16
            );

      const commandBits = commandValue
        .toString(2)
        .padStart(8, "0")
        .slice(-8)
        .split("");

      const maskEnabled =
        maskBits[outputIndex] === "1";

      const commandEnabled =
        commandBits[outputIndex] === "1";

      const nextState = getNextOutputState(
        maskEnabled,
        commandEnabled
      );

      maskBits[outputIndex] =
        nextState.maskEnabled
          ? "1"
          : "0";

      commandBits[outputIndex] =
        nextState.commandEnabled
          ? "1"
          : "0";

      const nextMask =
        bitsToByte(maskBits);

      const nextCommand =
        bitsToByte(commandBits);

      const nextCommandHex = nextCommand
        .toString(16)
        .toUpperCase()
        .padStart(2, "0");

      const nextMaskBinary = nextMask
        .toString(2)
        .padStart(8, "0");

      setChangingOutput(actionKey);

      try {
        const res = await sendDataToServer({
          op: "setMuraenaTXOutputState",
          address: row.address_hex,
          command: nextCommandHex,
          mask: nextMaskBinary,
        });

        if (!res) {
          toast.error(
            t("muraenatx.errors.no_response")
          );

          return;
        }

        if (res.status !== "OK") {
          toast.error(
            res.status ||
              t(
                "muraenatx.output.change_failed"
              )
          );

          return;
        }

        setRows((currentRows) =>
          currentRows.map((currentRow) => {
            if (
              currentRow.address_hex !==
              row.address_hex
            ) {
              return currentRow;
            }

            return {
              ...currentRow,
              command: nextCommand,
              command_hex: nextCommandHex,
              mask: nextMask,
              mask_binary: nextMaskBinary,
              updated_at:
                res.updated_at ??
                currentRow.updated_at,
            };
          })
        );
      } catch (err) {
        console.error(err);

        toast.error(
          t("muraenatx.output.change_failed")
        );
      } finally {
        setChangingOutput("");
      }
    },
    [
      changingOutput,
      deletingAddress,
      loading,
      resetting,
      savingAddress,
      t,
      toast,
      updatingDescr,
    ]
  );

  const handleAddOpen = useCallback(() => {
    if (actionsDisabled || !device) {
      return;
    }

    setEditingRow(null);
    setAddressDialogOpen(true);
  }, [actionsDisabled, device]);

  const handleEditOpen = useCallback(
    (row) => {
      if (actionsDisabled) {
        return;
      }

      setEditingRow(row);
      setAddressDialogOpen(true);
    },
    [actionsDisabled]
  );

  const handleAddressDialogClose =
    useCallback(() => {
      if (savingAddress) {
        return;
      }

      setAddressDialogOpen(false);
      setEditingRow(null);
    }, [savingAddress]);

  const handleAddressSave = useCallback(
    async (values) => {
      if (savingAddress) {
        return;
      }

      const editing =
        Boolean(values.old_address);

      setSavingAddress(true);

      try {
        const res = await sendDataToServer({
          op: editing
            ? "updateMuraenaTXAddress"
            : "saveMuraenaTXAddress",
          ...values,
        });

        if (!res) {
          toast.error(
            t("muraenatx.errors.no_response")
          );

          return;
        }

        if (res.status !== "OK") {
          toast.error(
            res.status ||
              t(
                "muraenatx.address_form.save_failed"
              )
          );

          return;
        }

        toast.success(
          editing
            ? t(
                "muraenatx.address_form.edit_success",
                {
                  address: values.address,
                }
              )
            : t(
                "muraenatx.address_form.add_success",
                {
                  address: values.address,
                }
              )
        );

        setAddressDialogOpen(false);
        setEditingRow(null);

        await loadAddresses();
      } catch (err) {
        console.error(err);

        toast.error(
          t(
            "muraenatx.address_form.save_failed"
          )
        );
      } finally {
        setSavingAddress(false);
      }
    },
    [
      loadAddresses,
      savingAddress,
      t,
      toast,
    ]
  );

  const handleDelete = useCallback(
    async (row) => {
      if (
        !row?.address_hex ||
        row.address === 0 ||
        actionsDisabled
      ) {
        return;
      }

      if (
        !window.confirm(
          t("muraenatx.delete.confirm", {
            address: row.address_hex,
          })
        )
      ) {
        return;
      }

      setDeletingAddress(row.address_hex);

      try {
        const res = await sendDataToServer({
          op: "deleteMuraenaTXAddress",
          address: row.address_hex,
        });

        if (!res) {
          toast.error(
            t("muraenatx.errors.no_response")
          );

          return;
        }

        if (res.status !== "OK") {
          toast.error(
            res.status ||
              t("muraenatx.delete.failed")
          );

          return;
        }

        toast.success(
          t("muraenatx.delete.success", {
            address: row.address_hex,
          })
        );

        await loadAddresses();
      } catch (err) {
        console.error(err);

        toast.error(
          t("muraenatx.delete.failed")
        );
      } finally {
        setDeletingAddress("");
      }
    },
    [
      actionsDisabled,
      loadAddresses,
      t,
      toast,
    ]
  );

  const handleDescrClick = useCallback(
    (row) => {
      if (actionsDisabled) {
        return;
      }

      setDescriptionRow(row);
      setDescriptionDialogOpen(true);
    },
    [actionsDisabled]
  );

  const handleDescriptionDialogClose =
    useCallback(() => {
      if (updatingDescr) {
        return;
      }

      setDescriptionDialogOpen(false);
      setDescriptionRow(null);
    }, [updatingDescr]);

  const handleDescriptionSave = useCallback(
    async (descr) => {
      if (
        !descriptionRow ||
        updatingDescr
      ) {
        return;
      }

      const nextDescr =
        String(descr || "").trim();

      const currentDescr = String(
        descriptionRow.descr || ""
      ).trim();

      if (nextDescr === currentDescr) {
        setDescriptionDialogOpen(false);
        setDescriptionRow(null);

        return;
      }

      const address =
        descriptionRow.address_hex;

      setUpdatingDescr(address);

      try {
        const res = await sendDataToServer({
          op: "updateMuraenaTXAddressDescr",
          address,
          descr: nextDescr,
        });

        if (!res) {
          toast.error(
            t("muraenatx.errors.no_response")
          );

          return;
        }

        if (res.status !== "OK") {
          toast.error(
            res.status ||
              t(
                "muraenatx.description.update_failed"
              )
          );

          return;
        }

        setRows((currentRows) =>
          currentRows.map((currentRow) => {
            if (
              currentRow.address_hex !==
              address
            ) {
              return currentRow;
            }

            return {
              ...currentRow,
              descr:
                res.descr ?? nextDescr,
              updated_at:
                res.updated_at ??
                currentRow.updated_at,
            };
          })
        );

        toast.success(
          t(
            "muraenatx.description.update_success",
            {
              address,
            }
          )
        );

        setDescriptionDialogOpen(false);
        setDescriptionRow(null);
      } catch (err) {
        console.error(err);

        toast.error(
          t(
            "muraenatx.description.update_failed"
          )
        );
      } finally {
        setUpdatingDescr("");
      }
    },
    [
      descriptionRow,
      t,
      toast,
      updatingDescr,
    ]
  );

  const filteredRows = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      const values = [
        row.address_hex,
        row.location,
        row.descr,
        row.map,
        row.billing,
      ];

      return values.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [rows, search]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort(
      (a, b) => {
        const result = compareRows(
          a,
          b,
          orderBy
        );

        return order === "asc"
          ? result
          : -result;
      }
    );
  }, [filteredRows, order, orderBy]);

  const pageCount = Math.max(
    1,
    Math.ceil(
      sortedRows.length / rowsPerPage
    )
  );

  const visibleRows = useMemo(() => {
    const start =
      (page - 1) * rowsPerPage;

    return sortedRows.slice(
      start,
      start + rowsPerPage
    );
  }, [
    page,
    rowsPerPage,
    sortedRows,
  ]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <MuraenaTXHeader
        search={search}
        onSearchChange={setSearch}
        filteredCount={filteredRows.length}
        totalCount={rows.length}
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
        device={device}
        loading={loading}
        resetting={resetting}
        syncing={syncing}
        outputLabelsMode={outputLabelsMode}
        onOutputLabelsModeChange={
          handleOutputLabelsModeChange
        }
        syncDisabled={actionsDisabled || !device}
        addDisabled={actionsDisabled || !device}
        onSync={handleSync}
        onAdd={handleAddOpen}
        onReset={handleReset}
      />

      <MuraenaTXTable
        rows={visibleRows}
        search={search}
        page={page}
        rowsPerPage={rowsPerPage}
        loading={loading}
        orderBy={orderBy}
        order={order}
        onSort={handleSort}
        changingOutput={changingOutput}
        updatingDescr={updatingDescr}
        updatingLocation={updatingLocation}
        deletingAddress={deletingAddress}
        actionsDisabled={actionsDisabled}
        outputLabelsMode={outputLabelsMode}
        onOutputClick={handleOutputClick}
        onDescriptionClick={handleDescrClick}
        onLocationClick={handleLocationClick}
        onEdit={handleEditOpen}
        onDelete={handleDelete}
      />

      <MuraenaTXAddressDialog
        open={addressDialogOpen}
        row={editingRow}
        loading={savingAddress}
        onClose={handleAddressDialogClose}
        onSave={handleAddressSave}
      />

      <MuraenaTXDescriptionDialog
        open={descriptionDialogOpen}
        row={descriptionRow}
        loading={Boolean(updatingDescr)}
        onClose={
          handleDescriptionDialogClose
        }
        onSave={handleDescriptionSave}
      />

      <MuraenaTXLocationDialog
        open={locationDialogOpen}
        row={locationRow}
        loading={Boolean(updatingLocation)}
        onClose={handleLocationDialogClose}
        onSave={handleLocationSave}
      />

    </Container>
  );
}