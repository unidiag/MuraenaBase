import {
  useEffect,
  useRef,
} from "react";

import {
  Box,
  Typography,
} from "@mui/material";

import L from "leaflet";

import {
  Tooltip as LeafletTooltip,
} from "react-leaflet";

import MuraenaTXOutputMap from
  "components/MuraenaTX/MuraenaTXOutputMap";

export default function AddressMarkerTooltip({
  address,
  pinned,
  changingOutput,
  disabled,
  onOutputClick,
}) {
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (!pinned) {
      return undefined;
    }

    const element =
      tooltipRef.current?.getElement?.();

    if (!element) {
      return undefined;
    }

    L.DomEvent.disableClickPropagation(
      element
    );

    L.DomEvent.disableScrollPropagation(
      element
    );

    return undefined;
  }, [pinned]);

  return (
    <LeafletTooltip
      ref={tooltipRef}
      key={pinned ? "pinned" : "hover"}
      direction="top"
      offset={[0, -24]}
      opacity={1}
      permanent={pinned}
      sticky={false}
      interactive={pinned}
      className={[
        "muraena-address-tooltip",
        pinned
          ? "muraena-address-tooltip-pinned"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Box
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
        onMouseUp={(event) => {
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.stopPropagation();
        }}
        onDoubleClick={(event) => {
          event.stopPropagation();
        }}
        sx={{
          minWidth: 220,
          maxWidth: 320,
          py: 0.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "baseline",
            gap: 1,
            minWidth: 0,
          }}
        >
          <Typography
            component="span"
            variant="subtitle2"
            sx={{
              flexShrink: 0,
              fontFamily: "monospace",
              fontWeight: 700,
            }}
          >
            {address.address_hex}
          </Typography>

          <Typography
            component="span"
            variant="body2"
            sx={{
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {address.location || "—"}
          </Typography>
        </Box>

        <Box sx={{ mt: 1 }}>
          <MuraenaTXOutputMap
            row={address}
            search=""
            labelsMode="map"
            changingOutput={changingOutput}
            disabled={
              disabled || !pinned
            }
            onOutputClick={onOutputClick}
            columns={4}
            showTooltips={false}
          />
        </Box>
      </Box>
    </LeafletTooltip>
  );
}