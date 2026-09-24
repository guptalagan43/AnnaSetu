"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";
import {
  verificationStep1Schema,
  verificationStep2Schema,
  verificationStep3Schema,
  verificationStep4Schema,
  type VerificationStep1,
  type VerificationStep2,
  type VerificationStep3,
  type VerificationStep4,
} from "@/lib/validators/verification.schema";

const DRAFT_KEY = "annasetu:donor-verify-draft";
const TOTAL_STEPS = 4;

// Leaflet map loaded client-side only
const LocationPicker = dynamic(() => import("@/components/verification/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 border-2 border-brand-black bg-brand-cream flex items-center justify-center">
      <span className="font-body text-brand-black/50">Loading map…</span>
    </div>
  ),
});

// ── Step progress bar ──────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  const steps = [
    "BUSINESS INFO",
    "DOCUMENTS",
    "LOCATION",
    "OPERATIONS",
  ];
  return (
    <div className="mb-8">
      <div className="flex items-center gap-0">
        {steps.map((label, i) => {
          const stepNum = i + 1;
          const isDone = stepNum < current;
          const isActive = stepNum === current;
          return (
            <div key={label} className="flex-1 flex flex-col items-center relative">
              {/* connector line */}
              {i > 0 && (
                <div
                  className={`absolute left-0 top-4 -translate-y-1/2 h-0.5 w-1/2 ${
                    isDone ? "bg-brand-red" : "bg-brand-black/20"
                  }`}
                />
              )}
              {i < total - 1 && (
                <div
                  className={`absolute right-0 top-4 -translate-y-1/2 h-0.5 w-1/2 ${
                    stepNum < current ? "bg-brand-red" : "bg-brand-black/20"
                  }`}
                />
              )}
              <div
                className={`relative z-10 w-8 h-8 border-2 border-brand-black flex items-center justify-center font-display text-sm transition-all ${
                  isDone
                    ? "bg-brand-red text-brand-white"
                    : isActive
                    ? "bg-brand-black text-brand-white"
                    : "bg-brand-white text-brand-black/40"
                }`}
              >
                {isDone ? "✓" : stepNum}
              </div>
              <span
                className={`mt-1 font-body text-[10px] font-bold uppercase tracking-wider text-center ${
                  isActive ? "text-brand-black" : "text-brand-black/40"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 font-mono text-xs text-brand-black/50 text-center">
        Step {current} of {total}
      </p>
    </div>
  );
}

// ── File dropzone field ────────────────────────────────────────────
interface DocDropzoneProps {
  label: string;
  hint?: string;
  required?: boolean;
  onUpload: (url: string) => void;
  currentUrl?: string;
}

function DocDropzone({ label, hint, required, onUpload, currentUrl }: DocDropzoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const f = accepted[0];
      if (!f) return;
      setFile(f);
      setUploading(true);
      try {
        // Upload to Supabase Storage via API
        const formData = new FormData();
        formData.append("file", f);
        formData.append("bucket", "verification-docs");
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        onUpload(data.url as string);
        toast.success({ title: "Uploaded", description: f.name });
      } catch (err) {
        toast.error({
          title: "Upload failed",
          description: err instanceof Error ? err.message : "Try again",
        });
        setFile(null);
      } finally {
        setUploading(false);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "image/*": [".jpg", ".jpeg", ".png"] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5 MB
  });

  const hasDoc = !!file || !!currentUrl;

  return (
    <div className="w-full">
      <label className="block label-text text-brand-black mb-2">
        {label}
        {required && <span className="text-brand-red ml-1">*</span>}
      </label>
      {hint && <p className="font-body text-body-sm text-brand-black/50 mb-2">{hint}</p>}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-brand-red bg-brand-red/5"
            : hasDoc
            ? "border-brand-black bg-brand-cream"
            : "border-brand-black/30 hover:border-brand-black"
        }`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <p className="font-body text-sm text-brand-black/60">Uploading…</p>
        ) : hasDoc ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl">✓</span>
            <span className="font-body text-sm font-bold text-brand-black">
              {file?.name || "Document uploaded"}
            </span>
          </div>
        ) : (
          <>
            <div className="text-3xl mb-2">📎</div>
            <p className="font-body text-sm text-brand-black/60">
              Drop PDF or image here, or <span className="font-bold text-brand-black underline">browse</span>
            </p>
            <p className="font-mono text-xs text-brand-black/40 mt-1">Max 5 MB · PDF, JPG, PNG</p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Step 1: Business Info ──────────────────────────────────────────
function Step1({
  defaultValues,
  onNext,
}: {
  defaultValues: Partial<VerificationStep1>;
  onNext: (data: VerificationStep1) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerificationStep1>({
    resolver: zodResolver(verificationStep1Schema),
    defaultValues,
  });

  const businessTypes = [
    { value: "restaurant", label: "Restaurant / Dhaba" },
    { value: "grocery_store", label: "Grocery / Supermarket" },
    { value: "caterer", label: "Caterer / Event Kitchen" },
    { value: "campus_dining", label: "Campus / Institutional Dining" },
    { value: "cloud_kitchen", label: "Cloud Kitchen" },
    { value: "other", label: "Other Food Business" },
  ];

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5" noValidate>
      <div>
        <label htmlFor="business_type" className="block label-text text-brand-black mb-2">
          BUSINESS TYPE <span className="text-brand-red">*</span>
        </label>
        <select
          id="business_type"
          {...register("business_type")}
          className="input-field"
        >
          <option value="">Select type…</option>
          {businessTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {errors.business_type && (
          <p className="mt-1.5 font-body text-body-sm text-brand-red" role="alert">
            {errors.business_type.message}
          </p>
        )}
      </div>

      <Input
        label="Business / Restaurant Name"
        placeholder="e.g., MG Road Dhaba"
        error={errors.business_name?.message}
        required
        {...register("business_name")}
      />

      <Input
        label="Contact Person Name"
        placeholder="e.g., Ravi Kumar"
        error={errors.contact_person_name?.message}
        required
        {...register("contact_person_name")}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Contact Email"
          type="email"
          placeholder="ravi@restaurant.com"
          error={errors.contact_email?.message}
          required
          {...register("contact_email")}
        />
        <Input
          label="Contact Phone"
          type="tel"
          placeholder="+91 98765 43210"
          error={errors.contact_phone?.message}
          required
          {...register("contact_phone")}
        />
      </div>

      <div>
        <label htmlFor="why_donate" className="block label-text text-brand-black mb-2">
          WHY DO YOU WANT TO DONATE?{" "}
          <span className="font-body font-normal normal-case text-brand-black/50 text-xs">(Optional · max 200 chars)</span>
        </label>
        <textarea
          id="why_donate"
          rows={3}
          placeholder="Tell us what drives you to rescue food…"
          className="input-field resize-none"
          {...register("why_donate")}
        />
        {errors.why_donate && (
          <p className="mt-1.5 font-body text-body-sm text-brand-red" role="alert">
            {errors.why_donate.message}
          </p>
        )}
      </div>

      <Button type="submit" variant="primary" className="w-full">
        NEXT: DOCUMENTS →
      </Button>
    </form>
  );
}

// ── Step 2: Documents ──────────────────────────────────────────────
function Step2({
  defaultValues,
  onNext,
  onBack,
}: {
  defaultValues: Partial<VerificationStep2>;
  onNext: (data: VerificationStep2) => void;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VerificationStep2>({
    resolver: zodResolver(verificationStep2Schema),
    defaultValues,
  });

  const fssaiDocUrl = watch("fssai_doc_url");
  const gstDocUrl = watch("gst_doc_url");
  const panDocUrl = watch("pan_doc_url");

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5" noValidate>
      <div className="p-4 border-2 border-brand-black bg-brand-cream">
        <p className="font-body text-body-sm font-bold text-brand-black mb-1">
          🔒 Your documents are stored encrypted and only visible to our verification team.
        </p>
        <p className="font-body text-body-sm text-brand-black/60">
          FSSAI license is mandatory. GST and PAN are required for tax certificate generation.
        </p>
      </div>

      <Input
        label="FSSAI License Number"
        placeholder="14-digit number"
        hint="Your 14-digit FSSAI registration or license number"
        error={errors.fssai_number?.message}
        required
        maxLength={14}
        {...register("fssai_number")}
      />

      <div>
        <label htmlFor="fssai_expiry" className="block label-text text-brand-black mb-2">
          FSSAI EXPIRY DATE <span className="text-brand-red">*</span>
        </label>
        <input
          id="fssai_expiry"
          type="date"
          className="input-field"
          {...register("fssai_expiry")}
        />
        {errors.fssai_expiry && (
          <p className="mt-1.5 font-body text-body-sm text-brand-red" role="alert">
            {errors.fssai_expiry.message}
          </p>
        )}
      </div>

      <DocDropzone
        label="FSSAI License Document"
        hint="Upload your FSSAI license certificate (PDF or photo)"
        required
        currentUrl={fssaiDocUrl}
        onUpload={(url) => setValue("fssai_doc_url", url)}
      />

      <div className="border-t-2 border-brand-black/10 pt-5">
        <Input
          label="GST Number"
          placeholder="15-character GST number"
          hint="Optional — required only for tax certificate generation"
          error={errors.gst_number?.message}
          maxLength={15}
          {...register("gst_number")}
        />
      </div>

      <DocDropzone
        label="GST Certificate"
        hint="Optional — upload if available"
        currentUrl={gstDocUrl}
        onUpload={(url) => setValue("gst_doc_url", url)}
      />

      <div className="border-t-2 border-brand-black/10 pt-5">
        <Input
          label="PAN Number"
          placeholder="10-character PAN"
          hint="Required for Section 80G tax certificates"
          error={errors.pan_number?.message}
          required
          maxLength={10}
          {...register("pan_number")}
        />
      </div>

      <DocDropzone
        label="PAN Card"
        hint="Upload a scan or photo of your PAN card"
        required
        currentUrl={panDocUrl}
        onUpload={(url) => setValue("pan_doc_url", url)}
      />

      <div className="flex gap-3">
        <Button type="button" variant="ghost" onClick={onBack} className="flex-1">
          ← BACK
        </Button>
        <Button type="submit" variant="primary" className="flex-1">
          NEXT: LOCATION →
        </Button>
      </div>
    </form>
  );
}

// ── Step 3: Location ───────────────────────────────────────────────
function Step3({
  defaultValues,
  onNext,
  onBack,
}: {
  defaultValues: Partial<VerificationStep3>;
  onNext: (data: VerificationStep3) => void;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VerificationStep3>({
    resolver: zodResolver(verificationStep3Schema),
    defaultValues,
  });

  const lat = watch("lat");
  const lng = watch("lng");

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5" noValidate>
      <Input
        label="Full Address"
        placeholder="e.g., 12, Gandhi Nagar, MG Road"
        hint="Building name, street, area"
        error={errors.address?.message}
        required
        {...register("address")}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <Input
            label="City"
            placeholder="e.g., Bengaluru"
            error={errors.city?.message}
            required
            {...register("city")}
          />
        </div>
        <div className="md:col-span-1">
          <Input
            label="State"
            placeholder="e.g., Karnataka"
            error={errors.state?.message}
            required
            {...register("state")}
          />
        </div>
        <div className="md:col-span-1">
          <Input
            label="PIN Code"
            placeholder="560001"
            error={errors.pincode?.message}
            required
            maxLength={6}
            {...register("pincode")}
          />
        </div>
      </div>

      <div>
        <label className="block label-text text-brand-black mb-2">
          PIN YOUR PICKUP LOCATION <span className="text-brand-red">*</span>
        </label>
        <p className="font-body text-body-sm text-brand-black/60 mb-3">
          Click on the map to set your exact pickup point. Drivers will use this to navigate.
        </p>
        <LocationPicker
          lat={lat}
          lng={lng}
          onPick={(newLat, newLng) => {
            setValue("lat", newLat);
            setValue("lng", newLng);
          }}
        />
        {(errors.lat || errors.lng) && (
          <p className="mt-2 font-body text-body-sm text-brand-red" role="alert">
            Please click the map to set your location
          </p>
        )}
        {lat && lng && (
          <p className="mt-2 font-mono text-xs text-brand-black/50">
            📍 {lat.toFixed(6)}, {lng.toFixed(6)}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="ghost" onClick={onBack} className="flex-1">
          ← BACK
        </Button>
        <Button type="submit" variant="primary" className="flex-1">
          NEXT: OPERATIONS →
        </Button>
      </div>
    </form>
  );
}

// ── Step 4: Operating Hours + Surplus ─────────────────────────────
function Step4({
  defaultValues,
  onNext,
  onBack,
  submitting,
}: {
  defaultValues: Partial<VerificationStep4>;
  onNext: (data: VerificationStep4) => void;
  onBack: () => void;
  submitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VerificationStep4>({
    resolver: zodResolver(verificationStep4Schema),
    defaultValues: {
      operating_days: defaultValues.operating_days || [],
      food_types: defaultValues.food_types || [],
      ...defaultValues,
    },
  });

  const operatingDays = watch("operating_days") || [];
  const foodTypes = watch("food_types") || [];

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const surplusOptions = [
    { value: "<5kg", label: "< 5 kg / day", sub: "Small household or stall" },
    { value: "5-20kg", label: "5 – 20 kg / day", sub: "Small restaurant or shop" },
    { value: "20-50kg", label: "20 – 50 kg / day", sub: "Mid-size kitchen" },
    { value: "50kg+", label: "50 kg+ / day", sub: "Large caterer or institution" },
  ];
  const foodTypeOptions = [
    "Cooked meals",
    "Raw vegetables",
    "Packaged food",
    "Bakery / bread",
    "Dairy",
    "Fruits",
    "Rice / grains",
    "Pulses",
  ];

  const toggleDay = (day: string) => {
    const next = operatingDays.includes(day)
      ? operatingDays.filter((d) => d !== day)
      : [...operatingDays, day];
    setValue("operating_days", next, { shouldValidate: true });
  };

  const toggleFoodType = (type: string) => {
    const next = foodTypes.includes(type)
      ? foodTypes.filter((t) => t !== type)
      : [...foodTypes, type];
    setValue("food_types", next, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6" noValidate>
      {/* Operating days */}
      <div>
        <label className="block label-text text-brand-black mb-3">
          OPERATING DAYS <span className="text-brand-red">*</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {days.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`px-4 py-2 border-2 border-brand-black font-body font-bold text-sm transition-all ${
                operatingDays.includes(day)
                  ? "bg-brand-black text-brand-white"
                  : "bg-brand-white text-brand-black hover:bg-brand-cream"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
        {errors.operating_days && (
          <p className="mt-1.5 font-body text-body-sm text-brand-red" role="alert">
            {errors.operating_days.message}
          </p>
        )}
      </div>

      {/* Operating hours */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="hours_start" className="block label-text text-brand-black mb-2">
            OPENS AT <span className="text-brand-red">*</span>
          </label>
          <input
            id="hours_start"
            type="time"
            className="input-field"
            {...register("operating_hours_start")}
          />
          {errors.operating_hours_start && (
            <p className="mt-1 font-body text-body-sm text-brand-red" role="alert">
              {errors.operating_hours_start.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="hours_end" className="block label-text text-brand-black mb-2">
            CLOSES AT <span className="text-brand-red">*</span>
          </label>
          <input
            id="hours_end"
            type="time"
            className="input-field"
            {...register("operating_hours_end")}
          />
          {errors.operating_hours_end && (
            <p className="mt-1 font-body text-body-sm text-brand-red" role="alert">
              {errors.operating_hours_end.message}
            </p>
          )}
        </div>
      </div>

      {/* Avg daily surplus */}
      <div>
        <label className="block label-text text-brand-black mb-3">
          AVERAGE DAILY SURPLUS <span className="text-brand-red">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {surplusOptions.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-4 border-2 cursor-pointer transition-all ${
                watch("avg_daily_surplus") === opt.value
                  ? "border-brand-red bg-brand-red/5"
                  : "border-brand-black/20 hover:border-brand-black"
              }`}
            >
              <input
                type="radio"
                value={opt.value}
                className="mt-1 accent-brand-red"
                {...register("avg_daily_surplus")}
              />
              <div>
                <div className="font-body font-bold text-brand-black text-sm">{opt.label}</div>
                <div className="font-body text-body-sm text-brand-black/60">{opt.sub}</div>
              </div>
            </label>
          ))}
        </div>
        {errors.avg_daily_surplus && (
          <p className="mt-1.5 font-body text-body-sm text-brand-red" role="alert">
            {errors.avg_daily_surplus.message}
          </p>
        )}
      </div>

      {/* Food types */}
      <div>
        <label className="block label-text text-brand-black mb-3">
          FOOD TYPES YOU DONATE <span className="text-brand-red">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {foodTypeOptions.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleFoodType(type)}
              className={`px-3 py-1.5 border-2 border-brand-black font-body text-sm transition-all ${
                foodTypes.includes(type)
                  ? "bg-brand-red text-brand-white border-brand-red"
                  : "bg-brand-white text-brand-black hover:bg-brand-cream"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        {errors.food_types && (
          <p className="mt-1.5 font-body text-body-sm text-brand-red" role="alert">
            {errors.food_types.message}
          </p>
        )}
      </div>

      {/* Pickup notes */}
      <div>
        <label htmlFor="pickup_notes" className="block label-text text-brand-black mb-2">
          PICKUP NOTES{" "}
          <span className="font-body font-normal normal-case text-brand-black/50 text-xs">(Optional · max 300 chars)</span>
        </label>
        <textarea
          id="pickup_notes"
          rows={3}
          placeholder="e.g., Ring the bell at the back entrance. Ask for Ravi. Food packed by 9pm daily."
          className="input-field resize-none"
          {...register("pickup_notes")}
        />
        {errors.pickup_notes && (
          <p className="mt-1 font-body text-body-sm text-brand-red" role="alert">
            {errors.pickup_notes.message}
          </p>
        )}
      </div>

      <div className="border-t-2 border-brand-black/10 pt-4">
        <p className="font-body text-body-sm text-brand-black/60 mb-4">
          By submitting, you confirm all information is accurate. Our team will review within 2–3 business days.
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="ghost" onClick={onBack} className="flex-1" disabled={submitting}>
          ← BACK
        </Button>
        <Button type="submit" variant="primary" className="flex-1" loading={submitting}>
          SUBMIT APPLICATION
        </Button>
      </div>
    </form>
  );
}

// ── Main page ──────────────────────────────────────────────────────
export default function DonorVerifyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<
    VerificationStep1 & VerificationStep2 & VerificationStep3 & VerificationStep4
  >>({});

  // Load draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as typeof formData & { __step?: number };
        setFormData(draft);
        if (draft.__step && draft.__step > 1) {
          setStep(draft.__step);
        }
        toast.success({ title: "Draft restored", description: "Your previous progress was loaded." });
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Save draft on every data change
  const saveDraft = useCallback(
    (data: typeof formData, currentStep: number) => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...data, __step: currentStep }));
      } catch {
        // ignore storage errors
      }
    },
    []
  );

  const handleStep1 = (data: VerificationStep1) => {
    const updated = { ...formData, ...data };
    setFormData(updated);
    saveDraft(updated, 2);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStep2 = (data: VerificationStep2) => {
    const updated = { ...formData, ...data };
    setFormData(updated);
    saveDraft(updated, 3);
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStep3 = (data: VerificationStep3) => {
    const updated = { ...formData, ...data };
    setFormData(updated);
    saveDraft(updated, 4);
    setStep(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStep4 = async (data: VerificationStep4) => {
    const fullData = { ...formData, ...data };
    setSubmitting(true);

    try {
      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullData),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Submission failed");
      }

      // Clear draft on success
      localStorage.removeItem(DRAFT_KEY);

      toast.success({
        title: "Application submitted!",
        description: "We'll review your documents and contact you within 2–3 business days.",
      });

      router.push("/donor?verified=pending");
    } catch (err) {
      toast.error({
        title: "Submission failed",
        description: err instanceof Error ? err.message : "Please try again",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-display-sm text-brand-black mb-2">
          DONOR VERIFICATION
        </h2>
        <p className="font-body text-body-sm text-brand-black/60">
          Complete all 4 steps to apply for food donation privileges. Your application will be reviewed within 2–3 business days.
        </p>
      </div>

      <StepIndicator current={step} total={TOTAL_STEPS} />

      {step === 1 && (
        <Step1
          defaultValues={formData}
          onNext={handleStep1}
        />
      )}
      {step === 2 && (
        <Step2
          defaultValues={formData}
          onNext={handleStep2}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <Step3
          defaultValues={formData}
          onNext={handleStep3}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && (
        <Step4
          defaultValues={formData}
          onNext={handleStep4}
          onBack={() => setStep(3)}
          submitting={submitting}
        />
      )}
    </div>
  );
}
