/**
 * Expiry Risk Score (ERS) Engine — AnnaSetu
 * Formulas and specifications based on SRS §8.1 - §8.5 & PRD §5.3
 * 
 * ERS = min(100, max(0, round(base_risk * category_multiplier + adjustment_factors)))
 */

export interface FoodCategoryConfig {
  maxSafeWindowHours: number;
  multiplier: number;
}

export const FOOD_CATEGORY_CONFIGS: Record<string, FoodCategoryConfig> = {
  // Exact schema titles
  "Cooked meat / fish": { maxSafeWindowHours: 2, multiplier: 2.0 },
  "Dairy-based dishes": { maxSafeWindowHours: 3, multiplier: 1.8 },
  "Cooked rice dishes / curries": { maxSafeWindowHours: 4, multiplier: 1.5 },
  "Cooked pasta / noodles": { maxSafeWindowHours: 4, multiplier: 1.4 },
  "Soups / broths": { maxSafeWindowHours: 4, multiplier: 1.4 },
  "Baked goods / bread": { maxSafeWindowHours: 8, multiplier: 1.0 },
  "Fresh produce": { maxSafeWindowHours: 12, multiplier: 0.8 },
  "Packaged / sealed items": { maxSafeWindowHours: 24, multiplier: 0.5 },
  "Beverages (opened)": { maxSafeWindowHours: 6, multiplier: 0.9 },
  "Other": { maxSafeWindowHours: 4, multiplier: 1.0 },

  // Snake-case aliases
  "cooked_meat_fish": { maxSafeWindowHours: 2, multiplier: 2.0 },
  "dairy_dish": { maxSafeWindowHours: 3, multiplier: 1.8 },
  "cooked_rice_curry": { maxSafeWindowHours: 4, multiplier: 1.5 },
  "cooked_pasta": { maxSafeWindowHours: 4, multiplier: 1.4 },
  "soup_broth": { maxSafeWindowHours: 4, multiplier: 1.4 },
  "baked_bread": { maxSafeWindowHours: 8, multiplier: 1.0 },
  "fresh_produce": { maxSafeWindowHours: 12, multiplier: 0.8 },
  "packaged_sealed": { maxSafeWindowHours: 24, multiplier: 0.5 },
  "beverage_opened": { maxSafeWindowHours: 6, multiplier: 0.9 },
  "other": { maxSafeWindowHours: 4, multiplier: 1.0 },
};

export function getCategoryConfig(category: string): FoodCategoryConfig {
  if (FOOD_CATEGORY_CONFIGS[category]) {
    return FOOD_CATEGORY_CONFIGS[category];
  }

  // Case-insensitive / normalized lookup
  const normalized = category.toLowerCase().trim();
  for (const [key, config] of Object.entries(FOOD_CATEGORY_CONFIGS)) {
    if (key.toLowerCase() === normalized) {
      return config;
    }
  }

  return { maxSafeWindowHours: 4, multiplier: 1.0 };
}

export interface ERSInput {
  foodCategory: string;
  expiryTime: Date | string;
  currentTime?: Date | string;
  status?: string;
  isRefrigerated?: boolean | null;
  outdoorTempCelsius?: number | null;
  donorSuccessfulDonations?: number;
}

export type ERSUrgency = "safe" | "caution" | "warning" | "critical" | "emergency";

export interface ERSBreakdown {
  score: number;
  urgency: ERSUrgency;
  colorLabel: "Safe" | "Caution" | "Warning" | "Critical" | "Expiring";
  timeRemainingHours: number;
  baseRisk: number;
  categoryMultiplier: number;
  adjustments: {
    refrigeration: number;
    temperature: number;
    status: number;
    donorReputation: number;
    total: number;
  };
  shouldEscalate: boolean; // ERS >= 81
  isAutoExpired: boolean;   // ERS >= 96 or time expired
}

/**
 * Calculates Expiry Risk Score (ERS) based on SRS §8.1-§8.3.
 */
