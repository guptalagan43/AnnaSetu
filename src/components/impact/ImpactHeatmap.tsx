"use client";

import { useEffect, useRef, useState } from "react";
import type { HotspotPoint } from "@/lib/impact/calculator";
import { Button } from "@/components/ui/Button";

interface ImpactHeatmapProps {
  hotspots: HotspotPoint[];
  center?: [number, number];
  zoom?: number;
}

export default function ImpactHeatmap({
  hotspots,
  center = [12.9716, 77.5946], // Default Bengaluru center
  zoom = 12,
}: ImpactHeatmapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heatLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  const [viewMode, setViewMode] = useState<"heat" | "pins">("heat");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapContainerRef.current) return;

    let isMounted = true;

    Promise.all([
      import("leaflet"),
      // @ts-expect-error leaflet.heat attaches to L
      import("leaflet.heat"),
    ])
      .then(([leafletModule]) => {
        if (!isMounted || !mapContainerRef.current) return;
        const L = leafletModule.default || leafletModule;

        // Ensure Leaflet CSS is present in document
        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link");
          link.id = "leaflet-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }

        // Initialize map instance if not present
        if (!mapInstanceRef.current && mapContainerRef.current) {
          const map = L.map(mapContainerRef.current, {
            center,
            zoom,
            zoomControl: true,
            scrollWheelZoom: false,
          });

          L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
            maxZoom: 19,
          }).addTo(map);

          mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;
        if (!map) return;

        // Clear previous layers
        if (heatLayerRef.current) {
          map.removeLayer(heatLayerRef.current);
          heatLayerRef.current = null;
        }
        markersRef.current.forEach((m) => map.removeLayer(m));
        markersRef.current = [];

        if (hotspots.length === 0) return;

        // Auto-fit bounds
        const bounds = L.latLngBounds(hotspots.map((h) => [h.lat, h.lng]));
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }

        if (viewMode === "heat") {
          // Heatmap layer using leaflet.heat
          try {
            const heatData = hotspots.map((h) => [h.lat, h.lng, h.intensity]);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const heat = (L as any).heatLayer(heatData, {
              radius: 40,
              blur: 25,
              maxZoom: 14,
              max: 1.0,
              gradient: {
                0.2: "#10B981", // Green (low)
                0.5: "#F59E0B", // Amber (mid)
                0.8: "#D42B2B", // Brand Red (high rescue activity)
                1.0: "#7F1D1D", // Deep Red (critical cluster)
              },
            });
            heat.addTo(map);
            heatLayerRef.current = heat;
          } catch (e) {
            console.warn("[ImpactHeatmap] leaflet.heat error, falling back to circle markers:", e);
          }
        }

        // Add pins or when heat mode is active also add small clickable markers
        hotspots.forEach((h) => {
          if (viewMode === "pins" || viewMode === "heat") {
            const color =
              h.intensity > 0.8 ? "#D42B2B" : h.intensity > 0.5 ? "#F59E0B" : "#10B981";

            const marker = L.circleMarker([h.lat, h.lng], {
              radius: viewMode === "pins" ? 14 : 7,
              fillColor: color,
              color: "#0A0A0A",
              weight: 2,
              opacity: 1,
              fillOpacity: viewMode === "pins" ? 0.9 : 0.4,
            });

            const popupContent = `
              <div style="font-family: 'Space Grotesk', sans-serif; min-width: 180px; padding: 4px;">
                <div style="font-weight: 700; font-size: 13px; text-transform: uppercase; color: #0A0A0A; border-bottom: 2px solid #0A0A0A; padding-bottom: 3px; margin-bottom: 6px;">
                  📍 ${h.location_name || "Food Rescue Hub"}
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px;">
                  <span style="color: #666;">Meals Rescued:</span>
                  <span style="font-weight: 700; color: #D42B2B;">${h.meals.toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px;">
                  <span style="color: #666;">Food Diverted:</span>
                  <span style="font-weight: 700; color: #0A0A0A;">${h.weight_kg} kg</span>
                </div>
              </div>
            `;

            marker.bindPopup(popupContent);
            marker.addTo(map);
            markersRef.current.push(marker);
          }
        });
      })
      .catch((err) => {
        console.error("[ImpactHeatmap] Failed to initialize map:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [isClient, hotspots, viewMode, center, zoom]);

  return (
    <div className="relative border-4 border-brand-black bg-brand-white shadow-brutal overflow-hidden">
      {/* View Mode Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex gap-2 bg-brand-white/95 p-1.5 border-2 border-brand-black shadow-brutal-sm">
        <Button
          type="button"
          size="sm"
          variant={viewMode === "heat" ? "primary" : "ghost"}
          onClick={() => setViewMode("heat")}
          className="text-xs py-1 px-3 uppercase font-mono"
        >
          🔥 Heatmap
        </Button>
        <Button
          type="button"
          size="sm"
          variant={viewMode === "pins" ? "primary" : "ghost"}
          onClick={() => setViewMode("pins")}
          className="text-xs py-1 px-3 uppercase font-mono"
        >
          📍 Hotspot Pins
        </Button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-brand-white/95 p-3 border-2 border-brand-black shadow-brutal-sm font-mono text-xs">
        <div className="font-bold text-brand-black uppercase mb-1">Rescue Density</div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-emerald-500 border border-brand-black inline-block" />
          <span className="text-brand-black">Moderate</span>
          <span className="w-3 h-3 bg-amber-500 border border-brand-black inline-block ml-2" />
          <span className="text-brand-black">High</span>
          <span className="w-3 h-3 bg-brand-red border border-brand-black inline-block ml-2" />
          <span className="text-brand-black font-bold">Intense</span>
        </div>
      </div>

      {/* Leaflet Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-[420px] sm:h-[480px] lg:h-[540px] z-0"
        style={{ background: "#F5F0E8" }}
      />
    </div>
  );
}
