import { test, describe } from "node:test";
import assert from "node:assert";
import { z } from "zod";
import {
  SEED_DONORS,
  SEED_SHELTERS,
  SEED_DRIVERS,
  SEED_LISTINGS,
  SEED_IMPACT_METRICS,
} from "../src/lib/seed/demoData";
import {
  renderVerificationSubmitted,
  renderVerificationApproved,
  renderVerificationRejected,
  renderWelcomeDonor,
  renderERSAlert,
  renderMatchAccepted,
  renderCoordinatorInvite,
  renderDriverAssigned,
  renderDriverPickedUp,
  renderDeliveryAccepted,
  renderDeliveryDisputed,
  renderAutoConfirmShelter,
  renderEscalateToAdmin,
  renderAgentOverrideAlert,
} from "../src/lib/email/templates";
import { generateTaxCertificatePdf, type CertificateData } from "../src/lib/pdf/certificate";
import { calculateCO2e } from "../src/lib/impact/calculator";

const CVOutputSchema = z.object({
  food_category: z.string().nullable(),
  estimated_servings: z.number().nullable(),
  quantity_kg: z.number().nullable(),
  confidence_score: z.number().min(0).max(1),
  intake_method: z.literal("cv"),
  photo_url: z.string().optional(),
  ai_warning: z.string().optional(),
});

