import { test, describe } from "node:test";
import assert from "node:assert";
import {
  generateTaxCertificatePdf,
  getCurrentFinancialYear,
  formatImpactCsv,
  type CertificateData,
} from "../src/lib/pdf/certificate";

describe("Phase 19: Tax Certificate & Impact Reporting — Unit Tests", () => {
  describe("Financial Year Calculation (phases.md §19)", () => {
    test("calculates Indian Financial Year (April 1 - March 31) for months in Q1-Q3", () => {
      // September 2026 is month index 8 => FY 2026-2027
      const septDate = new Date(2026, 8, 25);
      assert.strictEqual(getCurrentFinancialYear(septDate), "2026-2027");

      // April 2026 is month index 3 => FY 2026-2027
      const aprDate = new Date(2026, 3, 1);
      assert.strictEqual(getCurrentFinancialYear(aprDate), "2026-2027");
    });

    test("calculates Indian Financial Year for months in Q4 (January - March)", () => {
      // February 2026 is month index 1 => FY 2025-2026
      const febDate = new Date(2026, 1, 15);
      assert.strictEqual(getCurrentFinancialYear(febDate), "2025-2026");

      // March 2026 is month index 2 => FY 2025-2026
      const marDate = new Date(2026, 2, 31);
      assert.strictEqual(getCurrentFinancialYear(marDate), "2025-2026");
    });
  });

  describe("CSV ESG Impact Export (phases.md §19 / SRS §19.3)", () => {
    test("formats donor array into standard CSV format with correct header columns", () => {
      const donors = [
        {
          donor_id: "d-1",
          donor_name: "MG Road Dhaba",
          business_type: "Restaurant",
          pan_number: "ABCDE1234F",
          fssai_number: "11223344556677",
          total_donations: 52,
          total_weight_kg: 860.0,
          total_meals: 2150,
          co2e_avoided_kg: 2150.0,
          financial_year: "FY 2026-2027",
        },
      ];

      const csv = formatImpactCsv(donors);
      assert.ok(csv.includes("Donor ID,Donor Name,Business Type,PAN Number,FSSAI Number"));
      assert.ok(csv.includes('"MG Road Dhaba"'));
      assert.ok(csv.includes('"ABCDE1234F"'));
      assert.ok(csv.includes('"860.00"'));
      assert.ok(csv.includes('"2150"'));
    });

    test("escapes quotes properly in donor names", () => {
      const donors = [
        {
          donor_id: "d-2",
          donor_name: 'Sharma\'s "Royal" Sweets',
          total_donations: 10,
          total_weight_kg: 100,
          total_meals: 250,
          co2e_avoided_kg: 250,
          financial_year: "FY 2026-2027",
        },
      ];

      const csv = formatImpactCsv(donors);
      // Double quotes should be escaped as ""
      assert.ok(csv.includes('""Royal""'));
    });

    test("handles empty donor list gracefully with header only", () => {
      const csv = formatImpactCsv([]);
      assert.ok(csv.startsWith("Donor ID,Donor Name"));
      const lines = csv.trim().split("\r\n");
      assert.strictEqual(lines.length, 1);
    });
  });

  describe("PDFKit Tax Certificate Generator (phases.md §19 / rules.md §1)", () => {
    test("generates valid PDF buffer with %PDF- header for complete data", async () => {
      const certData: CertificateData = {
        certificateId: "AS-CERT-2026-0428",
        donorName: "MG Road Dhaba",
        donorEmail: "dhaba@mgroad.in",
        businessType: "Restaurant",
        panNumber: "ABCDE1234F",
        fssaiNumber: "11223344556677",
        financialYear: "FY 2026-2027",
        totalDonations: 48,
        totalWeightKg: 860.0,
        totalMeals: 2150,
        co2eAvoidedKg: 2150.0,
        issueDate: "25 Sep 2026",
        verificationUrl: "https://annasetu.in/verify/AS-CERT-2026-0428",
      };

      const buffer = await generateTaxCertificatePdf(certData);
      assert.ok(Buffer.isBuffer(buffer));
      assert.ok(buffer.length > 2000, `Buffer length is ${buffer.length}, expected > 2000`);

      // Verify PDF magic bytes '%PDF-' at start
      const pdfMagic = buffer.subarray(0, 5).toString("ascii");
      assert.strictEqual(pdfMagic, "%PDF-");
    });

    test("generates valid PDF even when PAN or FSSAI is empty (fallback handled)", async () => {
      const certData: CertificateData = {
        certificateId: "AS-CERT-2026-FALLBACK",
        donorName: "Community Donor",
        panNumber: "",
        fssaiNumber: "",
        financialYear: "FY 2026-2027",
        totalDonations: 1,
        totalWeightKg: 10.0,
        totalMeals: 25,
        co2eAvoidedKg: 25.0,
        issueDate: "25 Sep 2026",
        verificationUrl: "https://annasetu.in/verify/AS-CERT-2026-FALLBACK",
      };

      const buffer = await generateTaxCertificatePdf(certData);
      assert.ok(Buffer.isBuffer(buffer));
      const pdfMagic = buffer.subarray(0, 5).toString("ascii");
      assert.strictEqual(pdfMagic, "%PDF-");
    });

    test("certificate data contract includes all required fields from phases.md §19", () => {
      const fields: Array<keyof CertificateData> = [
        "certificateId",
        "donorName",
        "panNumber",
        "fssaiNumber",
        "financialYear",
        "totalDonations",
        "totalWeightKg",
        "totalMeals",
        "co2eAvoidedKg",
        "issueDate",
        "verificationUrl",
      ];

      const sample: CertificateData = {
        certificateId: "C-1",
        donorName: "Donor",
        panNumber: "P-1",
        fssaiNumber: "F-1",
        financialYear: "FY-1",
        totalDonations: 10,
        totalWeightKg: 100,
        totalMeals: 250,
        co2eAvoidedKg: 250,
        issueDate: "Today",
        verificationUrl: "http://example.com",
      };

      fields.forEach((f) => {
        assert.ok(sample[f] !== undefined, `Missing expected field: ${f}`);
      });
    });
  });
});
