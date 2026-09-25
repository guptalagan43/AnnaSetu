/**
 * In-Memory Mock Supabase Client for Local Development & Demos
 * Prevents DNS timeouts and unhandled network errors when Supabase credentials are not set.
 */
import {
  SEED_DONORS,
  SEED_SHELTERS,
  SEED_DRIVERS,
  SEED_LISTINGS,
  SEED_ADMIN,
  SEED_IMPACT_METRICS,
} from "@/lib/seed/demoData";
import { verifyAuthToken } from "@/lib/auth/localStore";

interface MockUser {
  id: string;
  email: string;
  role: string;
  display_name: string;
}

export function createMockClient(token?: string) {
  let currentUser: MockUser = {
    id: SEED_DONORS[0].id,
    email: SEED_DONORS[0].email,
    role: "donor_admin",
    display_name: SEED_DONORS[0].businessName,
  };

  if (token) {
    const verified = verifyAuthToken(token);
    if (verified) {
      currentUser = {
        id: verified.id,
        email: verified.email,
        role: verified.role,
        display_name: verified.display_name || "Demo User",
      };
    }
  }

  const mockSession = {
    access_token: token || "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    expires_in: 86400,
    token_type: "bearer",
    user: {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
      aud: "authenticated",
      app_metadata: { role: currentUser.role },
      user_metadata: {
        role: currentUser.role,
        display_name: currentUser.display_name,
        full_name: currentUser.display_name,
      },
      created_at: new Date().toISOString(),
    },
  };

  return {
    auth: {
      getSession: async () => ({
        data: { session: token ? mockSession : mockSession },
        error: null,
      }),
      getUser: async () => ({
        data: { user: mockSession.user },
        error: null,
      }),
      signOut: async () => ({ error: null }),
      admin: {
        listUsers: async () => ({
          data: {
            users: [
              mockSession.user,
              { id: SEED_ADMIN.id, email: SEED_ADMIN.email, role: SEED_ADMIN.role },
              { id: SEED_SHELTERS[0].id, email: SEED_SHELTERS[0].email, role: "shelter_admin" },
              { id: SEED_DRIVERS[0].id, email: SEED_DRIVERS[0].email, role: "verified_driver" },
            ],
          },
          error: null,
        }),
        createUser: async (params: { email: string; user_metadata?: Record<string, unknown> }) => {
          const newUser = {
            id: crypto.randomUUID(),
            email: params.email,
            role: (params.user_metadata?.role as string) || "donor_admin",
            user_metadata: params.user_metadata || {},
          };
          return { data: { user: newUser }, error: null };
        },
      },
    },
    from: (tableName: string) => createMockQueryBuilder(tableName, currentUser),
    storage: {
      from: () => ({
        upload: async (_path: string, _file: unknown) => ({
          data: { path: "uploads/demo-food.jpg" },
          error: null,
        }),
        getPublicUrl: () => ({
          data: { publicUrl: "/demo/food.jpg" },
        }),
      }),
    },
  };
}

