/**
 * Geo-Matching Engine — AnnaSetu
 * Formulas and specifications based on SRS §9.1 - §9.4
 * 
 * Match Score (0–1) =
 *   (distance_score   × 0.30) +
 *   (capacity_score   × 0.25) +
 *   (preference_score × 0.25) +
 *   (reliability_score × 0.10) +
 *   (urgency_weight   × 0.10)
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { parseCoordinates } from "@/lib/ers/coordinates";

export interface ListingMatchInput {
  id: string;
  title: string;
  food_category: string;
  quantity_kg: number;
  latitude: number;
  longitude: number;
  ers_score?: number;
  allergens?: string[];
}

export interface ShelterCandidate {
  id: string;
  profile_id?: string;
  name: string;
  address: string;
  location: unknown;
  latitude: number;
  longitude: number;
  capacity_kg: number;
  current_load_kg: number;
  available_capacity_kg: number;
  food_preferences?: string[] | null;
  food_restrictions?: string[] | null;
  reliability_score?: number | null;
  status: string;
}

export interface ScoredMatch {
  shelter: ShelterCandidate;
  distanceKm: number;
  matchScore: number;
  distanceScore: number;
  capacityScore: number;
  preferenceScore: number;
  reliabilityScore: number;
  urgencyWeight: number;
}

export interface MatchEngineResult {
  success: boolean;
  match: {
    id?: string;
    listing_id: string;
    shelter_id: string;
    match_score: number;
    distance_km: number;
    status: string;
    shelter_name?: string;
  } | null;
  searchedRadiusKm: number;
  candidatesEvaluated: number;
  message: string;
}

/**
 * Calculates Haversine distance in kilometers between two coordinates
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Checks whether a hard dietary or allergen restriction is violated (SRS §9.2 / FR-MATCH-04).
 * Hard preference violations are an absolute exclusion, not a score reduction.
 */
