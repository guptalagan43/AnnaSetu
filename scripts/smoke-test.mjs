// scripts/smoke-test.mjs
// Comprehensive probe testing all public, auth, and dashboard routes

async function run() {
  const baseUrl = process.env.BASE_URL || process.argv[2] || "http://localhost:3001";
  console.log(`\n======================================================`);
  console.log(`Starting AnnaSetu Full Website Deep Route Audit`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`======================================================\n`);

  let failures = 0;
  let passes = 0;

  async function check(name, url, options = {}, expectedStatus = [200]) {
    try {
      const res = await fetch(url, { redirect: "manual", ...options });
      const allowed = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
      if (allowed.includes(res.status)) {
        console.log(`✔ [PASS] ${name} -> HTTP ${res.status}`);
        passes++;
        return res;
      } else {
        console.error(`✖ [FAIL] ${name} -> Expected ${allowed.join("/")}, got HTTP ${res.status}`);
        const body = await res.text().catch(() => "");
        console.error(`  Response snippet: ${body.substring(0, 300)}...`);
        failures++;
        return res;
      }
    } catch (err) {
      console.error(`✖ [FAIL] ${name} -> Network error: ${err.message}`);
      failures++;
      return null;
    }
  }

  // 1. Public Pages
  console.log(`--- SECTION 1: PUBLIC PAGES ---`);
  await check("Landing Page (/)", `${baseUrl}/`);
  await check("Login Page (/login)", `${baseUrl}/login`);
  await check("Register Page (/register)", `${baseUrl}/register`);
  await check("Terms of Service (/terms)", `${baseUrl}/terms`);
  await check("Privacy Policy (/privacy)", `${baseUrl}/privacy`);
  await check("Public Impact Dashboard (/public-impact)", `${baseUrl}/public-impact`);
  await check("Design System Dev Showcase (/dev/components)", `${baseUrl}/dev/components`);
  await check("Unauthorized Page (/unauthorized)", `${baseUrl}/unauthorized`);

  // 2. Unauthenticated Guard on Dashboards (should redirect 307 / 302 to /login)
  console.log(`\n--- SECTION 2: UNAUTHENTICATED GUARDS ---`);
  await check("Donor Dashboard unauthenticated guard", `${baseUrl}/donor`, {}, [307, 302]);
  await check("Shelter Dashboard unauthenticated guard", `${baseUrl}/shelter`, {}, [307, 302]);
  await check("Coordinator Dashboard unauthenticated guard", `${baseUrl}/coordinator`, {}, [307, 302]);
  await check("Driver Dashboard unauthenticated guard", `${baseUrl}/driver`, {}, [307, 302]);
  await check("Admin Dashboard unauthenticated guard", `${baseUrl}/admin`, {}, [307, 302]);

  // 3. Auth API: Register a fresh user
  console.log(`\n--- SECTION 3: AUTH API & USER CREATION ---`);
  const testEmail = `testuser_${Date.now()}@example.com`;
  await check("Register new user (donor)", `${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      display_name: "Test Donor Company",
      email: testEmail,
      phone: "+919876543210",
      password: "DemoPassword123!",
      role: "donor_admin",
    }),
  }, [200, 201]);

  // 4. Auth API: Login with pre-seeded accounts
  console.log(`\n--- SECTION 4: DEMO ACCOUNTS LOGIN ---`);
  const roles = [
    { role: "admin", email: "admin@annasetu.in" },
    { role: "donor", email: "donor@annasetu.in" },
    { role: "shelter", email: "shelter@annasetu.in" },
    { role: "coordinator", email: "coordinator@annasetu.in" },
    { role: "driver", email: "driver@annasetu.in" },
  ];

  const authCookies = {};

  for (const r of roles) {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: r.email,
        password: "DemoPassword123!",
      }),
    });

    if (loginRes.ok) {
      const data = await loginRes.json();
      console.log(`✔ [PASS] Login (${r.role}: ${r.email}) -> Success, role: ${data.user?.role}`);
      passes++;
      const cookieArray = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get("set-cookie") || ""];
      authCookies[r.role] = cookieArray.map(c => c.split(";")[0]).join("; ");
    } else {
      console.error(`✖ [FAIL] Login (${r.role}: ${r.email}) -> HTTP ${loginRes.status}`);
      failures++;
    }
  }

  // 5. Authenticated Dashboard Pages
  console.log(`\n--- SECTION 5: AUTHENTICATED DASHBOARD PAGES ---`);
  // Donor routes
  const donorCookie = authCookies["donor"] ? { headers: { Cookie: authCookies["donor"] } } : {};
  await check("Donor Dashboard (/donor)", `${baseUrl}/donor`, donorCookie);
  await check("Donor Listings (/donor/listings)", `${baseUrl}/donor/listings`, donorCookie);
  await check("Donor New Listing (/donor/new-listing)", `${baseUrl}/donor/new-listing`, donorCookie);
  await check("Donor Tax Certificate & Impact (/donor/impact)", `${baseUrl}/donor/impact`, donorCookie);

  // Shelter routes
  const shelterCookie = authCookies["shelter"] ? { headers: { Cookie: authCookies["shelter"] } } : {};
  await check("Shelter Dashboard (/shelter)", `${baseUrl}/shelter`, shelterCookie);
  await check("Shelter Incoming (/shelter/incoming)", `${baseUrl}/shelter/incoming`, shelterCookie);
  await check("Shelter Deliveries (/shelter/deliveries)", `${baseUrl}/shelter/deliveries`, shelterCookie);
  await check("Shelter Capacity (/shelter/capacity)", `${baseUrl}/shelter/capacity`, shelterCookie);
  await check("Shelter Verification Checklist (/shelter/checklist/L-001)", `${baseUrl}/shelter/checklist/L-001`, shelterCookie);
  await check("Shelter Preferences (/shelter/preferences)", `${baseUrl}/shelter/preferences`, shelterCookie);

  // Coordinator routes
  const coordinatorCookie = authCookies["coordinator"] ? { headers: { Cookie: authCookies["coordinator"] } } : {};
  await check("Coordinator Dashboard (/coordinator)", `${baseUrl}/coordinator`, coordinatorCookie);

  // Driver routes
  const driverCookie = authCookies["driver"] ? { headers: { Cookie: authCookies["driver"] } } : {};
  await check("Driver Dashboard (/driver)", `${baseUrl}/driver`, driverCookie);
  await check("Driver Available Runs (/driver/available)", `${baseUrl}/driver/available`, driverCookie);
  await check("Driver Delivery History (/driver/history)", `${baseUrl}/driver/history`, driverCookie);
  await check("Driver Active Route (/driver/route)", `${baseUrl}/driver/route`, driverCookie);

  // Admin routes
  const adminCookie = authCookies["admin"] ? { headers: { Cookie: authCookies["admin"] } } : {};
  await check("Admin Dashboard (/admin)", `${baseUrl}/admin`, adminCookie);
  await check("Admin Verification Queue (/admin/verification)", `${baseUrl}/admin/verification`, adminCookie);
  await check("Admin Agent Logs (/admin/agent-log)", `${baseUrl}/admin/agent-log`, adminCookie);
  await check("Admin Listings Overview (/admin/listings)", `${baseUrl}/admin/listings`, adminCookie);
  await check("Admin Impact Metrics (/admin/metrics)", `${baseUrl}/admin/metrics`, adminCookie);
  await check("Admin System Health (/admin/health)", `${baseUrl}/admin/health`, adminCookie);

  // Profile & Settings
  await check("User Profile (/profile)", `${baseUrl}/profile`, donorCookie);
  await check("User Settings (/settings)", `${baseUrl}/settings`, donorCookie);

  // 6. Public APIs
  console.log(`\n--- SECTION 6: PUBLIC & REPORTING APIS ---`);
  await check("Public Impact API (/api/impact)", `${baseUrl}/api/impact`);
  await check("Tax Certificate PDF API (/api/donors/d0000000-0000-0000-0000-000000000001/certificate?year=2026)", 
    `${baseUrl}/api/donors/d0000000-0000-0000-0000-000000000001/certificate?year=2026`, adminCookie);

  console.log(`\n======================================================`);
  console.log(`Audit Complete: ${passes} Passed, ${failures} Failed`);
  console.log(`======================================================\n`);

  if (failures > 0) {
    process.exit(1);
  }
}

run();
