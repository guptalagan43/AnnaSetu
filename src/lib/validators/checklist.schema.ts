import { z } from "zod";

export const deliveryChecklistSchema = z
  .object({
    listing_id: z.string().min(1, "Listing ID is required"),
    quantity_ok: z.boolean(),
    item_correct: z.boolean(),
    packaging_ok: z.boolean(),
    food_condition_ok: z.boolean(),
    donor_pin: z.string().min(4, "PIN must be 4 digits").max(4, "PIN must be 4 digits"),
    notes: z.string().optional(),
    discrepancy_type: z
      .enum([
        "quantity_mismatch",
        "wrong_items",
        "packaging_damaged",
        "food_unsafe",
        "pin_failure",
        "multiple",
        "other",
      ])
      .optional(),
  })
  .refine(
    (data) => {
      // If any of the 4 physical checks failed, notes must be at least 10 chars (FR-CHECK-06)
      const anyPhysicalFailed =
        !data.quantity_ok ||
        !data.item_correct ||
        !data.packaging_ok ||
        !data.food_condition_ok;

      if (anyPhysicalFailed) {
        return typeof data.notes === "string" && data.notes.trim().length >= 10;
      }
      return true;
    },
    {
      message: "Detailed inspection notes (minimum 10 characters) are required when reporting an issue",
      path: ["notes"],
    }
  );

export type DeliveryChecklistInput = z.infer<typeof deliveryChecklistSchema>;
