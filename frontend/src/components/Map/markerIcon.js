import L from "leaflet";

const addressMarkerIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 24px;
      height: 24px;
      border-radius: 50% 50% 50% 0;
      background: #d32f2f;
      border: 2px solid #ffffff;
      box-shadow: 0 1px 5px rgba(0, 0, 0, 0.55);
      transform: rotate(-45deg);
    ">
      <div style="
        width: 8px;
        height: 8px;
        margin: 6px;
        border-radius: 50%;
        background: #ffffff;
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

export default addressMarkerIcon;