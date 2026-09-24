"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarItem {
  label: string;
  href: string;
  roles: string[];
  icon?: React.ReactNode;
}

const navItems: SidebarItem[] = [
  // Donor nav
  { label: "DASHBOARD", href: "/donor", roles: ["donor_admin", "donor_staff"] },
  { label: "NEW LISTING", href: "/donor/new-listing", roles: ["donor_admin", "donor_staff"] },
  { label: "MY LISTINGS", href: "/donor/listings", roles: ["donor_admin", "donor_staff"] },
  { label: "IMPACT", href: "/donor/impact", roles: ["donor_admin", "donor_staff"] },
  
  // Shelter nav
  { label: "DASHBOARD", href: "/shelter", roles: ["shelter_admin", "shelter_coordinator"] },
  { label: "INCOMING", href: "/shelter/incoming", roles: ["shelter_admin", "shelter_coordinator"] },
  { label: "CAPACITY", href: "/shelter/capacity", roles: ["shelter_admin"] },
  { label: "PREFERENCES", href: "/shelter/preferences", roles: ["shelter_admin"] },
  { label: "DELIVERIES", href: "/shelter/deliveries", roles: ["shelter_admin", "shelter_coordinator"] },
  
  // Driver nav
  { label: "DASHBOARD", href: "/driver", roles: ["verified_driver", "casual_volunteer"] },
  { label: "MY ROUTE", href: "/driver/route", roles: ["verified_driver", "casual_volunteer"] },
  { label: "AVAILABLE", href: "/driver/available", roles: ["verified_driver"] },
  { label: "HISTORY", href: "/driver/history", roles: ["verified_driver", "casual_volunteer"] },
  
  // Admin nav
  { label: "OVERVIEW", href: "/admin", roles: ["super_admin", "platform_admin", "moderator"] },
  { label: "VERIFICATION", href: "/admin/verification", roles: ["super_admin", "platform_admin", "moderator"] },
  { label: "LISTINGS", href: "/admin/listings", roles: ["super_admin", "platform_admin", "moderator"] },
  { label: "AGENT LOG", href: "/admin/agent-log", roles: ["super_admin", "platform_admin", "moderator"] },
  { label: "METRICS", href: "/admin/metrics", roles: ["super_admin", "platform_admin"] },
  
  // Public
  { label: "LIVE IMPACT", href: "/public-impact", roles: [] },
];

export function Sidebar({ 
  userRole, 
  isOpen = false, 
  onClose 
}: { 
  userRole: string; 
  isOpen?: boolean; 
  onClose?: () => void; 
}) {
  const pathname = usePathname();

  const filteredItems = navItems.filter(item => 
    item.roles.length === 0 || item.roles.includes(userRole)
  );

  // Group by role for display
  const getSectionTitle = (role: string) => {
    switch (role) {
      case "donor_admin":
      case "donor_staff":
        return "DONOR";
      case "shelter_admin":
      case "shelter_coordinator":
        return "SHELTER";
      case "verified_driver":
      case "casual_volunteer":
        return "DRIVER";
      case "super_admin":
      case "platform_admin":
      case "moderator":
        return "ADMIN";
      default:
        return "PUBLIC";
    }
  };

  const sections = filteredItems.reduce((acc, item) => {
    const section = getSectionTitle(item.roles[0] || "public");
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {} as Record<string, SidebarItem[]>);

  return (
    <aside 
      className={cn(
        "fixed top-0 left-0 h-full bg-brand-black text-brand-white z-40 transition-transform duration-300 w-64 shadow-brutal-lg lg:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
      id="sidebar"
      aria-label="Main navigation"
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b-2 border-brand-white/20">
          <div className="flex items-center gap-4">
            <span className="font-display text-2xl tracking-tight">ANNA</span>
            <span className="w-px h-6 bg-brand-white/50"></span>
            <span className="font-display text-2xl tracking-tight text-brand-red">SETU</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden text-brand-white hover:text-brand-red p-1"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto" aria-label="Dashboard navigation">
          {Object.entries(sections).map(([sectionTitle, items]) => (
            <div key={sectionTitle} className="mb-8">
              <h3 className="label-text text-brand-white/50 mb-4 px-2">{sectionTitle}</h3>
              <ul className="space-y-1" role="list">
                {items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => onClose?.()}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-none transition-all",
                          isActive
                            ? "bg-brand-white/10 border-l-4 border-brand-red text-brand-white"
                            : "text-brand-white/70 hover:bg-brand-white/5 hover:text-brand-white"
                        )}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <span className="font-body text-body-sm font-medium tracking-wider">
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer with role badge */}
        <div className="p-4 border-t-2 border-brand-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center">
                <span className="font-display text-sm text-brand-white">U</span>
              </div>
              <div>
                <p className="font-body text-body-sm font-medium text-brand-white">User</p>
                <p className="label-text text-brand-red/80 text-xs">{userRole.replace("_", " ")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileSidebarToggle({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-brand-black/60 z-30 lg:hidden transition-opacity"
      onClick={onClose}
      aria-hidden="true"
    />
  );
}