/**
 * OSRM (Open Source Routing Machine) Client & Multi-Stop Route Optimizer
 * Implements road distance matrix, nearest-neighbor stop sequencing with
 * pickup-before-delivery constraints (FR-ROUTE-04) and ERS urgency weighting (FR-ROUTE-05).
 */
import { haversineDistanceKm } from "../matching/engine";

export interface RouteStop {
  id: string; // unique stop or listing identifier
  assignment_id?: string;
  type: "pickup" | "delivery";
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  quantity_kg?: number;
  ers_score?: number;
  food_category?: string;
  associated_pickup_id?: string; // For delivery, the pickup id that must precede it
  status?: string;
  donor_pin?: string;
  stop_number?: number;
  eta_minutes?: number;
  eta_time?: string;
  distance_from_previous_km?: number;
}

export interface OptimizedRouteResult {
  stops: RouteStop[];
  total_distance_km: number;
  total_duration_minutes: number;
  route_geometry: [number, number][]; // [lat, lng] pairs for Leaflet polyline
  fallback_used: boolean;
}

const CITY_AVG_SPEED_KMH = 25; // Standard urban speed in Indian metros
const ROAD_DETOUR_FACTOR = 1.35; // Urban road distance winding multiplier over Haversine
const STOP_HANDOVER_MINUTES = 10; // Average physical loading / handover time per stop

/**
 * Fetches real road distance and duration matrix between given coordinates using OSRM Table service.
 * Coordinates format: [longitude, latitude] pairs.
 * Falls back to Haversine with urban winding factor if OSRM is unreachable.
 */
export async function getDistanceMatrix(
  coords: { latitude: number; longitude: number }[]
): Promise<{ distances: number[][]; durations: number[][]; fallback: boolean }> {
  if (coords.length === 0) {
    return { distances: [], durations: [], fallback: false };
  }

  // Build OSRM query string: lng,lat;lng,lat;...
  const coordString = coords.map((c) => `${c.longitude},${c.latitude}`).join(";");
  const osrmUrl = `https://router.project-osrm.org/table/v1/driving/${coordString}?annotations=duration,distance`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second timeout

    const res = await fetch(osrmUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "AnnaSetu-FoodRescue/1.0" },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === "Ok" && data.distances && data.durations) {
        // OSRM returns distances in meters, durations in seconds
        const distancesKm = data.distances.map((row: number[]) =>
          row.map((meters: number) => (meters !== null ? meters / 1000 : 0))
        );
        const durationsMinutes = data.durations.map((row: number[]) =>
          row.map((seconds: number) => (seconds !== null ? seconds / 60 : 0))
        );

        return { distances: distancesKm, durations: durationsMinutes, fallback: false };
      }
    }
  } catch {
    // Timeout or network error - fallback to calculation
  }

  // Fallback calculation using Haversine * ROAD_DETOUR_FACTOR
  const n = coords.length;
  const distances: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const durations: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        distances[i][j] = 0;
        durations[i][j] = 0;
      } else {
        const straightKm = haversineDistanceKm(
          coords[i].latitude,
          coords[i].longitude,
          coords[j].latitude,
          coords[j].longitude
        );
        const roadKm = straightKm * ROAD_DETOUR_FACTOR;
        distances[i][j] = Number(roadKm.toFixed(2));
        // duration in minutes
        durations[i][j] = Number(((roadKm / CITY_AVG_SPEED_KMH) * 60).toFixed(1));
      }
    }
  }

  return { distances, durations, fallback: true };
}

/**
 * Fetches detailed road polyline geometry from OSRM Route service for Leaflet rendering.
 * Returns array of [lat, lng] tuples.
 */
export async function getRouteGeometry(
  coords: { latitude: number; longitude: number }[]
): Promise<[number, number][]> {
  if (coords.length < 2) {
    return coords.map((c) => [c.latitude, c.longitude]);
  }

  const coordString = coords.map((c) => `${c.longitude},${c.latitude}`).join(";");
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(osrmUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "AnnaSetu-FoodRescue/1.0" },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === "Ok" && data.routes?.[0]?.geometry?.coordinates) {
        // GeoJSON coordinates are [longitude, latitude] -> convert to Leaflet [lat, lng]
        return data.routes[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
        );
      }
    }
  } catch {
    // Fallback to straight lines between waypoints
  }

  return coords.map((c) => [c.latitude, c.longitude]);
}

/**
 * Solves multi-stop routing using Nearest-Neighbor heuristic with:
 * - Hard constraint: Pickups MUST precede their associated Deliveries (FR-ROUTE-04)
 * - Priority: High-urgency pickups (ERS >= 70) are prioritized first (FR-ROUTE-05 / SRS §12.3)
 * - Calculates cumulative distance and ETA per stop
 */
