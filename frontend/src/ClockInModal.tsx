import { useEffect, useRef } from "react";
import L from "leaflet";
import { distanceMeters } from "./utils";
import type { WorkplaceResponse } from "./types";

interface ClockInModalProps {
  workplace: WorkplaceResponse | null;
  /**
   * The worker's browser position. Null when geolocation was denied or
   * unavailable — the entry will then be flagged LOGGED_OUTSIDE by the backend.
   */
  position: { latitude: number; longitude: number } | null;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Confirmation popup shown ONLY when the worker appears to be outside the
 * workplace work area (or their location is unknown). Starting the timer
 * while inside the fence never opens this modal.
 *
 * Shows the workplace fence circle and the worker's position dot on a map so
 * they can see where the browser thinks they are, and lets them start the
 * timer anyway (the entry will be flagged as logged outside).
 */
export default function ClockInModal({
  workplace,
  position,
  onConfirm,
  onClose,
}: ClockInModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const wp = workplace?.location ?? null;
  const radius = workplace?.radiusDistance ?? 150;

  const distance =
    wp && position
      ? Math.round(
          distanceMeters(
            wp.latitude,
            wp.longitude,
            position.latitude,
            position.longitude
          )
        )
      : null;

  const reason = position
    ? `You are ${distance} m from ${
        workplace?.name ?? "the workplace"
      } — outside the work area.`
    : "Your location is unavailable — the entry will be flagged as logged outside.";

  // ── map: workplace fence + worker dot ──────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] = wp
      ? [wp.latitude, wp.longitude]
      : [54.6872, 25.2797]; // fallback: Vilnius
    const map = L.map(containerRef.current, { center, zoom: 16 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    let bounds: L.LatLngBounds | null = null;

    if (wp) {
      L.marker([wp.latitude, wp.longitude])
        .addTo(map)
        .bindTooltip(workplace?.name || "Workplace");
      const fence = L.circle([wp.latitude, wp.longitude], {
        radius,
        color: "#2f7d32",
        fillColor: "#2f7d32",
        fillOpacity: 0.12,
        weight: 2,
      }).addTo(map);
      bounds = fence.getBounds();
    }

    if (position) {
      // Just the dot — no accuracy circle.
      L.circleMarker([position.latitude, position.longitude], {
        radius: 7,
        color: "#1d4ed8",
        fillColor: "#1d4ed8",
        fillOpacity: 1,
        weight: 2,
      }).addTo(map);
      const meBounds = L.latLng(position.latitude, position.longitude).toBounds(
        60
      );
      bounds = bounds ? bounds.extend(meBounds) : meBounds;
    }

    if (bounds) {
      map.fitBounds(bounds.pad(0.35));
    }

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Outside the work area</h3>
        <p className="muted small" style={{ marginTop: -4 }}>
          {reason} You can still start the timer, but this time entry will be
          flagged as <strong>logged outside</strong>.
        </p>

        <div
          ref={containerRef}
          className="map-canvas"
          style={{ height: 260 }}
        />

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            Start timer anyway
          </button>
        </div>
      </div>
    </div>
  );
}
