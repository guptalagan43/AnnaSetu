"use client";

import { useEffect, useRef } from "react";

// Leaflet must be imported dynamically (no SSR)
// This component is always loaded via next/dynamic with { ssr: false }

interface LocationPickerProps {
  lat?: number;
  lng?: number;
  onPick: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]; // India center
const DEFAULT_ZOOM = 5;
const PICKED_ZOOM = 15;

export default function LocationPicker({ lat, lng, onPick }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Dynamically import Leaflet
    import("leaflet").then((L) => {
      // Fix default icon paths (Leaflet issue with bundlers)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const center: [number, number] = lat && lng ? [lat, lng] : DEFAULT_CENTER;
      const zoom = lat && lng ? PICKED_ZOOM : DEFAULT_ZOOM;

      const map = L.map(mapRef.current!, { center, zoom });
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add existing marker if coords already set
      if (lat && lng) {
        markerRef.current = L.marker([lat, lng]).addTo(map);
      }

      // Click handler
      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;

        if (markerRef.current) {
          markerRef.current.setLatLng([clickLat, clickLng]);
        } else {
          markerRef.current = L.marker([clickLat, clickLng]).addTo(map);
        }

        onPick(parseFloat(clickLat.toFixed(6)), parseFloat(clickLng.toFixed(6)));
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker if parent passes new coords (e.g., on draft restore)
  useEffect(() => {
    if (!mapInstanceRef.current || !lat || !lng) return;
    import("leaflet").then((L) => {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current);
      }
      mapInstanceRef.current.setView([lat, lng], PICKED_ZOOM);
    });
  }, [lat, lng]);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div
        ref={mapRef}
        className="w-full h-72 border-2 border-brand-black"
        style={{ zIndex: 0 }}
        aria-label="Map — click to set pickup location"
        role="application"
      />
    </>
  );
}
