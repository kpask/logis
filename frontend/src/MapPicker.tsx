import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Location } from "./types";

interface MapPickerProps {
  value: Location | null;
  onChange: (location: Location | null) => void;
  /**
   * Optional geofence radius in meters. When provided (and >= 0), a circle
   * of that size is drawn around the marker — used to preview the workplace
   * clock-in fence.
   */
  radiusMeters?: number | null;
}

const DEFAULT_CENTER: [number, number] = [54.6872, 25.2797]; // Vilnius
const DEFAULT_ZOOM = 6;

/**
 * A click-to-pick Leaflet map using OpenStreetMap tiles and the free
 * Nominatim geocoding service — no API key required.
 *
 * - Click anywhere on the map to place the marker.
 * - Drag the marker to move it.
 * - Search for an address to jump to it.
 * - Reverse-geocodes the picked point into city/street/address.
 */
export default function MapPicker({
  value,
  onChange,
  radiusMeters,
}: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const fenceRef = useRef<L.Circle | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [displayName, setDisplayName] = useState("");

  // Initialize the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      placeMarker(e.latlng.lat, e.latlng.lng, true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      fenceRef.current = null;
    };
  }, []);

  // Draw/update the fence circle around the marker.
  const drawFence = useCallback(() => {
    const map = mapRef.current;
    if (
      !map ||
      !markerRef.current ||
      radiusMeters == null ||
      radiusMeters < 0
    ) {
      if (fenceRef.current) {
        fenceRef.current.remove();
        fenceRef.current = null;
      }
      return;
    }
    const pos = markerRef.current.getLatLng();
    if (fenceRef.current) {
      fenceRef.current.setLatLng(pos);
      fenceRef.current.setRadius(radiusMeters);
    } else {
      fenceRef.current = L.circle(pos, {
        radius: radiusMeters,
        color: "#2f7d32",
        fillColor: "#2f7d32",
        fillOpacity: 0.12,
        weight: 2,
      }).addTo(map);
    }
  }, [radiusMeters]);

  // Sync the fence circle whenever the radius changes.
  useEffect(() => {
    drawFence();
  }, [drawFence, value?.latitude, value?.longitude]);

  // Sync the marker whenever the parent passes new coordinates.
  useEffect(() => {
    if (
      !mapRef.current ||
      !value ||
      !Number.isFinite(value.latitude) ||
      !Number.isFinite(value.longitude)
    ) {
      return;
    }
    placeMarker(value.latitude, value.longitude, false);
    drawFence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.latitude, value?.longitude]);

  function placeMarker(lat: number, lng: number, reverse: boolean) {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
      markerRef.current.on("dragend", () => {
        const pos = markerRef.current?.getLatLng();
        if (pos) {
          placeMarker(pos.lat, pos.lng, true);
        }
      });
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }

    map.panTo([lat, lng]);

    if (reverse) {
      void reverseGeocode(lat, lng);
    } else {
      onChange(
        value
          ? { ...value, latitude: lat, longitude: lng }
          : { latitude: lat, longitude: lng, city: "", street: "", address: "" }
      );
    }
  }

  async function reverseGeocode(lat: number, lng: number) {
    setBusy(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      const address = data?.address || {};
      const city =
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.county ||
        "";
      const road = address.road || "";
      const houseNumber = address.house_number || "";
      setDisplayName(data?.display_name || "");

      onChange({
        latitude: lat,
        longitude: lng,
        city,
        street: road,
        address: houseNumber
          ? `${road ? road + ", " : ""}${houseNumber}`
          : road,
      });
    } catch {
      setDisplayName("");
      onChange({
        latitude: lat,
        longitude: lng,
        city: "",
        street: "",
        address: "",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim() || !mapRef.current) return;

    setBusy(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}&limit=1`
      );
      const results = (await res.json()) as Array<{ lat: string; lon: string }>;
      const first = results?.[0];
      if (first) {
        placeMarker(parseFloat(first.lat), parseFloat(first.lon), true);
      }
    } catch {
      // ignore search errors
    } finally {
      setBusy(false);
    }
  }

  const hasCoords =
    value &&
    Number.isFinite(value.latitude) &&
    Number.isFinite(value.longitude);

  return (
    <div className="map-picker">
      <form onSubmit={handleSearch} className="map-search">
        <input
          type="text"
          className="form-input"
          placeholder="Search address…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={busy}
        />
        <button
          type="submit"
          className="btn btn-secondary"
          disabled={busy || !searchQuery.trim()}
        >
          {busy ? "Working…" : "Search"}
        </button>
      </form>

      <div ref={containerRef} className="map-canvas" />

      {busy && <div className="map-status">Looking up location…</div>}

      {hasCoords && (
        <div className="map-coords">
          Lat: {value.latitude.toFixed(5)}, Lng: {value.longitude.toFixed(5)}
          {displayName || value.city || value.address
            ? ` · ${
                displayName ||
                [value.city, value.address].filter(Boolean).join(", ")
              }`
            : ""}
        </div>
      )}
    </div>
  );
}
