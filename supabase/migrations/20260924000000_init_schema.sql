-- AnnaSetu Database Schema
-- Run this in Supabase SQL Editor
-- Requires PostGIS extension

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- USERS & AUTH (managed by Supabase Auth + custom profile table)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN (
    'super_admin','platform_admin','moderator','reporter',
    'donor_admin','donor_staff',
    'shelter_admin','shelter_coordinator',
    'verified_driver','casual_volunteer',
    'observer_gov','observer_esg'
  )),
  display_name TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  is_verified_donor BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DONOR VERIFICATION
CREATE TABLE donor_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  user_id UUID REFERENCES profiles(id),
  donor_id UUID REFERENCES profiles(id),
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  why_donate TEXT,
  fssai_number TEXT NOT NULL,
  fssai_expiry DATE NOT NULL,
  gst_number TEXT,
  pan_number TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  pickup_location GEOGRAPHY(POINT, 4326),
  operating_hours_start TIME,
  operating_hours_end TIME,
  fssai_doc_url TEXT,
  gst_doc_url TEXT,
  pan_doc_url TEXT,
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review','under_review','approved','rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  violation_count INTEGER DEFAULT 0,
  can_reapply_after DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LISTINGS
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID REFERENCES profiles(id) NOT NULL,
  donor_verification_id UUID REFERENCES donor_verifications(id),
  title TEXT NOT NULL,
  description TEXT,
  food_category TEXT NOT NULL,
  quantity_kg NUMERIC(8,2),
  estimated_servings INTEGER,
  packaging_type TEXT,
  storage_condition TEXT,
  allergens TEXT[],
  pickup_address TEXT NOT NULL,
  pickup_location GEOGRAPHY(POINT, 4326) NOT NULL,
  pickup_window_start TIMESTAMPTZ NOT NULL,
  pickup_window_end TIMESTAMPTZ NOT NULL,
  prepared_at TIMESTAMPTZ,
  expiry_time TIMESTAMPTZ NOT NULL,
  safe_period_hours NUMERIC(4,1),
  donor_pin CHAR(4) NOT NULL,
  ers_score INTEGER DEFAULT 0 CHECK (ers_score BETWEEN 0 AND 100),
  ers_updated_at TIMESTAMPTZ,
  status TEXT DEFAULT 'listed' CHECK (status IN ('listed','matched','driver_assigned','in_transit','checklist','delivered','disputed','cancelled','expired')),
  cv_confidence NUMERIC(4,3),
  intake_method TEXT DEFAULT 'manual' CHECK (intake_method IN ('manual','cv','nlp','voice')),
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_listings_location ON listings USING GIST(pickup_location);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_ers ON listings(ers_score DESC);
CREATE INDEX idx_listings_donor ON listings(donor_id);

-- SHELTERS
CREATE TABLE shelters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  capacity_kg NUMERIC(8,2) NOT NULL DEFAULT 0,
  total_capacity_kg NUMERIC(8,2),
  current_load_kg NUMERIC(8,2) DEFAULT 0,
  food_preferences TEXT[],
  food_restrictions TEXT[],
  accepts_auto_confirm BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','unavailable','suspended')),
  reliability_score NUMERIC(4,3) DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_shelters_location ON shelters USING GIST(location);
CREATE INDEX idx_shelters_status ON shelters(status);

-- MATCHES
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) NOT NULL,
  shelter_id UUID REFERENCES shelters(id) NOT NULL,
  match_score NUMERIC(5,3),
  distance_km NUMERIC(8,3),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','auto_confirmed','cancelled')),
  auto_confirmed BOOLEAN DEFAULT FALSE,
  shelter_response_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_matches_listing ON matches(listing_id);
CREATE INDEX idx_matches_shelter ON matches(shelter_id);
CREATE INDEX idx_matches_status ON matches(status);

-- DRIVERS & ASSIGNMENTS
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  vehicle_type TEXT,
  current_location GEOGRAPHY(POINT, 4326),
  is_available BOOLEAN DEFAULT TRUE,
  is_online BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT TRUE,
  reliability_score NUMERIC(4,3) DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE driver_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES drivers(id),
  listing_id UUID REFERENCES listings(id),
  route_stops JSONB,
  assigned_by TEXT DEFAULT 'admin' CHECK (assigned_by IN ('admin','agent')),
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned','picked_up','delivered')),
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_driver_assignments_driver ON driver_assignments(driver_id);
CREATE INDEX idx_driver_assignments_listing ON driver_assignments(listing_id);

-- DELIVERY RECEIPTS (Acceptance Checklist)
CREATE TABLE delivery_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id),
  match_id UUID REFERENCES matches(id),
  driver_assignment_id UUID REFERENCES driver_assignments(id),
  completed_by UUID REFERENCES profiles(id),
  quantity_ok BOOLEAN NOT NULL,
  quantity_listed NUMERIC(8,2) NOT NULL,
  quantity_received NUMERIC(8,2) NOT NULL,
  quantity_notes TEXT,
  food_items_correct BOOLEAN NOT NULL,
  food_items_notes TEXT,
  packaging_condition_ok BOOLEAN NOT NULL,
  packaging_notes TEXT,
  food_visible_condition_ok BOOLEAN NOT NULL,
  food_condition_notes TEXT,
  donor_pin_verified BOOLEAN NOT NULL,
  overall_result TEXT NOT NULL CHECK (overall_result IN ('accepted', 'rejected', 'partial_acceptance', 'disputed')),
  rejection_reason TEXT,
  volunteer_notes TEXT,
  discrepancy_recorded BOOLEAN DEFAULT FALSE,
  discrepancy_type TEXT CHECK (discrepancy_type IN (
    'quantity_mismatch', 'wrong_items', 'packaging_damaged',
    'food_unsafe', 'pin_failure', 'multiple'
  )),
  violation_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DONOR VIOLATIONS
