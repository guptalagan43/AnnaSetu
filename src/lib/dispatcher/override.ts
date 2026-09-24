/**
 * Dispatcher Override Engine
 * AnnaSetu — Autonomous AI-Powered Urban Food Redistribution Engine
 *
 * Implements admin intervention and reversal rules (SRS §14 / rules.md §5):
 * - Admin can override any autonomous dispatcher action.
 * - Idempotency & audit logging.
 * - Restores listing to match pool, reverses shelter load or cancels driver assignment.
 */

export interface AgentLogRecord {
  id: string;
  action: "AUTO_CONFIRM_SHELTER" | "ASSIGN_DRIVER" | "ESCALATE_TO_ADMIN" | "SKIP_ALREADY_ACTIONED" | string;
  listing_id: string | null;
  match_id: string | null;
  driver_id: string | null;
  reasoning: string | null;
  confidence: number | null;
  overridden_by: string | null;
  overridden_at: string | null;
  created_at: string;
  // Joined or resolved fields for UI
  listing_title?: string;
  listing_quantity_kg?: number;
  listing_ers?: number;
  shelter_name?: string;
  driver_name?: string;
  admin_name?: string;
}

export interface OverrideResult {
  success: boolean;
  action: string;
  reversalSummary: string;
  newListingStatus: string | null;
  newMatchStatus: string | null;
  newDriverAssignmentStatus: string | null;
  notifiedRoles: Array<"donor" | "shelter" | "driver" | "admin">;
}

export function validateOverrideReason(reason: unknown): { valid: boolean; error?: string } {
  if (typeof reason !== "string") {
    return { valid: false, error: "Reason must be a text string" };
  }
  const trimmed = reason.trim();
  if (trimmed.length < 5) {
    return { valid: false, error: "Override reason must be at least 5 characters explaining why" };
  }
  if (trimmed.length > 500) {
    return { valid: false, error: "Override reason cannot exceed 500 characters" };
  }
  return { valid: true };
}

export function canOverrideAction(log: {
  overridden_at?: string | null;
  action: string;
}): { allowed: boolean; reason?: string } {
  if (log.overridden_at) {
    return { allowed: false, reason: "Action has already been overridden" };
  }
  const overrideableActions = ["AUTO_CONFIRM_SHELTER", "ASSIGN_DRIVER", "ESCALATE_TO_ADMIN"];
  if (!overrideableActions.includes(log.action)) {
    return { allowed: false, reason: `Action type '${log.action}' is not reversible` };
  }
  return { allowed: true };
}

export function determineReversalPlan(action: string): OverrideResult {
  switch (action) {
    case "AUTO_CONFIRM_SHELTER":
      return {
        success: true,
        action,
        reversalSummary:
          "Auto-confirmed shelter match cancelled. Shelter reserved capacity restored. Food listing returned to open matching pool.",
        newListingStatus: "available",
        newMatchStatus: "cancelled",
        newDriverAssignmentStatus: null,
        notifiedRoles: ["shelter", "donor", "admin"],
      };

    case "ASSIGN_DRIVER":
      return {
        success: true,
        action,
        reversalSummary:
          "Volunteer driver assignment revoked. Food listing returned to matched status pending manual dispatch.",
        newListingStatus: "matched",
        newMatchStatus: null,
        newDriverAssignmentStatus: "cancelled",
        notifiedRoles: ["driver", "shelter", "admin"],
      };

    case "ESCALATE_TO_ADMIN":
      return {
        success: true,
        action,
        reversalSummary: "Admin escalation marked as investigated and manually resolved.",
        newListingStatus: null,
        newMatchStatus: null,
        newDriverAssignmentStatus: null,
        notifiedRoles: ["admin"],
      };

    default:
      return {
        success: true,
        action,
        reversalSummary: "Autonomous action acknowledged and reversed.",
        newListingStatus: null,
        newMatchStatus: null,
        newDriverAssignmentStatus: null,
        notifiedRoles: ["admin"],
      };
  }
}

/**
 * Baseline seed / demo agent logs so the admin interface is immediately functional and demonstrative
 */
export const DEMO_AGENT_LOGS: AgentLogRecord[] = [
  {
    id: "log-101",
    action: "AUTO_CONFIRM_SHELTER",
    listing_id: "list-1",
    match_id: "match-1",
    driver_id: null,
    reasoning:
      "ERS score 86 > 80 threshold. Shelter 'Hope Shelter' has accepts_auto_confirm=true, capacity 45/100kg free, distance 2.4km (weighted 50%). 10-min acceptance timeout expired.",
    confidence: 0.94,
    overridden_by: null,
    overridden_at: null,
    created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    listing_title: "Dal Makhani & 40 Rotis",
    listing_quantity_kg: 18,
    listing_ers: 86,
    shelter_name: "Hope Shelter",
  },
  {
    id: "log-102",
    action: "ASSIGN_DRIVER",
    listing_id: "list-2",
    match_id: "match-2",
    driver_id: "drv-1",
    reasoning:
      "Listing matched with City Food Bank. Verified driver 'Rahul Verma' (Motorcycle) is online and 1.8km from pickup location. Auto-assigned to meet 45-min pickup window.",
    confidence: 0.91,
    overridden_by: null,
    overridden_at: null,
    created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    listing_title: "Vegetable Biryani & Raita (50 Portions)",
    listing_quantity_kg: 22,
    listing_ers: 72,
    shelter_name: "City Food Bank",
    driver_name: "Rahul Verma (Bike)",
  },
  {
    id: "log-103",
    action: "ESCALATE_TO_ADMIN",
    listing_id: "list-3",
    match_id: null,
    driver_id: null,
    reasoning:
      "Critical ERS 92/100. Cascade search at 5km, 10km, and 15km found 0 shelters with available chilled storage capacity for dairy products. Immediate manual coordination needed.",
    confidence: 0.42,
    overridden_by: null,
    overridden_at: null,
    created_at: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    listing_title: "Fresh Paneer Gravy (Chilled)",
    listing_quantity_kg: 35,
    listing_ers: 92,
  },
  {
    id: "log-104",
    action: "AUTO_CONFIRM_SHELTER",
    listing_id: "list-4",
    match_id: "match-4",
    driver_id: null,
    reasoning:
      "Listing at ERS 82. Assigned to Community Kitchen (3.1km, match score 94%). Shelter coordinator auto-confirm triggered after 10-minute timeout.",
    confidence: 0.88,
    overridden_by: "usr-admin",
    overridden_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    listing_title: "Assorted Bakery Bread & Rolls",
    listing_quantity_kg: 15,
    listing_ers: 82,
    shelter_name: "Community Kitchen",
    admin_name: "Admin Moderator",
  },
  {
    id: "log-105",
    action: "SKIP_ALREADY_ACTIONED",
    listing_id: "list-1",
    match_id: null,
    driver_id: null,
    reasoning: "Listing list-1 already had an action taken in the last 2-minute idempotency window. Skipped.",
    confidence: 1.0,
    overridden_by: null,
    overridden_at: null,
    created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    listing_title: "Dal Makhani & 40 Rotis",
    listing_quantity_kg: 18,
    listing_ers: 86,
  },
];