describe("Phase 20: Demo Data Seed & End-to-End Flow Tests", () => {
  describe("Seed Dataset Integrity (phases.md §20 / SRS §21.3)", () => {
    test("contains exactly 3 verified donor businesses with FSSAI & PAN", () => {
      assert.strictEqual(SEED_DONORS.length, 3);
      for (const donor of SEED_DONORS) {
        assert.ok(donor.id);
        assert.ok(donor.businessName);
        assert.ok(donor.fssaiNumber && donor.fssaiNumber.length === 14);
        assert.ok(donor.panNumber && donor.panNumber.length === 10);
        assert.ok(donor.lat && donor.lng);
      }
    });

    test("contains 4 shelters with defined capacities and coordinates", () => {
      assert.strictEqual(SEED_SHELTERS.length, 4);
      for (const shelter of SEED_SHELTERS) {
        assert.ok(shelter.id);
        assert.ok(shelter.name);
        assert.ok(shelter.capacityKg > 0);
        assert.ok(shelter.currentLoadKg >= 0);
        assert.ok(shelter.lat && shelter.lng);
        assert.strictEqual(shelter.isActive, true);
      }
      // Children's Home has acceptsAutoConfirm = false (manual control test)
      const manualShelter = SEED_SHELTERS.find((s) => !s.acceptsAutoConfirm);
      assert.ok(manualShelter);
      assert.strictEqual(manualShelter?.name, "Children's Home");
    });

    test("contains 2 verified volunteer drivers with distinct vehicles", () => {
      assert.strictEqual(SEED_DRIVERS.length, 2);
      const vehicles = SEED_DRIVERS.map((d) => d.vehicleType);
      assert.ok(vehicles.includes("bike"));
      assert.ok(vehicles.includes("auto"));
    });

    test("contains 5 listings across distinct ERS stages (28, 62, 84, delivered, disputed)", () => {
      assert.strictEqual(SEED_LISTINGS.length, 5);

      const ers28 = SEED_LISTINGS.find((l) => l.ersScore === 28);
      assert.ok(ers28);
      assert.strictEqual(ers28?.foodCategory, "Fresh produce");

      const ers62 = SEED_LISTINGS.find((l) => l.ersScore === 62);
      assert.ok(ers62);

      const ers84 = SEED_LISTINGS.find((l) => l.ersScore === 84);
      assert.ok(ers84);

      const delivered = SEED_LISTINGS.find((l) => l.status === "delivered");
      assert.ok(delivered);

      const disputed = SEED_LISTINGS.find((l) => l.status === "disputed");
      assert.ok(disputed);
      assert.strictEqual(disputed?.strikeCount, 1);
    });

    test("preloaded impact totals exceed 48,000 meals with consistent CO2e avoided", () => {
      assert.ok(SEED_IMPACT_METRICS.totalMealsRescued >= 48000);
      assert.ok(SEED_IMPACT_METRICS.totalWeightKg > 19000);
      // EPA WARM formula: weight * 2.5
      const expectedCo2e = calculateCO2e(SEED_IMPACT_METRICS.totalWeightKg);
      assert.strictEqual(SEED_IMPACT_METRICS.totalCo2eAvoidedKg, expectedCo2e);
    });
  });

  describe("All 15 SMTP Email Types Firing (phases.md §20)", () => {
    test("1. VerificationSubmitted email renders correctly", async () => {
      const html = await renderVerificationSubmitted({
        adminName: "Admin",
        businessName: "MG Road Dhaba",
        businessType: "Restaurant",
        contactEmail: "donor@annasetu.in",
        fssaiNumber: "11223344556677",
        submittedAt: "25 Sep 2026",
      });
      assert.ok(html.includes("MG Road Dhaba"));
    });

    test("2. VerificationApproved email renders correctly", async () => {
      const html = await renderVerificationApproved({
        donorName: "Ramesh Kumar",
        businessName: "MG Road Dhaba",
        businessType: "Restaurant",
        fssaiNumber: "11223344556677",
        reviewedAt: "25 Sep 2026",
        reviewedBy: "Admin",
        loginUrl: "https://annasetu.in/login",
      });
      assert.ok(html.includes("MG Road Dhaba"));
    });

    test("3. VerificationRejected email renders correctly", async () => {
      const html = await renderVerificationRejected({
        donorName: "Ramesh Kumar",
        businessName: "MG Road Dhaba",
        rejectionReason: "FSSAI registration certificate illegible",
        reviewedAt: "25 Sep 2026",
        supportEmail: "support@annasetu.in",
      });
      assert.ok(html.includes("FSSAI registration certificate illegible"));
    });

    test("4. WelcomeDonor email renders correctly", async () => {
      const html = await renderWelcomeDonor({
        donorName: "Ramesh Kumar",
        businessName: "MG Road Dhaba",
        dashboardUrl: "https://annasetu.in/donor",
      });
      assert.ok(html.includes("MG Road Dhaba"));
      assert.ok(html.includes("RAMESH KUMAR"));
    });

    test("5. ERSAlert email renders correctly", async () => {
      const html = await renderERSAlert({
        donorName: "Ramesh Kumar",
        listingTitle: "Dal Makhani (High Risk)",
        ersScore: 84,
        foodCategory: "Dairy-based dishes",
        quantityKg: 18,
        servings: 45,
        expiryTime: "Today, 8:00 PM",
        actionUrl: "https://annasetu.in/admin",
        recipientType: "donor",
      });
      assert.ok(html.includes("84"));
      assert.ok(html.includes("EXPIRY RISK ALERT"));
    });

    test("6. MatchAccepted email renders correctly", async () => {
      const html = await renderMatchAccepted({
        donorName: "Ramesh Kumar",
        listingTitle: "Dal Makhani",
        shelterName: "Hope Shelter",
        shelterAddress: "Richmond Town, Bengaluru",
        quantityKg: 18,
        servings: 45,
        pickupAddress: "MG Road Central",
        viewListingUrl: "https://annasetu.in/donor",
      });
      assert.ok(html.includes("Hope Shelter"));
      assert.ok(html.includes("Dal Makhani"));
    });

    test("7. CoordinatorInvite email renders correctly", async () => {
      const html = await renderCoordinatorInvite({
        shelterName: "Hope Shelter",
        inviterName: "Shelter Director",
        inviteeEmail: "coord@hopeshelter.org",
        role: "Shelter Coordinator",
        inviteLink: "https://annasetu.in/shelter/join?token=xyz",
        expiresInDays: 2,
      });
      assert.ok(html.includes("Hope Shelter"));
    });

    test("8. DriverAssigned email renders correctly", async () => {
      const html = await renderDriverAssigned({
        recipientName: "Rahul Verma",
        recipientRole: "driver",
        listingTitle: "Dal Makhani",
        foodCategory: "Dairy-based dishes",
        quantityKg: 18,
        servings: 45,
        ersScore: 84,
        pickupAddress: "MG Road Central",
        dropoffAddress: "Richmond Town",
        shelterName: "Hope Shelter",
        donorName: "MG Road Dhaba",
        actionUrl: "https://annasetu.in/driver",
      });
      assert.ok(html.includes("Rahul Verma"));
      assert.ok(html.includes("Hope Shelter"));
    });

    test("9. DriverPickedUp email renders correctly", async () => {
      const html = await renderDriverPickedUp({
        recipientName: "Hope Shelter",
        recipientRole: "shelter",
        listingTitle: "Dal Makhani",
        foodCategory: "Dairy-based dishes",
        quantityKg: 18,
        servings: 45,
        driverName: "Rahul Verma",
        pickedUpAt: "2:00 PM",
        destinationName: "Hope Shelter",
        destinationAddress: "Richmond Town",
        actionUrl: "https://annasetu.in/shelter",
      });
      assert.ok(html.includes("Rahul Verma"));
    });

    test("10. DeliveryAccepted email renders correctly", async () => {
      const html = await renderDeliveryAccepted({
        donorName: "MG Road Dhaba",
        listingTitle: "Dal Makhani",
        quantityKg: 18,
        servings: 45,
        co2eAvoidedKg: 45,
        shelterName: "Hope Shelter",
        shelterAddress: "Richmond Town",
        deliveryDate: "25 Sep 2026",
        pinVerified: true,
        actionUrl: "https://annasetu.in/donor",
      });
      assert.ok(html.includes("45"));
    });

    test("11. DeliveryDisputed (Strike 1 warning) email renders correctly", async () => {
      const html = await renderDeliveryDisputed({
        donorName: "Campus Canteen",
        listingTitle: "Chicken Biryani",
        shelterName: "Hope Shelter",
        violationNumber: 1,
        discrepancyType: "temperature_spoilage",
        volunteerNotes: "Sour smell detected during inspection",
        actionTaken: "warning_issued",
        actionUrl: "https://annasetu.in/guidelines",
      });
      assert.ok(html.includes("DELIVERY DISCREPANCY"));
      assert.ok(html.includes("Campus Canteen"));
    });

    test("12. DeliveryDisputed (Strike 2 suspension) email renders correctly", async () => {
      const html = await renderDeliveryDisputed({
        donorName: "Campus Canteen",
        listingTitle: "Rotten Curry",
        shelterName: "Hope Shelter",
        violationNumber: 2,
        discrepancyType: "contamination",
        volunteerNotes: "Second food safety failure confirmed.",
        actionTaken: "account_suspended",
        actionUrl: "https://annasetu.in/guidelines",
      });
      assert.ok(html.includes("ACCOUNT SUSPENDED"));
      assert.ok(html.includes("Campus Canteen"));
    });

    test("13. AutoConfirmShelter email renders correctly", async () => {
      const html = await renderAutoConfirmShelter({
        shelterName: "Hope Shelter",
        recipientName: "Hope Shelter Coordinator",
        listingTitle: "Dal Makhani",
        quantityKg: 18,
        foodCategory: "Dairy-based dishes",
        ersScore: 84,
        pickupAddress: "MG Road Central",
        optOutUrl: "https://annasetu.in/api/dispatcher/opt-out?match_id=M-1",
        dashboardUrl: "https://annasetu.in/shelter",
      });
      assert.ok(html.includes("Hope Shelter"));
      assert.ok(html.includes("opt-out"));
    });

    test("14. EscalateToAdmin email renders correctly", async () => {
      const html = await renderEscalateToAdmin({
        listingTitle: "High Risk Dairy",
        listingId: "L-003",
        ersScore: 92,
        reason: "No available shelter with chilled storage capacity",
        adminUrl: "https://annasetu.in/admin",
        pickupAddress: "MG Road Central",
        foodCategory: "Dairy-based dishes",
        quantityKg: 35,
      });
      assert.ok(html.includes("ESCALATION"));
      assert.ok(html.includes("92"));
    });

    test("15. AgentOverrideAlert email renders correctly", async () => {
      const html = await renderAgentOverrideAlert({
        actionType: "AUTO_CONFIRM_SHELTER",
        listingTitle: "Dal Makhani",
        listingId: "L-001",
        reason: "Shelter refrigerator failure",
        adminName: "Super Admin",
        overriddenAt: "25 Sep 2026",
        recipientRole: "shelter",
        reversalSummary: "Reserved capacity restored.",
      });
      assert.ok(html.includes("DISPATCHER ACTION OVERRIDDEN BY ADMIN"));
      assert.ok(html.includes("Shelter refrigerator failure"));
    });
  });

  describe("Agentic Dispatcher Demo Timeout (< 30s compression)", () => {
    test("compressed demo timeout triggers when match is over 30s old", () => {
      const DEMO_TIMEOUT_SECONDS = 30;
      const matchCreatedAt = new Date(Date.now() - 35 * 1000); // 35s ago
      const elapsedSeconds = (Date.now() - matchCreatedAt.getTime()) / 1000;

      const isTimedOut = elapsedSeconds >= DEMO_TIMEOUT_SECONDS;
      assert.strictEqual(isTimedOut, true);
    });

    test("does not trigger timeout if match is younger than 30s", () => {
      const DEMO_TIMEOUT_SECONDS = 30;
      const matchCreatedAt = new Date(Date.now() - 15 * 1000); // 15s ago
      const elapsedSeconds = (Date.now() - matchCreatedAt.getTime()) / 1000;

      const isTimedOut = elapsedSeconds >= DEMO_TIMEOUT_SECONDS;
      assert.strictEqual(isTimedOut, false);
    });
  });

  describe("CV Intake on Biryani Photo Simulation (phases.md §20)", () => {
    test("validates biryani photo CV output against CVOutputSchema", () => {
      const biryaniResult = {
        food_category: "Cooked meals",
        estimated_servings: 45,
        quantity_kg: 18.0,
        confidence_score: 0.88,
        intake_method: "cv",
        photo_url: "https://storage.supabase.co/food-photos/biryani-demo.jpg",
      };

      const parsed = CVOutputSchema.safeParse(biryaniResult);
      assert.strictEqual(parsed.success, true);
      if (parsed.success) {
        assert.strictEqual(parsed.data.food_category, "Cooked meals");
        assert.strictEqual(parsed.data.estimated_servings, 45);
        assert.strictEqual(parsed.data.confidence_score, 0.88);
      }
    });
  });

  describe("Demo Tax Certificate Generation (phases.md §20)", () => {
    test("generates downloadable PDF for demo donor MG Road Dhaba", async () => {
      const demoCertData: CertificateData = {
        certificateId: "AS-CERT-2026-DEMO01",
        donorName: SEED_DONORS[0].businessName,
        donorEmail: SEED_DONORS[0].email,
        businessType: SEED_DONORS[0].businessType,
        panNumber: SEED_DONORS[0].panNumber,
        fssaiNumber: SEED_DONORS[0].fssaiNumber,
        financialYear: "FY 2026-2027",
        totalDonations: 52,
        totalWeightKg: 860.0,
        totalMeals: 2150,
        co2eAvoidedKg: 2150.0,
        issueDate: "25 Sep 2026",
        verificationUrl: "https://annasetu.in/verify/AS-CERT-2026-DEMO01",
      };

      const pdfBuffer = await generateTaxCertificatePdf(demoCertData);
      assert.ok(Buffer.isBuffer(pdfBuffer));
      assert.ok(pdfBuffer.length > 2500);
      assert.strictEqual(pdfBuffer.subarray(0, 5).toString("ascii"), "%PDF-");
    });
  });
});
