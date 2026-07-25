import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Box,
  CircularProgress,
  Container,
} from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import AddIcon from "@mui/icons-material/Add";
import {
  MapContainer,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import { useTranslation } from "react-i18next";

import TitleBlock from "components/TitleBlock";
import { sendDataToServer } from "utils/functions";
import { useToast } from "utils/useToast";

import "leaflet/dist/leaflet.css";

const DEFAULT_MAP_POSITION = {
  latitude: 53.89372,
  longitude: 27.56521,
  zoom: 13,
};

function parseMapPosition(value) {
  if (typeof value !== "string") {
    return DEFAULT_MAP_POSITION;
  }

  const parts = value.split(":");

  if (parts.length !== 3) {
    return DEFAULT_MAP_POSITION;
  }

  const latitude = Number.parseFloat(parts[0]);
  const longitude = Number.parseFloat(parts[1]);
  const zoom = Number.parseInt(parts[2], 10);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    !Number.isInteger(zoom) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    zoom < 1 ||
    zoom > 19
  ) {
    return DEFAULT_MAP_POSITION;
  }

  return {
    latitude,
    longitude,
    zoom,
  };
}







function MapPositionSaver({ onChange }) {
  const initializedRef = useRef(false);
  const timeoutRef = useRef(null);

  const map = useMapEvents({
    moveend() {
      if (!initializedRef.current) {
        initializedRef.current = true;
        return;
      }

      const center = map.getCenter();
      const zoom = map.getZoom();

      window.clearTimeout(timeoutRef.current);

      timeoutRef.current = window.setTimeout(() => {
        onChange({
          latitude: center.lat,
          longitude: center.lng,
          zoom,
        });
      }, 500);
    },
  });

  useEffect(() => {
    return () => {
      window.clearTimeout(timeoutRef.current);
    };
  }, []);

  return null;
}














export default function MapPage() {
  const { t } = useTranslation();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [mapPosition, setMapPosition] = useState(
    DEFAULT_MAP_POSITION
  );

  useEffect(() => {
    let active = true;

    const loadMapSettings = async () => {
      setLoading(true);

      try {
        const response = await sendDataToServer({
          op: "getMapSettings",
        });

        if (!active) {
          return;
        }

        if (!response) {
          throw new Error("No response");
        }

        if (
          response.status &&
          response.status !== "OK"
        ) {
          throw new Error(response.status);
        }

        setMapPosition(
          parseMapPosition(response.mappos)
        );
      } catch (error) {
        console.error(
          "Failed to load map settings:",
          error
        );

        toast.error(t("map.errors.load_failed"));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadMapSettings();

    return () => {
      active = false;
    };
  }, [t, toast]);

  const center = useMemo(
    () => [
      mapPosition.latitude,
      mapPosition.longitude,
    ],
    [
      mapPosition.latitude,
      mapPosition.longitude,
    ]
  );







    const saveMapPosition = async ({
        latitude,
        longitude,
        zoom,
    }) => {
    const mappos = [
        latitude.toFixed(5),
        longitude.toFixed(5),
        zoom,
    ].join(":");

    try {
        const response = await sendDataToServer({
        op: "saveMapSettings",
        mappos,
        });

        if (!response) {
        throw new Error("No response");
        }

        if (
        response.status &&
        response.status !== "OK"
        ) {
        throw new Error(response.status);
        }

        setMapPosition({
        latitude,
        longitude,
        zoom,
        });
    } catch (error) {
        console.error(
        "Failed to save map position:",
        error
        );

        toast.error(t("map.errors.save_failed"));
    }
    };














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
            backgroundColor: "background.paper",
        }}
        >
        {loading ? (
            <Box
            sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
            >
            <CircularProgress />
            </Box>
        ) : (
            <>
            <MapContainer
                center={center}
                zoom={mapPosition.zoom}
                scrollWheelZoom
                style={{
                width: "100%",
                height: "100%",
                }}
            >
                <TileLayer
                attribution={
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
                />

                <MapPositionSaver
                onChange={saveMapPosition}
                />
            </MapContainer>

            <AddIcon
                sx={{
                position: "absolute",
                left: "50%",
                top: "50%",
                zIndex: 1000,
                width: 40,
                height: 40,
                color: "error.main",
                pointerEvents: "none",
                transform: "translate(-50%, -50%)",
                filter:
                    "drop-shadow(0 0 2px rgba(255, 255, 255, 1))",
                }}
            />
            </>
        )}
        </Box>





        </Container>

  );
}