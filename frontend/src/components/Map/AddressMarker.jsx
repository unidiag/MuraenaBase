import { useMemo } from "react";

import { Marker } from "react-leaflet";

import AddressMarkerTooltip from
  "./AddressMarkerTooltip";

import addressMarkerIcon from "./markerIcon";

export default function AddressMarker({
  address,
  selected,
  changingOutput,
  actionsDisabled,
  onSelect,
  onOutputClick,
  onPositionChange,
}) {
  const position = useMemo(
    () => [
      address.latitude,
      address.longitude,
    ],
    [
      address.latitude,
      address.longitude,
    ]
  );


  




  const eventHandlers = useMemo(
    () => ({
      click(event) {
        const target =
          event.originalEvent?.target;

        if (
          target instanceof Element &&
          target.closest(
            ".muraena-address-tooltip-pinned"
          )
        ) {
          return;
        }

        event.originalEvent?.stopPropagation?.();

        onSelect(address.id);
      },

      dragstart() {
        onSelect(address.id);
      },

      dragend(event) {
        const latLng =
          event.target.getLatLng();

        onPositionChange(
          address.id,
          latLng.lat,
          latLng.lng
        );
      },
    }),
    [
      address.id,
      onPositionChange,
      onSelect,
    ]
  );





  

  return (
    <Marker
      position={position}
      icon={addressMarkerIcon}
      draggable={!actionsDisabled}
      eventHandlers={eventHandlers}
    >
      <AddressMarkerTooltip
        address={address}
        pinned={selected}
        changingOutput={changingOutput}
        disabled={actionsDisabled}
        onOutputClick={onOutputClick}
      />
    </Marker>
  );
}