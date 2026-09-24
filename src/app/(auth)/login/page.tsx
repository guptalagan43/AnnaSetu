"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const redirect = searchParams.get("redirect") || "/donor";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      toast.success({ title: "Welcome back!", description: "Redirecting to your dashboard..." });
      router.push(redirect);
      router.refresh();
    } catch (error) {
      toast.error({ 
        title: "Login failed", 
        description: error instanceof Error ? error.message : "Please check your credentials" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="mb-8">
        <h2 className="font-display text-display-sm text-brand-black mb-2">SIGN IN</h2>
        <p className="font-body text-body-sm text-brand-black/60">Access your dashboard</p>
      </div>

      {registered && (
        <div className="bg-ers-safe/10 border-2 border-ers-safe p-4 mb-6">
          <p className="font-body text-body-sm text-ers-safe">
            Account created successfully! Please verify your email, then sign in.
          </p>
        </div>
      )}

      <div className="space-y-4">
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
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          error={errors.password}
          autoComplete="current-password"
          required
        />
      </div>

      <Button type="submit" variant="primary" className="w-full" loading={loading}>
        SIGN IN
      </Button>

      <div className="space-y-3 text-center">
        <Link href="/forgot-password" className="font-body text-body-sm text-brand-red hover:underline block">
          FORGOT PASSWORD?
        </Link>
        <p className="font-body text-body-sm text-brand-black/60">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-brand-red hover:underline font-bold">
            CREATE ONE
          </Link>
        </p>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-display">LOADING...</div>}>
      <LoginForm />
    </Suspense>
  );
}