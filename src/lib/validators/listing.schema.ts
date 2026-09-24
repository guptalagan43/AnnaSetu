import { z } from "zod";

export const FOOD_CATEGORIES = [
  "Cooked meat / fish",
  "Dairy-based dishes",
  "Cooked rice dishes / curries",
  "Cooked pasta / noodles",
  "Soups / broths",
  "Baked goods / bread",
  "Fresh produce",
  "Packaged / sealed items",
  "Beverages (opened)",
  "Other",
] as const;

export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

export const PACKAGING_TYPES = [
  "Stainless steel / Metal containers",
  "Plastic containers / Trays",
  "Disposable boxes / Foil wraps",
  "Original sealed packaging",
  "Cardboard boxes / Crates",
  "Other",
] as const;

export const ALLERGENS = [
  "Dairy",
  "Nuts / Peanuts",
  "Gluten / Wheat",
  "Soy",
  "Eggs",
  "Fish / Shellfish",
  "None",
] as const;

export const createListingSchema = z
  .object({
    title: z
      .string()
      .min(3, "Food title must be at least 3 characters")
      .max(100, "Food title cannot exceed 100 characters"),
    food_category: z.enum(FOOD_CATEGORIES, {
      errorMap: () => ({ message: "Please select a valid food category" }),
    }),
    quantity_kg: z.coerce
      .number()
      .positive("Quantity must be greater than 0")
      .max(10000, "Quantity cannot exceed 10,000 kg"),
    estimated_servings: z.coerce
      .number()
      .int("Servings must be a whole number")
      .positive("Estimated servings must be at least 1")
      .max(50000, "Estimated servings cannot exceed 50,000"),
    packaging_type: z.string().min(1, "Please select a packaging type"),
    allergens: z.array(z.string()).default([]),
    pickup_address: z
      .string()
      .min(5, "Pickup address must be at least 5 characters")
      .max(300, "Pickup address cannot exceed 300 characters"),
    latitude: z.coerce
      .number()
      .min(-90, "Latitude must be between -90 and 90")
      .max(90, "Latitude must be between -90 and 90"),
    longitude: z.coerce
      .number()
      .min(-180, "Longitude must be between -180 and 180")
      .max(180, "Longitude must be between -180 and 180"),
    pickup_window_start: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid pickup window start time",
    }),
    pickup_window_end: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid pickup window end time",
    }),
    expiry_time: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid expiry time",
    }),
    notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
    intake_method: z.enum(["manual", "cv", "nlp", "voice"]).default("manual"),
    photo_url: z.string().url().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      const start = new Date(data.pickup_window_start).getTime();
      const end = new Date(data.pickup_window_end).getTime();
      return end > start;
    },
    {
      message: "Pickup window end time must be after start time",
      path: ["pickup_window_end"],
    }
  )
  .refine(
    (data) => {
      const start = new Date(data.pickup_window_start).getTime();
      const expiry = new Date(data.expiry_time).getTime();
      return expiry > start;
    },
    {
      message: "Food expiry time must be after pickup window start",
      path: ["expiry_time"],
    }
  );

export type CreateListingInput = z.infer<typeof createListingSchema>;
