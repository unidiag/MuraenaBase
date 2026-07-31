import { DEFAULT_MAP_POSITION } from "./constants";

export function parseMapPosition(value) {
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

export function parseLatLng(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }

  const parts = value.split(":");

  if (parts.length !== 2) {
    return fallback;
  }

  const latitude = Number.parseFloat(parts[0]);
  const longitude = Number.parseFloat(parts[1]);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return fallback;
  }

  return [latitude, longitude];
}

export function formatLatLng(latitude, longitude) {
  return [
    latitude.toFixed(5),
    longitude.toFixed(5),
  ].join(":");
}

export function formatMapPosition({
  latitude,
  longitude,
  zoom,
}) {
  return [
    latitude.toFixed(5),
    longitude.toFixed(5),
    zoom,
  ].join(":");
}

export function prepareMapAddresses(
  rows,
  mapPosition
) {
  const fallback = [
    mapPosition.latitude,
    mapPosition.longitude,
  ];

  return (rows || [])
    .filter((address) => address.id)
    .map((address) => {
      const [latitude, longitude] = parseLatLng(
        address.latlng,
        fallback
      );

      return {
        ...address,
        latitude,
        longitude,
      };
    });
}

export function getAddressOutputs(address) {
  const outputs = String(
    address.map || "0:0:0:0:0:0:0:0"
  )
    .split(":")
    .slice(0, 8);

  while (outputs.length < 8) {
    outputs.push("0");
  }

  const maskValue = Number.isInteger(address.mask)
    ? address.mask
    : Number.parseInt(
        address.mask_binary || "0",
        2
      );

  const commandValue = Number.isInteger(
    address.command
  )
    ? address.command
    : Number.parseInt(
        address.command_hex || "00",
        16
      );

  return outputs.map((item, outputIndex) => {
    const bit = 1 << (7 - outputIndex);

    const maskEnabled =
      (maskValue & bit) !== 0;

    const commandEnabled =
      (commandValue & bit) !== 0;

    let status = "disabled";
    let color = "error";

    if (commandEnabled) {
      status = "warning";
      color = "warning";
    } else if (maskEnabled) {
      status = "enabled";
      color = "success";
    }

    return {
      index: outputIndex,
      value: item.trim() || "0",
      status,
      color,
    };
  });
}