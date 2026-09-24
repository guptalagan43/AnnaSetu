"use client";

import { useState, useEffect } from "react";
import { getSession } from "@/lib/auth/guards";
import { Sidebar, MobileSidebarToggle } from "@/components/dashboards/Sidebar";
import { TopBar } from "@/components/dashboards/TopBar";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [userRole, setUserRole] = useState<string>("donor_staff");
  const [userName, setUserName] = useState<string>("User");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fetch user session on mount
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUserRole(data.user.role);
          setUserName(data.user.display_name || data.user.email?.split("@")[0] || "User");
        }
      })
      .catch(() => {
        // If fetch fails, redirect to login
        window.location.href = "/login?redirect=" + window.location.pathname;
      });
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-brand-white flex items-center justify-center">
        <div className="font-body text-body-lg text-brand-black">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-white">
      <MobileSidebarToggle isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Sidebar userRole={userRole} />
      
      <div className={cn(
        "lg:ml-64 transition-all duration-300",
        sidebarOpen ? "ml-64" : "ml-0"
      )}>
        <TopBar 
          userRole={userRole} 
          userName={userName} 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />
        
        <main 
          id="main-content" 
          className="pt-16 lg:pt-16 min-h-screen pb-8"
          role="main"
        >
          <div className="max-w-7xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}