export function calculateERS(input: ERSInput): ERSBreakdown {
  const now = input.currentTime ? new Date(input.currentTime) : new Date();
  const expiry = new Date(input.expiryTime);
  const timeRemainingHours = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

  // If already expired
  if (timeRemainingHours <= 0) {
    return {
      score: 100,
      urgency: "emergency",
      colorLabel: "Expiring",
      timeRemainingHours: 0,
      baseRisk: 100,
      categoryMultiplier: 1.0,
      adjustments: { refrigeration: 0, temperature: 0, status: 0, donorReputation: 0, total: 0 },
      shouldEscalate: true,
      isAutoExpired: true,
    };
  }

  const catConfig = getCategoryConfig(input.foodCategory);
  const maxSafeWindow = catConfig.maxSafeWindowHours;

  // base_risk = (1 - time_remaining / max_safe_window) * 100
  // clamped at 0 if timeRemaining >= maxSafeWindow
  const baseRisk = Math.max(0, (1 - timeRemainingHours / maxSafeWindow) * 100);

  // Adjustment 1: Refrigeration
  let refrigerationAdjustment = 0;
  if (input.isRefrigerated === true) {
    refrigerationAdjustment = -15;
  } else if (input.isRefrigerated === false || input.isRefrigerated === null || input.isRefrigerated === undefined) {
    // Donor did not specify refrigeration availability or unrefrigerated (+10)
    refrigerationAdjustment = 10;
  }

  // Adjustment 2: Temperature from OpenWeatherMap API
  let temperatureAdjustment = 0;
  if (input.outdoorTempCelsius !== null && input.outdoorTempCelsius !== undefined) {
    if (input.outdoorTempCelsius > 40) {
      temperatureAdjustment = 20;
    } else if (input.outdoorTempCelsius > 35) {
      temperatureAdjustment = 12;
    }
  }

  // Adjustment 3: Match / Delivery status
  let statusAdjustment = 0;
  const status = (input.status || "listed").toLowerCase();
  if (status === "matched") {
    statusAdjustment = -10; // Shelter has confirmed match
  } else if (status === "driver_assigned" || status === "in_transit") {
    statusAdjustment = -20; // Driver is actively en route
  }

  // Adjustment 4: Donor track record
  let donorReputationAdjustment = 0;
  if (input.donorSuccessfulDonations && input.donorSuccessfulDonations > 10) {
    donorReputationAdjustment = -5;
  }

  const totalAdjustments =
    refrigerationAdjustment +
    temperatureAdjustment +
    statusAdjustment +
    donorReputationAdjustment;

  const rawScore = baseRisk * catConfig.multiplier + totalAdjustments;
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Urgency thresholds per SRS §8.4 & design.md
  let urgency: ERSUrgency = "safe";
  let colorLabel: ERSBreakdown["colorLabel"] = "Safe";

  if (score >= 96) {
    urgency = "emergency";
    colorLabel = "Expiring";
  } else if (score >= 80) {
    urgency = "critical";
    colorLabel = "Critical";
  } else if (score >= 60) {
    urgency = "warning";
    colorLabel = "Warning";
  } else if (score >= 40) {
    urgency = "caution";
    colorLabel = "Caution";
  } else {
    urgency = "safe";
    colorLabel = "Safe";
  }

  return {
    score,
    urgency,
    colorLabel,
    timeRemainingHours: Math.max(0, Number(timeRemainingHours.toFixed(2))),
    baseRisk: Math.round(baseRisk * 10) / 10,
    categoryMultiplier: catConfig.multiplier,
    adjustments: {
      refrigeration: refrigerationAdjustment,
      temperature: temperatureAdjustment,
      status: statusAdjustment,
      donorReputation: donorReputationAdjustment,
      total: totalAdjustments,
    },
    shouldEscalate: score >= 81,
    isAutoExpired: score >= 96,
  };
}
