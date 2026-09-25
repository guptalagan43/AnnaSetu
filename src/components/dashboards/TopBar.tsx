"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

interface TopBarProps {
  userRole: string;
  userName: string;
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export function TopBar({ userRole, userName, onMenuToggle, sidebarOpen }: TopBarProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  const roleLabels: Record<string, string> = {
    donor_admin: "DONOR ADMIN",
    donor_staff: "DONOR STAFF",
    shelter_admin: "SHELTER ADMIN",
    shelter_coordinator: "SHELTER COORD",
    verified_driver: "VERIFIED DRIVER",
    casual_volunteer: "VOLUNTEER",
    super_admin: "SUPER ADMIN",
    platform_admin: "PLATFORM ADMIN",
    moderator: "MODERATOR",
    observer_gov: "GOV OBSERVER",
    observer_esg: "ESG REPORTER",
  };

  return (
    <header className={cn(
      "fixed top-0 right-0 h-16 bg-brand-white border-b-2 border-brand-black z-30 flex items-center justify-between px-6 transition-all duration-300",
      sidebarOpen ? "lg:ml-64" : "lg:ml-64",
      "w-full lg:w-[calc(100%-16rem)]"
    )} role="banner">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 bg-brand-cream border-2 border-brand-black shadow-brutal"
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          aria-expanded={sidebarOpen}
        >
          <svg className="w-6 h-6 text-brand-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        
        <Logo href="/" size="sm" className="hidden sm:inline-flex" />
      </div>

      <div className="flex items-center gap-6">
        {/* Notification bell - placeholder */}
        <button className="relative p-2 text-brand-black hover:text-brand-red transition-colors" aria-label="Notifications">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 bg-brand-red rounded-full" />
        </button>

        {/* User profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 p-2 bg-brand-cream border-2 border-brand-black shadow-brutal hover:shadow-brutal-hover transition-shadow"
            aria-expanded={profileOpen}
            aria-haspopup="true"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center">
              <span className="font-display text-sm text-brand-white">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="font-body text-body-sm font-bold text-brand-black">{userName}</p>
              <p className="label-text text-brand-red/80 text-xs">{roleLabels[userRole] || userRole}</p>
            </div>
            <svg className={cn("w-4 h-4 text-brand-black transition-transform", profileOpen && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} aria-hidden="true" />
              <div className="absolute right-0 mt-2 w-56 bg-brand-cream border-2 border-brand-black shadow-brutal-lg z-50">
                <div className="p-4 border-b-2 border-brand-black">
                  <p className="font-body text-body-sm font-bold text-brand-black">{userName}</p>
                  <p className="label-text text-brand-red/80 text-xs">{roleLabels[userRole] || userRole}</p>
                </div>
                <Link
                  href="/profile"
                  className="block px-4 py-3 font-body text-body-sm text-brand-black hover:bg-brand-white transition-colors"
                  onClick={() => setProfileOpen(false)}
                >
                  PROFILE SETTINGS
                </Link>
                <Link
                  href="/settings"
                  className="block px-4 py-3 font-body text-body-sm text-brand-black hover:bg-brand-white transition-colors"
                  onClick={() => setProfileOpen(false)}
                >
                  SETTINGS
                </Link>
                <form action="/api/auth/logout" method="POST">
                  <button
                    type="submit"
                    className="w-full text-left px-4 py-3 font-body text-body-sm text-brand-red hover:bg-brand-white transition-colors"
                  >
                    SIGN OUT
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}