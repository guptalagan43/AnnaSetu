import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { User, Mail, Shield, Phone, Calendar } from "lucide-react";

export default async function ProfilePage() {
  const session = await requireRole([
    "super_admin",
    "platform_admin",
    "moderator",
    "reporter",
    "donor_admin",
    "donor_staff",
    "shelter_admin",
    "shelter_coordinator",
    "verified_driver",
    "casual_volunteer",
    "observer_gov",
    "observer_esg",
  ])();

  const user = session.user!;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.display_name || user.email.split("@")[0];
  const role = user.role.replace(/_/g, " ").toUpperCase();

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <span className="label-text text-brand-red font-mono">ACCOUNT PROTOCOL</span>
        <h1 className="font-display text-display-lg text-brand-black uppercase">
          PROFILE SETTINGS
        </h1>
        <p className="font-body text-body-md text-brand-black/70 mt-1">
          Identity, verified role credentials, and active dispatch privileges.
        </p>
      </div>

      <Card variant="elevated">
        <CardHeader className="border-b-2 border-brand-black pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-brand-red text-brand-white border-2 border-brand-black shadow-brutal-sm flex items-center justify-center font-display text-2xl">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-display text-2xl text-brand-black uppercase">{displayName}</h2>
                <Badge variant="caution" className="mt-1 font-mono text-xs">
                  {role}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-4 bg-brand-white border-2 border-brand-black shadow-brutal-sm">
              <div className="flex items-center gap-2 text-brand-black/60 font-mono text-xs font-bold uppercase mb-1">
                <Mail className="w-4 h-4 text-brand-red" />
                EMAIL ADDRESS
              </div>
              <div className="font-body text-body-md font-bold text-brand-black">{user.email}</div>
            </div>

            <div className="p-4 bg-brand-white border-2 border-brand-black shadow-brutal-sm">
              <div className="flex items-center gap-2 text-brand-black/60 font-mono text-xs font-bold uppercase mb-1">
                <Phone className="w-4 h-4 text-brand-red" />
                CONTACT NUMBER
              </div>
              <div className="font-body text-body-md font-bold text-brand-black">
                {profile?.phone || "Not Registered"}
              </div>
            </div>

            <div className="p-4 bg-brand-white border-2 border-brand-black shadow-brutal-sm">
              <div className="flex items-center gap-2 text-brand-black/60 font-mono text-xs font-bold uppercase mb-1">
                <Shield className="w-4 h-4 text-brand-red" />
                SECURITY LEVEL
              </div>
              <div className="font-body text-body-md font-bold text-brand-black">
                {user.role.startsWith("super_") ? "Root Access" : "Standard Multi-Factor"}
              </div>
            </div>

            <div className="p-4 bg-brand-white border-2 border-brand-black shadow-brutal-sm">
              <div className="flex items-center gap-2 text-brand-black/60 font-mono text-xs font-bold uppercase mb-1">
                <Calendar className="w-4 h-4 text-brand-red" />
                ACTIVE SESSION
              </div>
              <div className="font-body text-body-md font-bold text-brand-black font-mono text-xs">
                Encrypted JWT (Cookie TLS)
              </div>
            </div>
          </div>

          <div className="p-4 bg-brand-cream border-2 border-brand-black font-mono text-xs text-brand-black/75">
            IDENTITY NOTE: To change your registered entity name, FSSAI certificate, or operational role, contact the compliance administration queue.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
