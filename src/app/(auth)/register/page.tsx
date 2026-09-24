"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";

type Role = "donor_admin" | "shelter_admin" | "verified_driver" | "casual_volunteer";

const roleLabels: Record<Role, string> = {
  donor_admin: "Food Donor (Restaurant, Grocery, Caterer, etc.)",
  shelter_admin: "Shelter / NGO / Food Bank",
  verified_driver: "Verified Volunteer Driver",
  casual_volunteer: "Casual Volunteer",
};

const roleDescriptions: Record<Role, string> = {
  donor_admin: "Post surplus food, track impact, get tax certificates",
  shelter_admin: "Receive donations, manage capacity, coordinate deliveries",
  verified_driver: "Pick up and deliver food, optimized routes",
  casual_volunteer: "Help with deliveries when available",
};

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get("role") as Role) || "donor_admin";
  
  const [role, setRole] = useState<Role>(defaultRole);
  const [formData, setFormData] = useState({
    display_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.display_name.trim()) newErrors.display_name = "Name is required";
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
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      toast.success({ title: "Account created!", description: "Please check your email to verify your account." });
      router.push("/login?registered=true");
    } catch (error) {
      toast.error({ 
        title: "Registration failed", 
        description: error instanceof Error ? error.message : "Please try again" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="mb-8">
        <h2 className="font-display text-display-sm text-brand-black mb-2">CREATE ACCOUNT</h2>
        <p className="font-body text-body-sm text-brand-black/60">Join the food rescue network</p>
      </div>

      <div className="mb-6">
        <label className="label-text text-brand-black block mb-4">I AM A</label>
        <div className="space-y-3" role="radiogroup" aria-label="Select your role">
          {(Object.keys(roleLabels) as Role[]).map((r) => (
            <label
              key={r}
              className={`flex items-center gap-4 p-4 border-2 cursor-pointer transition-all ${
                role === r 
                  ? "border-brand-red bg-brand-red/5" 
                  : "border-brand-black/20 hover:border-brand-black"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r}
                checked={role === r}
                onChange={() => setRole(r)}
                className="w-4 h-4 accent-brand-red"
                aria-label={roleLabels[r]}
              />
              <div className="flex-1">
                <div className="font-body font-bold text-brand-black">{roleLabels[r]}</div>
                <div className="font-body text-body-sm text-brand-black/60">{roleDescriptions[r]}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Input
          label="Full Name"
          placeholder="e.g., Ravi Kumar"
          value={formData.display_name}
          onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
          error={errors.display_name}
          autoComplete="name"
          required
        />
        
        <Input
          label="Email"
          type="email"
          placeholder="e.g., ravi@restaurant.com"
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
          placeholder="Repeat password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          error={errors.confirmPassword}
          autoComplete="new-password"
          required
        />
      </div>

      <Button type="submit" variant="primary" className="w-full" loading={loading}>
        CREATE ACCOUNT
      </Button>

      <p className="text-center font-body text-body-sm text-brand-black/60">
        Already have an account?{' '}
        <Link href={`/login?role=${role}`} className="text-brand-red hover:underline font-bold">
          SIGN IN
        </Link>
      </p>
    </form>
  );
}