import {
  useEffect,
  useRef,
} from "react";

import { useMapEvents } from "react-leaflet";

import { MAP_SAVE_DELAY } from "./constants";

export default function MapPositionSaver({
  onChange,
}) {
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

      timeoutRef.current = window.setTimeout(
        () => {
          onChange({
            latitude: center.lat,
            longitude: center.lng,
            zoom,
          });
        },
        MAP_SAVE_DELAY
      );
    },
  });

  useEffect(() => {
    return () => {
      window.clearTimeout(timeoutRef.current);
    };
  }, []);

  return null;
}