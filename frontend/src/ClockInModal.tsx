import { useEffect, useRef } from "react";
import L from "./leaflet";
import { distanceMeters } from "./utils";
import type { WorkplaceResponse } from "./types";
import { useI18n } from "./i18n";

interface ClockInModalProps {
  workplace: WorkplaceResponse | null;
  position: { latitude: number; longitude: number } | null;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ClockInModal({
  workplace,
  position,
  onConfirm,
  onClose,
}: ClockInModalProps) {
  const { t } = useI18n();
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
    ? t("clockInReasonOutside", {
        distance: distance ?? 0,
        workplace: workplace?.name ?? t("clockInWorkplaceFallback"),
      })
    : t("clockInReasonUnavailable");

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] = wp
      ? [wp.latitude, wp.longitude]
      : [54.6872, 25.2797];
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
        .bindTooltip(workplace?.name || t("projectWorkplaceFallback"));
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
        <h3 className="modal-title">{t("clockInTitle")}</h3>
        <p className="muted small" style={{ marginTop: -4 }}>
          {reason} {t("clockInDesc")}
        </p>

        <div
          ref={containerRef}
          className="map-canvas"
          style={{ height: 260 }}
        />

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t("cancel")}
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            {t("clockInConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
