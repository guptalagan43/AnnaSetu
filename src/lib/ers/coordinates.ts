/**
 * Coordinates Parser
 * Parses PostGIS representations (GeoJSON, WKT, or coordinate objects)
 */

export function parseCoordinates(location: unknown): { lat: number; lng: number } | null {
  if (!location) return null;

  // GeoJSON format: { type: "Point", coordinates: [lng, lat] }
  if (typeof location === "object" && location !== null) {
    const obj = location as Record<string, unknown>;
    if (Array.isArray(obj.coordinates) && obj.coordinates.length >= 2) {
      const lng = Number(obj.coordinates[0]);
      const lat = Number(obj.coordinates[1]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
    if (typeof obj.lat === "number" && typeof obj.lng === "number") {
      return { lat: obj.lat, lng: obj.lng };
    }
    if (typeof obj.latitude === "number" && typeof obj.longitude === "number") {
      return { lat: obj.latitude, lng: obj.longitude };
    }
  }

  // WKT or EWKT format: "SRID=4326;POINT(lng lat)" or "POINT(lng lat)"
  if (typeof location === "string") {
    const match = location.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (match) {
      const lng = parseFloat(match[1]);
      const lat = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
  }

  return null;
}