function createMockQueryBuilder(table: string, currentUser: MockUser) {
  let isSingle = false;
  let isMaybeSingle = false;
  const filters: Record<string, unknown> = {};

  const getTableData = (): any[] => {
    switch (table) {
      case "profiles":
        return [
          {
            id: currentUser.id,
            email: currentUser.email,
            role: currentUser.role,
            display_name: currentUser.display_name,
            full_name: currentUser.display_name,
            phone: "+919876543201",
            is_verified: true,
            is_verified_donor: true,
          },
          {
            id: SEED_ADMIN.id,
            email: SEED_ADMIN.email,
            role: SEED_ADMIN.role,
            display_name: SEED_ADMIN.displayName,
            full_name: SEED_ADMIN.fullName,
            phone: SEED_ADMIN.phone,
            is_verified: true,
            is_verified_donor: false,
          },
          ...SEED_DONORS.map((d) => ({
            id: d.id,
            email: d.email,
            role: "donor_admin",
            display_name: d.businessName,
            full_name: d.fullName,
            phone: d.phone,
            is_verified: true,
            is_verified_donor: true,
          })),
          ...SEED_SHELTERS.map((s) => ({
            id: s.id,
            email: s.email,
            role: "shelter_admin",
            display_name: s.name,
            full_name: s.name,
            phone: s.phone,
            is_verified: true,
            is_verified_donor: false,
          })),
          ...SEED_DRIVERS.map((d) => ({
            id: d.id,
            email: d.email,
            role: "verified_driver",
            display_name: d.fullName,
            full_name: d.fullName,
            phone: d.phone,
            is_verified: true,
            is_verified_donor: false,
          })),
        ];

      case "donor_verifications":
        return [
          {
            id: "verif-1",
            user_id: currentUser.id,
            profile_id: currentUser.id,
            donor_id: currentUser.id,
            business_name: currentUser.display_name,
            status: "approved",
            submitted_at: new Date(Date.now() - 86400000 * 5).toISOString(),
            fssai_license: "11223344556677",
            pan_number: "ABCDE1234F",
          },
          ...SEED_DONORS.map((d) => ({
            id: `verif-${d.id}`,
            user_id: d.id,
            profile_id: d.id,
            donor_id: d.id,
            business_name: d.businessName,
            status: "approved",
            submitted_at: new Date(Date.now() - 86400000 * 10).toISOString(),
            fssai_license: d.fssaiNumber,
            pan_number: d.panNumber,
          })),
        ];

      case "listings":
        return SEED_LISTINGS.map((l) => ({
          id: l.id,
          donor_id: currentUser.id,
          title: l.title,
          description: l.description,
          food_category: l.foodCategory,
          quantity_kg: l.quantityKg,
          estimated_servings: l.servings,
          ers_score: l.ersScore,
          status: l.status,
          donor_pin: l.donorPin,
          pickup_address: l.pickupAddress,
          storage_condition: "Ambient Room Temperature",
          intake_method: l.intakeMethod,
          hours_remaining: l.hoursRemaining,
          pickup_window_start: new Date(Date.now() - 3600000 * 0.5).toISOString(),
          pickup_window_end: new Date(Date.now() + 3600000 * (l.hoursRemaining || 3)).toISOString(),
          expiry_time: new Date(Date.now() + 3600000 * ((l.hoursRemaining || 3) + 2)).toISOString(),
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          updated_at: new Date().toISOString(),
          matched_shelter_id: SEED_SHELTERS[0].id,
          allergens: ["Dairy"],
        }));

      case "shelters":
        return SEED_SHELTERS.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          phone: s.phone,
          address: s.address,
          capacity_kg: s.capacityKg,
          total_capacity_kg: s.capacityKg,
          current_load_kg: s.currentLoadKg,
          accepts_auto_confirm: s.acceptsAutoConfirm,
          status: "active",
          is_active: s.isActive,
        }));

      case "drivers":
        return SEED_DRIVERS.map((d) => ({
          id: d.id,
          user_id: d.id,
          full_name: d.fullName,
          phone: d.phone,
          vehicle_type: d.vehicleType,
          is_available: d.isOnline,
          is_online: d.isOnline,
          is_verified: d.isVerified,
        }));

      case "impact_totals":
        return [
          {
            id: "impact-total-1",
            total_meals_rescued: SEED_IMPACT_METRICS.totalMealsRescued,
            total_weight_kg: SEED_IMPACT_METRICS.totalWeightKg,
            total_co2e_avoided_kg: SEED_IMPACT_METRICS.totalCo2eAvoidedKg,
            active_donors: 3,
            active_shelters: 4,
          },
        ];

      default:
        return [];
    }
  };

  const builder: any = {
    select: (_cols?: string, _opts?: unknown) => builder,
    insert: (data: any) => {
      const record = Array.isArray(data) ? data[0] : data;
      return Promise.resolve({
        data: { id: record?.id || crypto.randomUUID(), ...record },
        error: null,
      });
    },
    upsert: (data: any) => {
      const record = Array.isArray(data) ? data[0] : data;
      return Promise.resolve({
        data: { id: record?.id || crypto.randomUUID(), ...record },
        error: null,
      });
    },
    update: (data: any) => Promise.resolve({ data, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
    eq: (col: string, val: unknown) => {
      filters[col] = val;
      return builder;
    },
    neq: () => builder,
    in: () => builder,
    gte: () => builder,
    lte: () => builder,
    order: () => builder,
    range: () => builder,
    limit: () => builder,
    single: () => {
      isSingle = true;
      return builder;
    },
    maybeSingle: () => {
      isMaybeSingle = true;
      return builder;
    },
    then: (resolve: (val: any) => any, _reject?: any) => {
      let dataList = getTableData();

      // Apply equality filters
      for (const [col, val] of Object.entries(filters)) {
        dataList = dataList.filter((item) => {
          if (item[col] !== undefined) {
            return String(item[col]) === String(val);
          }
          return true;
        });
      }

      let result: any = dataList;
      if (isSingle) {
        result = dataList[0] || null;
      } else if (isMaybeSingle) {
        result = dataList[0] || null;
      }

      return Promise.resolve({
        data: result,
        error: null,
        count: Array.isArray(dataList) ? dataList.length : 1,
      }).then(resolve);
    },
  };

  return builder;
}
