/**
 * Impact Calculator & Data Aggregation
 * AnnaSetu — Food Rescue Network
 *
 * Implements EPA WARM methodology:
 * 1 kg food waste diverted = 2.5 kg CO₂e greenhouse gas avoided.
 */

export const EPA_WARM_CO2E_FACTOR = 2.5;
export const DEFAULT_MEALS_PER_KG = 2.5; // ~400g per standard meal

export interface ImpactTotals {
  meals_rescued: number;
  weight_kg: number;
  co2e_avoided_kg: number;
  active_donors: number;
  active_shelters: number;
  volunteer_drivers: number;
}

export interface RecentActivityItem {
  id: string;
  donor_name: string;
  shelter_name: string;
  food_title: string;
  meals: number;
  weight_kg: number;
  delivered_at: string;
  time_ago: string;
}

export interface HotspotPoint {
  lat: number;
  lng: number;
  intensity: number; // 0.2 to 1.0
  meals: number;
  weight_kg: number;
  location_name?: string;
}

export interface TopDonorItem {
  rank: number;
  name: string;
  donations_count: number;
  meals_rescued: number;
  weight_kg: number;
}

export interface MonthlyTrendItem {
  month: string;
  meals: number;
  weight_kg: number;
  co2e: number;
}

/**
 * Calculates CO2e avoided in kg using EPA WARM formula:
 * weight_kg * 2.5
 */
export function calculateCO2e(weightKg: number): number {
  if (typeof weightKg !== "number" || isNaN(weightKg) || weightKg <= 0) {
    return 0;
  }
  return Number((weightKg * EPA_WARM_CO2E_FACTOR).toFixed(2));
}

/**
 * Calculates meals rescued from weight or provided estimated servings
 */
export function calculateMeals(weightKg: number, servings?: number | null): number {
  if (typeof servings === "number" && !isNaN(servings) && servings > 0) {
    return Math.round(servings);
  }
  if (typeof weightKg === "number" && !isNaN(weightKg) && weightKg > 0) {
    return Math.round(weightKg * DEFAULT_MEALS_PER_KG);
  }
  return 0;
}

/**
 * Converts ISO date string to human-friendly relative time string
 */
export function formatRelativeTime(isoString: string): string {
  try {
    const timestamp = new Date(isoString).getTime();
    if (isNaN(timestamp)) return "Recently";
    
    const now = Date.now();
    const diffSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));

    if (diffSeconds < 60) {
      return "Just now";
    }
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) {
      return `${diffDays}d ago`;
    }
    return new Date(isoString).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Recently";
  }
}

/**
 * Normalizes raw coordinate points with weights into heatmap data points with intensity [0.2, 1.0]
 */
export function normalizeHotspots(
  rawPoints: Array<{
    lat: number;
    lng: number;
    weight_kg?: number;
    meals?: number;
    location_name?: string;
  }>
): HotspotPoint[] {
  if (!Array.isArray(rawPoints) || rawPoints.length === 0) {
    return [];
  }

  // Filter valid coordinates
  const valid = rawPoints.filter(
    (p) =>
      typeof p.lat === "number" &&
      typeof p.lng === "number" &&
      !isNaN(p.lat) &&
      !isNaN(p.lng) &&
      p.lat >= -90 &&
      p.lat <= 90 &&
      p.lng >= -180 &&
      p.lng <= 180
  );

  if (valid.length === 0) return [];

  const getWeight = (p: { weight_kg?: number; meals?: number }) => {
    if (typeof p.weight_kg === "number") return p.weight_kg;
    if (typeof p.meals === "number" && p.meals > 0) return p.meals / DEFAULT_MEALS_PER_KG;
    return 1;
  };

  const maxWeight = Math.max(...valid.map(getWeight), 1);

  return valid.map((p) => {
    const weight = getWeight(p);
    const meals = typeof p.meals === "number" ? p.meals : calculateMeals(weight);
    // Scale intensity between 0.3 and 1.0
    const rawRatio = weight / maxWeight;
    const intensity = Number((0.3 + 0.7 * Math.min(rawRatio, 1)).toFixed(2));

    return {
      lat: p.lat,
      lng: p.lng,
      intensity,
      meals,
      weight_kg: Number(weight.toFixed(1)),
      location_name: p.location_name,
    };
  });
}
