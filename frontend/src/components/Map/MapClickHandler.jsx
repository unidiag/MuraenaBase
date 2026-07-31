import { useMapEvents } from "react-leaflet";

export default function MapClickHandler({
  onMapClick,
}) {
  useMapEvents({
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

      onMapClick();
    },
  });

  return null;
}