export async function optimizeRoute(
  stops: RouteStop[],
  startLocation: { latitude: number; longitude: number }
): Promise<OptimizedRouteResult> {
  if (stops.length === 0) {
    return {
      stops: [],
      total_distance_km: 0,
      total_duration_minutes: 0,
      route_geometry: [[startLocation.latitude, startLocation.longitude]],
      fallback_used: false,
    };
  }

  // Waypoints for distance matrix: [start, ...all stops]
  const allPoints = [startLocation, ...stops.map((s) => ({ latitude: s.latitude, longitude: s.longitude }))];
  const { distances, durations, fallback } = await getDistanceMatrix(allPoints);

  // Helper to get distance between two points in allPoints indices (0 = start, 1..n = stops)
  const getTravelTimeMinutes = (fromIdx: number, toIdx: number) => durations[fromIdx]?.[toIdx] ?? 5;
  const getTravelDistKm = (fromIdx: number, toIdx: number) => distances[fromIdx]?.[toIdx] ?? 1.5;

  const orderedStops: RouteStop[] = [];
  const completedPickupIds = new Set<string>();

  const remainingStops = [...stops];
  let currentIdx = 0; // starts at startLocation (index 0)
  let cumulativeMinutes = 0;
  let cumulativeDistanceKm = 0;
  const now = new Date();

  while (remainingStops.length > 0) {
    // Determine eligible stops
    const eligibleStops = remainingStops.filter((stop) => {
      if (stop.type === "pickup") {
        return true; // Pickups are always eligible if not yet visited
      }
      if (stop.type === "delivery") {
        // Delivery is ONLY eligible if associated pickup has been completed
        if (!stop.associated_pickup_id) return true;
        return completedPickupIds.has(stop.associated_pickup_id);
      }
      return true;
    });

    if (eligibleStops.length === 0) {
      // Safety: in case of orphaned delivery stop, relax constraint to prevent infinite loop
      break;
    }

    // High urgency filter (SRS §12.3):
    // Prioritize eligible pickups with ERS >= 70 if any exist
    const urgentPickups = eligibleStops.filter(
      (s) => s.type === "pickup" && (s.ers_score ?? 0) >= 70
    );

    const candidates = urgentPickups.length > 0 ? urgentPickups : eligibleStops;

    // Nearest Neighbor: pick candidate with smallest duration from current location
    let bestStop = candidates[0];
    let minTime = Infinity;

    for (const candidate of candidates) {
      const candidateIdx = stops.indexOf(candidate) + 1; // offset by 1 because 0 is startLocation
      const travelTime = getTravelTimeMinutes(currentIdx, candidateIdx);
      if (travelTime < minTime) {
        minTime = travelTime;
        bestStop = candidate;
      }
    }

    // Add best stop to ordered route
    const bestIdx = stops.indexOf(bestStop) + 1;
    const legDistance = getTravelDistKm(currentIdx, bestIdx);
    const legDuration = getTravelTimeMinutes(currentIdx, bestIdx);

    cumulativeDistanceKm += legDistance;
    cumulativeMinutes += legDuration;

    const stopEtaDate = new Date(now.getTime() + cumulativeMinutes * 60 * 1000);
    const formattedEta = stopEtaDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const enrichedStop: RouteStop = {
      ...bestStop,
      stop_number: orderedStops.length + 1,
      distance_from_previous_km: Number(legDistance.toFixed(2)),
      eta_minutes: Math.round(cumulativeMinutes),
      eta_time: formattedEta,
    };

    orderedStops.push(enrichedStop);

    if (bestStop.type === "pickup") {
      completedPickupIds.add(bestStop.id);
    }

    // Add handover time at stop for driver
    cumulativeMinutes += STOP_HANDOVER_MINUTES;

    // Advance position
    currentIdx = bestIdx;
    const removedIndex = remainingStops.indexOf(bestStop);
    remainingStops.splice(removedIndex, 1);
  }

  // Handle any remaining orphaned stops (e.g. deliveries without matching pickups)
  while (remainingStops.length > 0) {
    const orphan = remainingStops.shift()!;
    const orphanIdx = stops.indexOf(orphan) + 1;
    const legDistance = getTravelDistKm(currentIdx, orphanIdx);
    const legDuration = getTravelTimeMinutes(currentIdx, orphanIdx);

    cumulativeDistanceKm += legDistance;
    cumulativeMinutes += legDuration;

    const stopEtaDate = new Date(now.getTime() + cumulativeMinutes * 60 * 1000);
    orderedStops.push({
      ...orphan,
      stop_number: orderedStops.length + 1,
      distance_from_previous_km: Number(legDistance.toFixed(2)),
      eta_minutes: Math.round(cumulativeMinutes),
      eta_time: stopEtaDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    });

    cumulativeMinutes += STOP_HANDOVER_MINUTES;
    currentIdx = orphanIdx;
  }

  // Fetch full road polyline for Leaflet map
  const waypointCoords = [
    startLocation,
    ...orderedStops.map((s) => ({ latitude: s.latitude, longitude: s.longitude })),
  ];
  const routeGeometry = await getRouteGeometry(waypointCoords);

  return {
    stops: orderedStops,
    total_distance_km: Number(cumulativeDistanceKm.toFixed(2)),
    total_duration_minutes: Math.round(cumulativeMinutes),
    route_geometry: routeGeometry,
    fallback_used: fallback,
  };
}
