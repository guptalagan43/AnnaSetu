"use client";

import { useEffect, useRef } from "react";
import { RouteStop } from "@/lib/routing/osrm";

interface RouteMapProps {
  stops: RouteStop[];
  startLocation: { latitude: number; longitude: number };
  routeGeometry?: [number, number][];
  onSelectStop?: (stop: RouteStop) => void;
  selectedStopId?: string | null;
}

export default function RouteMap({
  stops,
  startLocation,
  routeGeometry,
  onSelectStop,
  selectedStopId,
}: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polylineRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    // Dynamically import Leaflet to prevent SSR window reference errors
    import("leaflet").then((L) => {
      // Initialize map once
      if (!mapInstanceRef.current && mapRef.current) {
        const map = L.map(mapRef.current, {
          center: [startLocation.latitude, startLocation.longitude],
          zoom: 13,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      if (!map) return;

      // Clear existing markers and polylines
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }

      const bounds = L.latLngBounds([
        [startLocation.latitude, startLocation.longitude],
      ]);

      // 1. Add Driver Current Location Marker
      const driverIcon = L.divIcon({
        className: "driver-position-pin",
        html: `<div style="background-color: #2563eb; color: #ffffff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 3px solid #000000; box-shadow: 3px 3px 0px #000000;">🚗</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18],
      });

      const driverMarker = L.marker(
        [startLocation.latitude, startLocation.longitude],
        { icon: driverIcon }
      )
        .addTo(map)
        .bindPopup(
          `<div style="font-family: monospace; font-size: 12px; font-weight: bold; color: #000000;">
            <p style="margin: 0 0 4px 0; color: #2563eb; text-transform: uppercase;">▶ CURRENT POSITION</p>
            <p style="margin: 0;">Driver Starting Point</p>
          </div>`
        );
      markersRef.current.push(driverMarker);

      // 2. Add Stop Markers
      stops.forEach((stop, idx) => {
        const isSelected = selectedStopId === stop.id;
        const isPickup = stop.type === "pickup";
        const bgColor = isPickup ? "#dc2626" : "#000000";
        const borderColor = isSelected ? "#f59e0b" : "#000000";
        const stopNum = stop.stop_number ?? idx + 1;

        const stopIcon = L.divIcon({
          className: `route-stop-pin-${stop.id}`,
          html: `<div style="background-color: ${bgColor}; color: #ffffff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-family: monospace; font-size: 14px; border: 3px solid ${borderColor}; box-shadow: 3px 3px 0px #000000;">${stopNum}</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
          popupAnchor: [0, -18],
        });

        const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          stop.address
        )}`;

        const popupContent = `
          <div style="font-family: monospace; font-size: 12px; color: #000000; min-width: 180px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-weight: 900; color: ${bgColor}; text-transform: uppercase;">
                ${isPickup ? "📦 PICKUP #" + stopNum : "🏠 DELIVERY #" + stopNum}
              </span>
              ${
                stop.ers_score
                  ? `<span style="background: #000; color: #fff; padding: 2px 4px; font-size: 10px; font-weight: bold;">ERS ${stop.ers_score}</span>`
                  : ""
              }
            </div>
            <p style="font-weight: bold; margin: 0 0 4px 0;">${stop.name}</p>
            <p style="margin: 0 0 6px 0; color: #4b5563; font-size: 11px;">${stop.address}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 11px;">
              <span>ETA: <strong>${stop.eta_time || `${stop.eta_minutes} min`}</strong></span>
              <span>Dist: <strong>${stop.distance_from_previous_km ?? 0} km</strong></span>
            </div>
            <a href="${navUrl}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; background: #000000; color: #ffffff; padding: 6px 8px; text-decoration: none; font-weight: bold; border: 2px solid #000000;">
              NAVIGATE 🗺️
            </a>
          </div>
        `;

        const marker = L.marker([stop.latitude, stop.longitude], {
          icon: stopIcon,
        })
          .addTo(map)
          .bindPopup(popupContent);

        marker.on("click", () => {
          if (onSelectStop) onSelectStop(stop);
        });

        markersRef.current.push(marker);
        bounds.extend([stop.latitude, stop.longitude]);
      });

      // 3. Render Route Polyline
      const polylinePoints: [number, number][] =
        routeGeometry && routeGeometry.length > 1
          ? routeGeometry
          : [
              [startLocation.latitude, startLocation.longitude],
              ...stops.map((s) => [s.latitude, s.longitude] as [number, number]),
            ];

      if (polylinePoints.length > 1) {
        polylineRef.current = L.polyline(polylinePoints, {
          color: "#000000",
          weight: 4,
          opacity: 0.85,
          dashArray: "8, 6",
        }).addTo(map);

        bounds.extend(polylinePoints);
      }

      // Auto-fit to include start and all stops with comfortable padding
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    });
  }, [stops, startLocation, routeGeometry, selectedStopId, onSelectStop]);

  return (
    <div className="relative w-full h-full min-h-[450px] border-4 border-brand-black shadow-brutal overflow-hidden bg-brand-cream/30">
      <div ref={mapRef} className="w-full h-full min-h-[450px] z-0" />
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
    </div>
  );
}