CREATE TABLE donor_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID REFERENCES profiles(id) NOT NULL,
  checklist_id UUID REFERENCES delivery_receipts(id) NOT NULL,
  listing_id UUID REFERENCES listings(id) NOT NULL,
  violation_number INTEGER NOT NULL,
  violation_type TEXT NOT NULL,
  action_taken TEXT NOT NULL CHECK (action_taken IN ('warning_issued', 'account_removed')),
  admin_reviewed_by UUID REFERENCES profiles(id),
  admin_reviewed_at TIMESTAMPTZ,
  donor_contested BOOLEAN DEFAULT FALSE,
  contest_outcome TEXT CHECK (contest_outcome IN ('upheld', 'overturned', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AGENT LOG
CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  listing_id UUID REFERENCES listings(id),
  match_id UUID REFERENCES matches(id),
  driver_id UUID REFERENCES drivers(id),
  reasoning TEXT,
  confidence NUMERIC(4,3),
  overridden_by UUID REFERENCES profiles(id),
  overridden_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_agent_logs_listing ON agent_logs(listing_id);
CREATE INDEX idx_agent_logs_created ON agent_logs(created_at DESC);

-- IMPACT TOTALS
CREATE TABLE impact_totals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id),
  donor_id UUID REFERENCES profiles(id),
  shelter_id UUID REFERENCES shelters(id),
  meals_rescued INTEGER,
  weight_kg NUMERIC(8,2),
  co2e_avoided_kg NUMERIC(8,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- EMAIL QUEUE LOG
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT NOT NULL,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','bounced')),
  attempts INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATION LOGS
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  listing_id UUID REFERENCES listings(id),
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','bounced')),
  attempts INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelters ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own profile, admins can read all
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('super_admin', 'platform_admin', 'moderator')
    )
  );

-- Donor verifications: donors can read their own, admins can read all
CREATE POLICY "Donors can read own verification" ON donor_verifications
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Admins can read all verifications" ON donor_verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('super_admin', 'platform_admin', 'moderator')
    )
  );

CREATE POLICY "Anyone can submit verification" ON donor_verifications
  FOR INSERT WITH CHECK (true);

-- Listings: donors can CRUD their own, shelters/admins can read matched
CREATE POLICY "Donors can manage own listings" ON listings
  FOR ALL USING (auth.uid() = donor_id);

CREATE POLICY "Shelters can read matched listings" ON listings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches m
      JOIN shelters s ON m.shelter_id = s.id
      WHERE m.listing_id = listings.id
      AND s.profile_id = auth.uid()
      AND m.status IN ('accepted', 'auto_confirmed')
    )
  );

CREATE POLICY "Admins can read all listings" ON listings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('super_admin', 'platform_admin', 'moderator')
    )
  );

-- Shelters: shelter admins can manage their shelter, all can read active
CREATE POLICY "Shelter admins can manage own shelter" ON shelters
  FOR ALL USING (auth.uid() = profile_id);

CREATE POLICY "Anyone can read active shelters" ON shelters
  FOR SELECT USING (status = 'active');

-- Matches: parties involved can read, shelters can update their matches
CREATE POLICY "Parties can read matches" ON matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = matches.listing_id
      AND (l.donor_id = auth.uid() OR EXISTS (
        SELECT 1 FROM shelters s WHERE s.id = matches.shelter_id AND s.profile_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Shelters can update own matches" ON matches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM shelters s
      WHERE s.id = matches.shelter_id
      AND s.profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all matches" ON matches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('super_admin', 'platform_admin', 'moderator')
    )
  );

-- Driver assignments: driver and admin can read
CREATE POLICY "Drivers can read own assignments" ON driver_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM drivers d
      WHERE d.id = driver_assignments.driver_id
      AND d.profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage driver assignments" ON driver_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('super_admin', 'platform_admin', 'moderator')
    )
  );

-- Delivery receipts: shelter volunteers can create, parties can read
CREATE POLICY "Shelter volunteers can create receipts" ON delivery_receipts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches m
      JOIN shelters s ON m.shelter_id = s.id
      WHERE m.id = delivery_receipts.match_id
      AND s.profile_id = auth.uid()
    )
  );

CREATE POLICY "Parties can read receipts" ON delivery_receipts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = delivery_receipts.listing_id
      AND (l.donor_id = auth.uid() OR EXISTS (
        SELECT 1 FROM shelters s WHERE s.id = (
          SELECT shelter_id FROM matches WHERE id = delivery_receipts.match_id
        ) AND s.profile_id = auth.uid()
      ))
    )
  );

-- Agent logs: admins only
CREATE POLICY "Admins can read agent logs" ON agent_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('super_admin', 'platform_admin', 'moderator')
    )
  );

-- Impact totals: donors can read own, admins all
CREATE POLICY "Donors can read own impact" ON impact_totals
  FOR SELECT USING (auth.uid() = donor_id);

CREATE POLICY "Admins can read all impact" ON impact_totals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('super_admin', 'platform_admin', 'moderator')
    )
  );

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM profiles WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate donor PIN
CREATE OR REPLACE FUNCTION generate_donor_pin()
RETURNS CHAR(4) AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name, phone)
  VALUES (NEW.id, 'donor_staff', NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'phone');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();