export function isHardPreferenceViolated(
  listing: { food_category: string; allergens?: string[] },
  shelter: { food_restrictions?: string[] | null }
): boolean {
  if (!shelter.food_restrictions || shelter.food_restrictions.length === 0) {
    return false;
  }

  const restrictions = shelter.food_restrictions.map((r) => r.toLowerCase().trim());
  const category = listing.food_category.toLowerCase();

  // Vegetarian-only checks
  const isVegOnly = restrictions.some((r) =>
    r.includes("vegetarian") || r.includes("veg only") || r.includes("no meat") || r.includes("no non-veg")
  );
  if (
    isVegOnly &&
    (category.includes("meat") || category.includes("fish") || category.includes("chicken") || category.includes("pork") || category.includes("non-veg"))
  ) {
    return true;
  }

  // Halal-only checks if specified
  const isHalalOnly = restrictions.some((r) => r.includes("halal"));
  if (isHalalOnly && (category.includes("pork") || category.includes("bacon"))) {
    return true;
  }

  // Allergen restrictions
  if (listing.allergens && listing.allergens.length > 0) {
    const stem = (w: string) => w.toLowerCase().trim().replace(/s$/, "");

    for (const allergen of listing.allergens) {
      const lowerAllergen = allergen.toLowerCase().trim();
      if (lowerAllergen === "none") continue;

      const allergenTokens = lowerAllergen
        .split(/[/, -]/)
        .map(stem)
        .filter((t) => t.length > 2);

      for (const r of restrictions) {
        const rTokens = r
          .split(/[/, -]/)
          .map(stem)
          .filter((t) => t.length > 2 && t !== "free" && t !== "only");

        const matches = allergenTokens.some((at) =>
          rTokens.some((rt) => at === rt || at.includes(rt) || rt.includes(at))
        );

        if (matches) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Evaluates food preference compatibility score (SRS §9.2)
 * Compatible = 1.0, not preferred but compatible = 0.8
 */
export function calculatePreferenceScore(
  listing: { food_category: string },
  shelter: { food_preferences?: string[] | null }
): number {
  if (!shelter.food_preferences || shelter.food_preferences.length === 0) {
    return 1.0; // No preference restrictions, fully compatible
  }

  const prefs = shelter.food_preferences.map((p) => p.toLowerCase());
  const cat = listing.food_category.toLowerCase();

  const isExplicitlyPreferred = prefs.some((p) => cat.includes(p) || p.includes(cat));
  return isExplicitlyPreferred ? 1.0 : 0.8;
}

/**
 * Calculates complete Match Score (0–1) per SRS §9.2 formula
 */
export function scoreShelterMatch(
  listing: ListingMatchInput,
  shelter: ShelterCandidate,
  distanceKm: number,
  maxRadiusKm: number
): ScoredMatch | null {
  // Absolute exclusions per FR-MATCH-03 & FR-MATCH-04
  if (shelter.status !== "active") return null;
  if (shelter.available_capacity_kg < listing.quantity_kg) return null;
  if (isHardPreferenceViolated(listing, shelter)) return null;

  // 1. Distance Score: max(0, 1 - distance / max_radius)
  const distanceScore = Math.max(0, 1 - distanceKm / maxRadiusKm);

  // 2. Capacity Score: available_capacity / max_capacity
  const capacityScore =
    shelter.capacity_kg > 0
      ? Math.min(1, Math.max(0, shelter.available_capacity_kg / shelter.capacity_kg))
      : 0.5;

  // 3. Preference Score
  const preferenceScore = calculatePreferenceScore(listing, shelter);

  // 4. Reliability Score: default 0.70 for new shelters
  const reliabilityScore =
    typeof shelter.reliability_score === "number" && shelter.reliability_score > 0
      ? shelter.reliability_score
      : 0.7;

  // 5. Urgency Weight (ERS-based)
  const ers = listing.ers_score ?? 0;
  const urgencyWeight = ers >= 80 ? 1.0 : ers / 100;

  // Formula: (dist × 0.30) + (cap × 0.25) + (pref × 0.25) + (rel × 0.10) + (urg × 0.10)
  let matchScore =
    distanceScore * 0.3 +
    capacityScore * 0.25 +
    preferenceScore * 0.25 +
    reliabilityScore * 0.1 +
    urgencyWeight * 0.1;

  // If ERS >= 80: prioritize fastest/closest shelter
  if (ers >= 80) {
    matchScore = matchScore * 0.5 + distanceScore * 0.5;
  }

  matchScore = Math.round(matchScore * 1000) / 1000;

  return {
    shelter,
    distanceKm,
    matchScore,
    distanceScore,
    capacityScore,
    preferenceScore,
    reliabilityScore,
    urgencyWeight,
  };
}

/**
 * Evaluates and ranks all available shelters across cascade radii (5km -> 10km -> 15km)
 */
export function rankShelterCandidates(
  listing: ListingMatchInput,
  shelters: ShelterCandidate[],
  excludedShelterIds: string[] = []
): { ranked: ScoredMatch[]; searchRadiusKm: number } {
  const cascadeRadii = [5, 10, 15];

  for (const radius of cascadeRadii) {
    const candidates: ScoredMatch[] = [];

    for (const shelter of shelters) {
      if (excludedShelterIds.includes(shelter.id)) continue;

      const dist = haversineDistanceKm(
        listing.latitude,
        listing.longitude,
        shelter.latitude,
        shelter.longitude
      );

      if (dist <= radius) {
        const scored = scoreShelterMatch(listing, shelter, dist, radius);
        if (scored) {
          candidates.push(scored);
        }
      }
    }

    if (candidates.length > 0) {
      // Sort by match score descending (highest score first)
      candidates.sort((a, b) => b.matchScore - a.matchScore);
      return { ranked: candidates, searchRadiusKm: radius };
    }
  }

  return { ranked: [], searchRadiusKm: 15 };
}

/**
 * Finds and creates an automated match record in database for a listing (FR-MATCH-01)
 */
export async function findAndCreateMatch(listingId: string): Promise<MatchEngineResult> {
  const supabase = createAdminClient();

  // 1. Fetch listing details
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, title, food_category, quantity_kg, pickup_location, ers_score, allergens, status")
    .eq("id", listingId)
    .single();

  if (listingError || !listing) {
    return {
      success: false,
      match: null,
      searchedRadiusKm: 0,
      candidatesEvaluated: 0,
      message: `Listing not found: ${listingError?.message || "Unknown error"}`,
    };
  }

  // 2. Check if listing already has an active pending or accepted match
  const { data: existingMatches } = await supabase
    .from("matches")
    .select("id, shelter_id, status")
    .eq("listing_id", listingId)
    .in("status", ["pending", "accepted", "auto_confirmed"]);

  if (existingMatches && existingMatches.length > 0) {
    return {
      success: true,
      match: null,
      searchedRadiusKm: 0,
      candidatesEvaluated: 0,
      message: `Listing already has an active match (${existingMatches[0].id})`,
    };
  }

  // 3. Fetch already declined shelters for this listing to exclude them
  const { data: declinedMatches } = await supabase
    .from("matches")
    .select("shelter_id")
    .eq("listing_id", listingId)
    .eq("status", "declined");

  const excludedIds = (declinedMatches || []).map((m) => m.shelter_id);

  // 4. Resolve listing coordinates
  const coords = parseCoordinates(listing.pickup_location);
  if (!coords) {
    return {
      success: false,
      match: null,
      searchedRadiusKm: 0,
      candidatesEvaluated: 0,
      message: "Listing has invalid or missing coordinates",
    };
  }

  // 5. Fetch all active shelters
  const { data: dbShelters, error: sheltersError } = await supabase
    .from("shelters")
    .select("*")
    .eq("status", "active");

  if (sheltersError || !dbShelters) {
    return {
      success: false,
      match: null,
      searchedRadiusKm: 0,
      candidatesEvaluated: 0,
      message: `Failed to fetch shelters: ${sheltersError?.message}`,
    };
  }

  // Transform DB shelters into candidates with coordinates
  const candidates: ShelterCandidate[] = [];
  for (const s of dbShelters) {
    const sCoords = parseCoordinates(s.location);
    if (sCoords) {
      const capacity = Number(s.capacity_kg) || 0;
      const load = Number(s.current_load_kg) || 0;
      candidates.push({
        id: s.id,
        profile_id: s.profile_id,
        name: s.name,
        address: s.address,
        location: s.location,
        latitude: sCoords.lat,
        longitude: sCoords.lng,
        capacity_kg: capacity,
        current_load_kg: load,
        available_capacity_kg: Math.max(0, capacity - load),
        food_preferences: s.food_preferences,
        food_restrictions: s.food_restrictions,
        reliability_score: s.reliability_score ? Number(s.reliability_score) : 0.7,
        status: s.status,
      });
    }
  }

  const listingInput: ListingMatchInput = {
    id: listing.id,
    title: listing.title,
    food_category: listing.food_category,
    quantity_kg: Number(listing.quantity_kg) || 0,
    latitude: coords.lat,
    longitude: coords.lng,
    ers_score: listing.ers_score ?? 0,
    allergens: listing.allergens,
  };

  // 6. Run matching cascade
  const { ranked, searchRadiusKm } = rankShelterCandidates(
    listingInput,
    candidates,
    excludedIds
  );

  if (ranked.length === 0) {
    console.warn(`[Matching Engine] No suitable shelter found within 15 km for listing ${listingId}`);
    return {
      success: true,
      match: null,
      searchedRadiusKm: searchRadiusKm,
      candidatesEvaluated: candidates.length,
      message: "No suitable shelter found within 15 km with available capacity",
    };
  }

  // 7. Pick top candidate and create match record
  const best = ranked[0];

  const { data: createdMatch, error: insertError } = await supabase
    .from("matches")
    .insert({
      listing_id: listing.id,
      shelter_id: best.shelter.id,
      match_score: best.matchScore,
      distance_km: best.distanceKm,
      status: "pending",
      auto_confirmed: false,
    })
    .select("*")
    .single();

  if (insertError) {
    console.error("[Matching Engine] Error inserting match:", insertError);
    return {
      success: false,
      match: null,
      searchedRadiusKm: searchRadiusKm,
      candidatesEvaluated: candidates.length,
      message: `Failed to create match record: ${insertError.message}`,
    };
  }

  console.info(`[Matching Engine] Matched listing ${listing.id} to shelter ${best.shelter.name} (${best.distanceKm} km, score ${best.matchScore})`);

  return {
    success: true,
    match: {
      id: createdMatch.id,
      listing_id: listing.id,
      shelter_id: best.shelter.id,
      match_score: best.matchScore,
      distance_km: best.distanceKm,
      status: "pending",
      shelter_name: best.shelter.name,
    },
    searchedRadiusKm: searchRadiusKm,
    candidatesEvaluated: candidates.length,
    message: `Matched to ${best.shelter.name} at ${best.distanceKm} km (score: ${best.matchScore})`,
  };
}

/**
 * Re-matches a listing after shelter decline (SRS §9.3 & §9.4 / FR-MATCH-05)
 */
export async function rematchListing(listingId: string): Promise<MatchEngineResult> {
  console.info(`[Matching Engine] Re-matching listing ${listingId} after decline...`);
  return await findAndCreateMatch(listingId);
}
