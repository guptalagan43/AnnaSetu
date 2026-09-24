/**
 * Demo Seed Data Definitions
 * AnnaSetu — Autonomous AI-Powered Urban Food Redistribution Engine
 *
 * Implements SRS §21.3 and Phases.md §20 demo requirements:
 * - 3 Verified Donor Businesses
 * - 4 Partner Shelters
 * - 2 Verified Volunteer Drivers
 * - 1 Platform Admin
 * - 5 Listings across all ERS stages (28, 62, 84, delivered, disputed)
 * - 48,000+ preloaded meals in impact_totals
 */

export interface SeedDonor {
  id: string;
  email: string;
  fullName: string;
  businessName: string;
  businessType: string;
  fssaiNumber: string;
  panNumber: string;
  phone: string;
  lat: number;
  lng: number;
  address: string;
}

export interface SeedShelter {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
  capacityKg: number;
  currentLoadKg: number;
  acceptsAutoConfirm: boolean;
  isActive: boolean;
}

export interface SeedDriver {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  vehicleType: "bike" | "scooter" | "auto" | "car" | "van";
  isOnline: boolean;
  isVerified: boolean;
  lat: number;
  lng: number;
}

export interface SeedListing {
  id: string;
  donorId: string;
  title: string;
  description: string;
  foodCategory: string;
  quantityKg: number;
  servings: number;
  ersScore: number;
  status: "available" | "matched" | "driver_assigned" | "in_transit" | "delivered" | "disputed";
  donorPin: string;
  lat: number;
  lng: number;
  pickupAddress: string;
  intakeMethod: "manual" | "cv" | "nlp";
  hoursRemaining: number;
  disputeNotes?: string;
  strikeCount?: number;
}

export interface SeedImpactTotal {
  id: string;
  donorId: string;
  shelterId: string;
  mealsRescued: number;
  weightKg: number;
  co2eAvoidedKg: number;
}

export const SEED_DONORS: SeedDonor[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    email: "donor@annasetu.in",
    fullName: "Ramesh Kumar",
    businessName: "MG Road Dhaba",
    businessType: "restaurant",
    fssaiNumber: "11223344556677",
    panNumber: "ABCDE1234F",
    phone: "+919876543201",
    lat: 12.9716,
    lng: 77.5946,
    address: "MG Road Central, Bengaluru, Karnataka 560001",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    email: "donor2@annasetu.in",
    fullName: "Sunita Patel",
    businessName: "Green Grocers",
    businessType: "grocery_store",
    fssaiNumber: "22334455667788",
    panNumber: "BCDEF2345G",
    phone: "+919876543202",
    lat: 12.9784,
    lng: 77.6408,
    address: "100ft Road, Indiranagar, Bengaluru, Karnataka 560038",
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    email: "donor3@annasetu.in",
    fullName: "Anand Verma",
    businessName: "Campus Canteen",
    businessType: "campus_dining",
    fssaiNumber: "33445566778899",
    panNumber: "CDEFG3456H",
    phone: "+919876543203",
    lat: 12.9352,
    lng: 77.6245,
    address: "Koramangala 5th Block, Bengaluru, Karnataka 560095",
  },
];

export const SEED_SHELTERS: SeedShelter[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    name: "Hope Shelter",
    email: "shelter@annasetu.in",
    phone: "+919876543210",
    address: "Richmond Town, Bengaluru 560025",
    lat: 12.9634,
    lng: 77.6033,
    capacityKg: 100,
    currentLoadKg: 35,
    acceptsAutoConfirm: true,
    isActive: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    name: "City Food Bank",
    email: "shelter2@annasetu.in",
    phone: "+919876543211",
    address: "Whitefield Main Rd, Bengaluru 560066",
    lat: 12.9698,
    lng: 77.7499,
    capacityKg: 150,
    currentLoadKg: 40,
    acceptsAutoConfirm: true,
    isActive: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    name: "Children's Home",
    email: "shelter3@annasetu.in",
    phone: "+919876543212",
    address: "Jayanagar 4th Block, Bengaluru 560011",
    lat: 12.925,
    lng: 77.5897,
    capacityKg: 60,
    currentLoadKg: 20,
    acceptsAutoConfirm: false, // Manual approval required
    isActive: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    name: "Community Kitchen",
    email: "shelter4@annasetu.in",
    phone: "+919876543213",
    address: "Electronic City Phase 1, Bengaluru 560100",
    lat: 12.8399,
    lng: 77.677,
    capacityKg: 200,
    currentLoadKg: 60,
    acceptsAutoConfirm: true,
    isActive: true,
  },
];

