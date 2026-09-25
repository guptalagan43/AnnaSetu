"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";

type AccountCategory =
  | "donor_admin"
  | "shelter_admin"
  | "verified_driver"
  | "shelter_coordinator";

const VEHICLE_OPTIONS = [
  { value: "bike", label: "Motorcycle / Bike", icon: "🏍️", desc: "Quick small pickups (< 15 kg)" },
  { value: "scooter", label: "Scooter", icon: "🛵", desc: "Small bags & containers (< 15 kg)" },
  { value: "auto", label: "Auto Rickshaw", icon: "🛺", desc: "Medium loads (< 80 kg)" },
  { value: "car", label: "Car / Hatchback", icon: "🚗", desc: "Medium loads & trays (< 100 kg)" },
  { value: "suv", label: "SUV / MUV", icon: "🚙", desc: "Large loads & multiple trays (< 150 kg)" },
  { value: "van", label: "Delivery Van / Tempo", icon: "🚐", desc: "Large multi-tray rescue runs (> 100 kg)" },
  { value: "truck", label: "Mini Truck / Pickup", icon: "🚚", desc: "Bulk rescue operations (> 200 kg)" },
];

interface RoleMeta {
  id: AccountCategory;
  num: string;
  icon: string;
  title: string;
  badge: string;
  subtitle: string;
  accentColor: string;
  highlights: string[];
  destination: string;
  orgLabel?: string;
  customField?: {
    name: string;
    label: string;
    placeholder: string;
    type?: string;
    isVehicleSelect?: boolean;
  };
}

const CATEGORIES: RoleMeta[] = [
  {
    id: "donor_admin",
    num: "01",
    icon: "🍱",
    title: "Food Donor",
    badge: "COMMERCIAL DONOR",
    subtitle: "Restaurants, Hotels, Caterers, Supermarkets & Corporate Canteens",
    accentColor: "border-brand-red",
    destination: "/donor",
    orgLabel: "Business / Restaurant Name",
    customField: {
      name: "fssaiNumber",
      label: "FSSAI License Number (Optional)",
      placeholder: "14-digit FSSAI Registration",
    },
    highlights: [
      "Post surplus batches in <60 seconds",
      "Section 80G tax deduction certificates",
      "Automated volunteer driver matching",
      "Zero food waste ESG metrics",
    ],
  },
  {
    id: "shelter_admin",
    num: "02",
    icon: "🏠",
    title: "Shelter / NGO",
    badge: "RELIEF CHARITY",
    subtitle: "Orphanages, Homeless Shelters, Food Banks & Community Relief",
    accentColor: "border-brand-black",
    destination: "/shelter",
    orgLabel: "Shelter / NGO Legal Title",
    customField: {
      name: "dailyCapacity",
      label: "Estimated Daily Beneficiary Capacity",
      placeholder: "e.g., 150 meals/day",
    },
    highlights: [
      "100% Free surplus food deliveries",
      "Live GPS delivery arrival tracking",
      "Dietary & allergen preference filters",
      "Capacity management safeguards",
    ],
  },
  {
    id: "verified_driver",
    num: "03",
    icon: "🚚",
    title: "Rescue Driver",
    badge: "VOLUNTEER FLEET",
    subtitle: "Logistics Volunteers, 2-Wheeler Couriers & Delivery Partners",
    accentColor: "border-brand-red",
    destination: "/driver",
    customField: {
      name: "vehicleType",
      label: "Primary Vehicle Type",
      placeholder: "Select your rescue vehicle",
      isVehicleSelect: true,
    },
    highlights: [
      "Turn on availability whenever free",
      "AI-optimized pickup & drop routes",
      "PIN-verified safe handovers",
      "National social impact leaderboard",
    ],
  },
  {
    id: "shelter_coordinator",
    num: "04",
    icon: "🛡️",
    title: "Network Coordinator",
    badge: "NETWORK ADMIN",
    subtitle: "Regional Coordinators managing NGO/Shelter networks, analytics & food redistribution oversight",
    accentColor: "border-brand-black",
    destination: "/coordinator",
    orgLabel: "Organization / Network Name",
    highlights: [
      "Manage all NGOs, shelters & donors",
      "Full redistribution analytics dashboard",
      "Monitor all drivers & deliveries live",
      "Network-wide reporting & compliance",
    ],
  },
];

