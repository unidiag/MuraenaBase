import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import "components/Map/map.css";

import {
  Box,
  Container,
} from "@mui/material";

import MapIcon from "@mui/icons-material/Map";

import { useTranslation } from "react-i18next";

import TitleBlock from "components/TitleBlock";

import MapCanvas from "components/Map/MapCanvas";
import MapLoader from "components/Map/MapLoader";

import {
  DEFAULT_MAP_POSITION,
} from "components/Map/constants";

import {
  formatLatLng,
  formatMapPosition,
  parseMapPosition,
  prepareMapAddresses,
} from "components/Map/utils";

import {
  bitsToByte,
  getNextOutputState,
} from "components/MuraenaTX/muraenaTXUtils";

import { sendDataToServer } from "utils/functions";
import { useToast } from "utils/useToast";

import "leaflet/dist/leaflet.css";

export default function MapPage() {
  const { t } = useTranslation();
  const toast = useToast();

  const [loading, setLoading] = useState(true);

  const [mapPosition, setMapPosition] = useState(
    DEFAULT_MAP_POSITION
  );

  const [addresses, setAddresses] = useState([]);

  const [
    selectedAddressID,
    setSelectedAddressID,
  ] = useState(null);

  const [
    changingOutput,
    setChangingOutput,
  ] = useState("");

  const [demoMode, setDemoMode] =
    useState(false);

  useEffect(() => {
    let active = true;

    async function loadMapData() {
      setLoading(true);

      try {
        const [
          settingsResponse,
          addressesResponse,
        ] = await Promise.all([
          sendDataToServer({
            op: "getMapSettings",
          }),

          sendDataToServer({
            op: "getMuraenaTXAddresses",
          }),
        ]);

        if (!active) {
          return;
        }

        if (
          !settingsResponse ||
          (
            settingsResponse.status &&
            settingsResponse.status !== "OK"
          )
        ) {
          throw new Error(
            settingsResponse?.status ||
              "No settings response"
          );
        }

        if (
          !addressesResponse ||
          (
            addressesResponse.status &&
            addressesResponse.status !== "OK"
          )
        ) {
          throw new Error(
            addressesResponse?.status ||
              "No addresses response"
          );
        }

        const nextMapPosition =
          parseMapPosition(
            settingsResponse.mappos
          );

        const nextAddresses =
          prepareMapAddresses(
            addressesResponse.rows,
            nextMapPosition
          );

        setMapPosition(nextMapPosition);
        setAddresses(nextAddresses);

        setDemoMode(
          Boolean(addressesResponse.demo)
        );
      } catch (error) {
        console.error(
          "Failed to load map data:",
          error
        );

        toast.error(
          t("map.errors.load_failed")
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMapData();

    return () => {
      active = false;
    };
  }, [t, toast]);




const handleAddressSelect = useCallback(
  (id) => {
    setSelectedAddressID(id);
  },
  []
);



  const saveMapPosition = useCallback(
    async (nextPosition) => {
      try {
        const response =
          await sendDataToServer({
            op: "saveMapSettings",

            mappos:
              formatMapPosition(
                nextPosition
              ),
          });

        if (
          !response ||
          (
            response.status &&
            response.status !== "OK"
          )
        ) {
          throw new Error(
            response?.status ||
              "No response"
          );
        }

        setMapPosition(nextPosition);
      } catch (error) {
        console.error(
          "Failed to save map position:",
          error
        );

        toast.error(
          t("map.errors.save_failed")
        );
      }
    },
    [t, toast]
  );

  const saveAddressPosition = useCallback(
    async (id, latitude, longitude) => {
      if (demoMode) {
        return;
      }

      const previousAddress =
        addresses.find(
          (address) =>
            address.id === id
        );

      setAddresses((current) =>
        current.map((address) =>
          address.id === id
            ? {
                ...address,
                latitude,
                longitude,
              }
            : address
        )
      );

      try {
        const response =
          await sendDataToServer({
            op: "updateMapAddressLatLng",
            id,

            latlng: formatLatLng(
              latitude,
              longitude
            ),
          });

        if (
          !response ||
          (
            response.status &&
            response.status !== "OK"
          )
        ) {
          throw new Error(
            response?.status ||
              "No response"
          );
        }
      } catch (error) {
        console.error(
          "Failed to save address position:",
          error
        );

        if (previousAddress) {
          setAddresses((current) =>
            current.map((address) =>
              address.id === id
                ? previousAddress
                : address
            )
          );
        }

        toast.error(
          t("map.errors.save_failed")
        );
      }
    },
    [
      addresses,
      demoMode,
      t,
      toast,
    ]
  );

  const handleOutputClick = useCallback(
    async (row, outputIndex) => {
      if (
        changingOutput ||
        demoMode
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

      const nextState =
        getNextOutputState(
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

      const nextCommandHex =
        nextCommand
          .toString(16)
          .toUpperCase()
          .padStart(2, "0");

      const nextMaskBinary =
        nextMask
          .toString(2)
          .padStart(8, "0");

      setChangingOutput(actionKey);

      try {
        const response =
          await sendDataToServer({
            op: "setMuraenaTXOutputState",

            address:
              row.address_hex,

            command:
              nextCommandHex,

            mask:
              nextMaskBinary,
          });

        if (
          !response ||
          (
            response.status &&
            response.status !== "OK"
          )
        ) {
          throw new Error(
            response?.status ||
              "No response"
          );
        }

        setAddresses((current) =>
          current.map((address) => {
            if (
              address.address_hex !==
              row.address_hex
            ) {
              return address;
            }

            return {
              ...address,

              command:
                nextCommand,

              command_hex:
                nextCommandHex,

              mask:
                nextMask,

              mask_binary:
                nextMaskBinary,

              updated_at:
                response.updated_at ??
                address.updated_at,
            };
          })
        );
      } catch (error) {
        console.error(
          "Failed to change output:",
          error
        );

        toast.error(
          t(
            "muraenatx.output.change_failed"
          )
        );
      } finally {
        setChangingOutput("");
      }
    },
    [
      changingOutput,
      demoMode,
      t,
      toast,
    ]
  );

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        display: "flex",
        flexDirection: "column",

        height: {
          xs: "calc(100dvh - 90px)",
          sm: "calc(100dvh - 110px)",
        },

        px: {
          xs: 1,
          sm: 2,
        },

        overflow: "hidden",
      }}
    >
      <TitleBlock>
        <MapIcon />
        {t("map.title")}
      </TitleBlock>

      <Box
        sx={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          mb: 2,
          overflow: "hidden",

          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,

          backgroundColor:
            "background.paper",
        }}
      >
        {loading ? (
          <MapLoader />
        ) : (
          <MapCanvas
            mapPosition={
              mapPosition
            }

            addresses={
              addresses
            }

            selectedAddressID={
              selectedAddressID
            }

            changingOutput={
              changingOutput
            }

            actionsDisabled={
              Boolean(changingOutput) ||
              demoMode
            }

            onAddressSelect={
              handleAddressSelect
            }

            onOutputClick={
              handleOutputClick
            }

            onMapPositionChange={
              saveMapPosition
            }

            onAddressPositionChange={
              saveAddressPosition
            }
          />
        )}
      </Box>
    </Container>
  );
}