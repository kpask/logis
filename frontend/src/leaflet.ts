// ============================================================
// Logis — shared Leaflet setup
// ============================================================
//
// Import Leaflet from this module (not directly from "leaflet") so every
// map gets a correctly configured default marker icon.
//
// Why: Leaflet detects the default icon's image path at runtime by
// inspecting a CSS background-image. Under Vite production builds the icon
// references inside leaflet.css are content-hashed, which defeats that
// detection — the resulting URL 404s (and an SPA server like nginx answers
// with index.html instead of an image), so markers are placed but render
// invisibly. Importing the images as assets and pinning the URLs fixes it
// in both dev and prod.

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2xUrl from "leaflet/dist/images/marker-icon-2x.png?url";
import markerIconUrl from "leaflet/dist/images/marker-icon.png?url";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png?url";

// Remove Leaflet's runtime icon-path detection (the part that breaks under
// bundlers) and pin the icon URLs to the bundled assets instead.
const iconDefaultProto = L.Icon.Default.prototype as unknown as {
  _getIconUrl?: unknown;
};
delete iconDefaultProto._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2xUrl,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
});

export default L;