function RegisterForm() {
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams.get("role") as AccountCategory | null;
  const initialRole = CATEGORIES.some((c) => c.id === initialRoleParam)
    ? initialRoleParam
    : null;

  const [selectedRole, setSelectedRole] = useState<AccountCategory | null>(initialRole);
  const [expandKey, setExpandKey] = useState(0);
  const [formData, setFormData] = useState({
    display_name: "",
    org_name: "",
    custom_field: "",
    email: searchParams.get("email") || "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const activeCategory = CATEGORIES.find((c) => c.id === selectedRole);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.display_name.trim()) newErrors.display_name = "Full name is required";
    if (activeCategory?.orgLabel && !formData.org_name.trim()) {
      newErrors.org_name = `${activeCategory.orgLabel} is required`;
    }
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !selectedRole) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: formData.display_name,
          fullName: formData.display_name,
          organizationName: formData.org_name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: selectedRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      toast.success({
        title: "Account Created!",
        description: `Welcome to AnnaSetu! Opening your ${activeCategory?.title} dashboard...`,
      });

      const destination = activeCategory?.destination || "/donor";
      window.location.href = destination;
    } catch (error) {
      toast.error({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Please review the form fields",
      });
      setLoading(false);
    }
  };

  const handleSelectRole = (id: AccountCategory) => {
    setSelectedRole(id);
    setExpandKey((k) => k + 1);
  };

  return (
    <div className="w-full">
      {/* ─── PHASE A: ROLE SELECTION CARDS ─── */}
      {!selectedRole && (
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-block bg-brand-red text-brand-white font-mono text-xs font-bold px-3 py-1 mb-2">
              STEP 1: SELECT YOUR ACCOUNT CATEGORY
            </div>
            <h2 className="font-display text-display-md text-brand-black tracking-tight">
              JOIN THE FOOD RESCUE NETWORK
            </h2>
            <p className="font-body text-body-sm text-brand-black/70 mt-1">
              Select your organization type below to open a specialized rescue portal.
            </p>
          </div>

          {/* Full-width 4-column grid with proper margins */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                onClick={() => handleSelectRole(cat.id)}
                className="group cursor-pointer bg-brand-cream border-4 border-brand-black p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-brutal hover:border-brand-red"
                style={{ minHeight: '360px' }}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b-2 border-brand-black/20 pb-3 mb-4">
                    <span className="font-mono text-2xl font-black text-brand-black/40 group-hover:text-brand-red transition-colors">
                      {cat.num}
                    </span>
                    <span className="font-mono text-[10px] font-bold bg-brand-black text-brand-white px-2 py-0.5 tracking-wider">
                      {cat.badge}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="text-4xl mb-3">{cat.icon}</div>
                  <h3 className="font-display text-2xl text-brand-black mb-2 tracking-tight group-hover:text-brand-red transition-colors">
                    {cat.title}
                  </h3>
                  <p className="font-body text-xs text-brand-black/70 leading-relaxed mb-4">
                    {cat.subtitle}
                  </p>

                  {/* Perks Checklist */}
                  <div className="space-y-2 border-t-2 border-brand-black/10 pt-3">
                    {cat.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-brand-red font-mono font-bold text-xs mt-0.5">✓</span>
                        <span className="font-body text-[11px] text-brand-black/80 leading-tight">
                          {h}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Button */}
                <div className="mt-6 pt-4 border-t-2 border-brand-black/20">
                  <button
                    type="button"
                    className="w-full btn-primary text-xs py-2 group-hover:bg-brand-red transition-colors"
                  >
                    SELECT ROLE →
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-6 border-t-2 border-brand-black/10">
            <p className="font-body text-body-sm text-brand-black/60">
              Already have an account?{" "}
              <Link href="/login" className="text-brand-red hover:underline font-bold">
                SIGN IN HERE →
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* ─── PHASE B: EXPANDED FORM — seamless slide-in animation ─── */}
      {selectedRole && activeCategory && (
        <div
          key={expandKey}
          className="max-w-2xl mx-auto"
          style={{ animation: 'expandForm 0.35s cubic-bezier(0.22,1,0.36,1) forwards' }}
        >
          {/* Top Bar with Back Button */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setSelectedRole(null)}
              className="inline-flex items-center gap-2 font-mono text-xs font-bold text-brand-black/70 hover:text-brand-red transition-colors border-2 border-brand-black bg-brand-cream px-3 py-1.5 shadow-sm"
            >
              ← BACK TO ROLE SELECTION
            </button>
            <div className="font-mono text-xs font-bold bg-brand-red text-brand-white px-3 py-1">
              CATEGORY: {activeCategory.badge}
            </div>
          </div>

          {/* Expanded Registration Card */}
          <div className="brutal-card bg-brand-cream border-4 border-brand-black p-6 md:p-8 space-y-6">
            {/* Header */}
            <div className="border-b-2 border-brand-black pb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{activeCategory.icon}</span>
                  <div>
                    <h2 className="font-display text-display-md text-brand-black tracking-tight leading-none">
                      {activeCategory.title.toUpperCase()} REGISTRATION
                    </h2>
                    <p className="font-body text-body-sm text-brand-black/70 mt-1">
                      {activeCategory.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Contact Person / Full Name"
                  type="text"
                  placeholder="e.g., Rajesh Sharma"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  error={errors.display_name}
                  required
                />

                {activeCategory.orgLabel ? (
                  <Input
                    label={activeCategory.orgLabel}
                    type="text"
                    placeholder="Official organization name"
                    value={formData.org_name}
                    onChange={(e) => setFormData({ ...formData, org_name: e.target.value })}
                    error={errors.org_name}
                    required
                  />
                ) : activeCategory.customField?.isVehicleSelect ? (
                  <div>
                    <label className="label-text block mb-2">{activeCategory.customField.label}</label>
                    <select
                      value={formData.custom_field || VEHICLE_OPTIONS[0].value}
                      onChange={(e) => setFormData({ ...formData, custom_field: e.target.value })}
                      className="input-field w-full px-4 py-3 bg-brand-white border-2 border-brand-black font-body text-body-md"
                    >
                      {VEHICLE_OPTIONS.map((v) => (
                        <option key={v.value} value={v.value}>
                          {v.icon} {v.label} — {v.desc}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <Input
                    label={activeCategory.customField?.label || "Details"}
                    type="text"
                    placeholder={activeCategory.customField?.placeholder || ""}
                    value={formData.custom_field}
                    onChange={(e) => setFormData({ ...formData, custom_field: e.target.value })}
                  />
                )}
              </div>

              {activeCategory.customField && activeCategory.orgLabel && (
                <Input
                  label={activeCategory.customField.label}
                  type="text"
                  placeholder={activeCategory.customField.placeholder}
                  value={formData.custom_field}
                  onChange={(e) => setFormData({ ...formData, custom_field: e.target.value })}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="e.g., contact@organization.org"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={errors.email}
                  autoComplete="email"
                  required
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  error={errors.phone}
                  autoComplete="tel"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={errors.password}
                  autoComplete="new-password"
                  required
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-4 text-base tracking-wider"
                  loading={loading}
                >
                  CREATE {activeCategory.title.toUpperCase()} ACCOUNT →
                </Button>
              </div>

              <div className="space-y-2 text-center pt-2">
                <p className="font-body text-xs text-brand-black/60">
                  By completing registration, you agree to AnnaSetu&apos;s{" "}
                  <Link href="/terms" className="underline hover:text-brand-red font-medium">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline hover:text-brand-red font-medium">
                    Privacy Policy
                  </Link>.
                </p>

                <p className="font-body text-body-sm text-brand-black/70 pt-2 border-t border-brand-black/10">
                  Already registered?{" "}
                  <Link href="/login" className="text-brand-red hover:underline font-bold">
                    SIGN IN TO YOUR DASHBOARD →
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <>
      <style>{`
        @keyframes expandForm {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)  scale(1); }
        }
      `}</style>
      <Suspense fallback={<div className="p-8 text-center font-display text-2xl">LOADING PORTAL...</div>}>
        <RegisterForm />
      </Suspense>
    </>
  );
}