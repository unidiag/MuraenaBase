import { useMemo } from "react";

import {
  MapContainer,
  TileLayer,
} from "react-leaflet";

import AddressMarker from "./AddressMarker";
import MapClickHandler from "./MapClickHandler";
import MapPositionSaver from "./MapPositionSaver";

import {
  MAP_TILE_ATTRIBUTION,
  MAP_TILE_URL,
} from "./constants";

export default function MapCanvas({
  mapPosition,
  addresses,
  selectedAddressID,
  changingOutput,
  actionsDisabled,
  onAddressSelect,
  onOutputClick,
  onMapPositionChange,
  onAddressPositionChange,
}) {
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

  return (
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
        attribution={MAP_TILE_ATTRIBUTION}
        url={MAP_TILE_URL}
        maxZoom={19}
      />

      <MapPositionSaver
        onChange={onMapPositionChange}
      />

      <MapClickHandler
        onMapClick={() =>
          onAddressSelect(null)
        }
      />

      {addresses.map((address) => (
        <AddressMarker
          key={address.id}
          address={address}
          selected={
            selectedAddressID === address.id
          }
          changingOutput={changingOutput}
          actionsDisabled={actionsDisabled}
          onSelect={onAddressSelect}
          onOutputClick={onOutputClick}
          onPositionChange={
            onAddressPositionChange
          }
        />
      ))}
    </MapContainer>
  );
}