export const SEED_DRIVERS: SeedDriver[] = [
  {
    id: "20000000-0000-0000-0000-000000000001",
    email: "driver@annasetu.in",
    fullName: "Rahul Verma",
    phone: "+919876543221",
    vehicleType: "bike",
    isOnline: true,
    isVerified: true,
    lat: 12.9716,
    lng: 77.5946,
  },
  {
    id: "20000000-0000-0000-0000-000000000002",
    email: "driver2@annasetu.in",
    fullName: "Priya Sharma",
    phone: "+919876543222",
    vehicleType: "auto",
    isOnline: true,
    isVerified: true,
    lat: 12.9784,
    lng: 77.6408,
  },
];

export const SEED_ADMIN = {
  id: "30000000-0000-0000-0000-000000000001",
  email: "admin@annasetu.in",
  fullName: "System Administrator",
  displayName: "Super Admin",
  role: "super_admin",
  phone: "+919876543299",
};

/**
 * 5 Listings at distinct ERS stages per phases.md §20
 */
export const SEED_LISTINGS: SeedListing[] = [
  // 1. ERS 28: Low Risk, Fresh Produce
  {
    id: "40000000-0000-0000-0000-000000000001",
    donorId: SEED_DONORS[1].id, // Green Grocers
    title: "Fresh Farm Bananas & Apples",
    description: "Surplus fresh seasonal fruit crates from morning inventory shipment.",
    foodCategory: "Fresh produce",
    quantityKg: 20.0,
    servings: 50,
    ersScore: 28,
    status: "available",
    donorPin: "1428",
    lat: 12.9784,
    lng: 77.6408,
    pickupAddress: "100ft Road, Indiranagar, Bengaluru",
    intakeMethod: "cv",
    hoursRemaining: 18,
  },
  // 2. ERS 62: Medium Risk, Cooked Rice & Curry
  {
    id: "40000000-0000-0000-0000-000000000002",
    donorId: SEED_DONORS[2].id, // Campus Canteen
    title: "Vegetable Pulao & Mix Dal",
    description: "Excess lunch preparation from campus dining hall, hot packed in stainless tubs.",
    foodCategory: "Cooked rice dishes / curries",
    quantityKg: 25.0,
    servings: 65,
    ersScore: 62,
    status: "available",
    donorPin: "5832",
    lat: 12.9352,
    lng: 77.6245,
    pickupAddress: "Koramangala 5th Block, Bengaluru",
    intakeMethod: "nlp",
    hoursRemaining: 5,
  },
  // 3. ERS 84: High Critical Risk, Dairy Based Dishes
  {
    id: "40000000-0000-0000-0000-000000000003",
    donorId: SEED_DONORS[0].id, // MG Road Dhaba
    title: "Dal Makhani & Tandoori Rotis",
    description: "Cooked dairy gravy and fresh rotis. Urgent redistribution needed before evening shift.",
    foodCategory: "Dairy-based dishes",
    quantityKg: 18.0,
    servings: 45,
    ersScore: 84,
    status: "matched",
    donorPin: "7749",
    lat: 12.9716,
    lng: 77.5946,
    pickupAddress: "MG Road Central, Bengaluru",
    intakeMethod: "manual",
    hoursRemaining: 2,
  },
  // 4. Delivered Listing (Successfully Rescued)
  {
    id: "40000000-0000-0000-0000-000000000004",
    donorId: SEED_DONORS[0].id,
    title: "Paneer Butter Masala & Naan",
    description: "Wedding banquet surplus safely chilled and delivered to Hope Shelter.",
    foodCategory: "Cooked meals",
    quantityKg: 30.0,
    servings: 75,
    ersScore: 78,
    status: "delivered",
    donorPin: "4412",
    lat: 12.9716,
    lng: 77.5946,
    pickupAddress: "MG Road Central, Bengaluru",
    intakeMethod: "cv",
    hoursRemaining: 0,
  },
  // 5. Disputed Listing (Failed Checklist)
  {
    id: "40000000-0000-0000-0000-000000000005",
    donorId: SEED_DONORS[2].id,
    title: "Chicken Biryani (Expired Batch)",
    description: "Prepared 10 hours prior without refrigeration. Off-odor detected upon delivery inspection.",
    foodCategory: "Cooked meals",
    quantityKg: 15.0,
    servings: 35,
    ersScore: 95,
    status: "disputed",
    donorPin: "9901",
    lat: 12.9352,
    lng: 77.6245,
    pickupAddress: "Koramangala 5th Block, Bengaluru",
    intakeMethod: "manual",
    hoursRemaining: 0,
    disputeNotes: "Failed sensory temperature check. Sour odor detected; item rejected for recipient safety.",
    strikeCount: 1,
  },
];

/**
 * Pre-loaded Impact Totals: 48,000+ meals for public dashboard wow factor
 */
export const SEED_IMPACT_METRICS = {
  totalMealsRescued: 48320,
  totalWeightKg: 19328.0,
  totalCo2eAvoidedKg: 48320.0, // 19328 * 2.5
  totalDonorsActive: 142,
  totalSheltersActive: 38,
  totalVolunteerDrivers: 89,
};
