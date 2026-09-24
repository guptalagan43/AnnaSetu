import { z } from "zod";

export const verificationStep1Schema = z.object({
  business_name: z.string().min(2, "Business name must be at least 2 characters"),
  business_type: z.enum(["restaurant", "grocery_store", "caterer", "campus_dining", "cloud_kitchen", "other"]),
  contact_person_name: z.string().min(2, "Contact person name is required"),
  contact_email: z.string().email("Invalid email format"),
  contact_phone: z.string().min(10, "Phone number must be at least 10 digits"),
  why_donate: z.string().max(200, "Maximum 200 characters").optional(),
});

export const verificationStep2Schema = z.object({
  fssai_number: z.string().length(14, "FSSAI number must be 14 digits"),
  fssai_expiry: z.string().min(1, "FSSAI expiry date is required"),
  gst_number: z.string().length(15, "GST number must be 15 characters").optional().or(z.literal("")),
  pan_number: z.string().length(10, "PAN number must be 10 characters"),
  // These are Storage URLs after upload — set by the form on upload
  fssai_doc_url: z.string().optional(),
  gst_doc_url: z.string().optional(),
  pan_doc_url: z.string().optional(),
});

export const verificationStep3Schema = z.object({
  address: z.string().min(10, "Full address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().length(6, "PIN code must be 6 digits"),
  lat: z.number({ required_error: "Please pin your location on the map" }),
  lng: z.number({ required_error: "Please pin your location on the map" }),
});

export const verificationStep4Schema = z.object({
  operating_hours_start: z.string().min(1, "Opening time is required"),
  operating_hours_end: z.string().min(1, "Closing time is required"),
  operating_days: z.array(z.string()).min(1, "Select at least one operating day"),
  avg_daily_surplus: z.enum(["<5kg", "5-20kg", "20-50kg", "50kg+"], {
    required_error: "Please select your average daily surplus",
  }),
  food_types: z.array(z.string()).min(1, "Select at least one food type you donate"),
  pickup_notes: z.string().max(300, "Maximum 300 characters").optional(),
});

export const verificationSchema = verificationStep1Schema
  .merge(verificationStep2Schema)
  .merge(verificationStep3Schema)
  .merge(verificationStep4Schema);

export type VerificationFormData = z.infer<typeof verificationSchema>;
export type VerificationStep1 = z.infer<typeof verificationStep1Schema>;
export type VerificationStep2 = z.infer<typeof verificationStep2Schema>;
export type VerificationStep3 = z.infer<typeof verificationStep3Schema>;
export type VerificationStep4 = z.infer<typeof verificationStep4Schema>;