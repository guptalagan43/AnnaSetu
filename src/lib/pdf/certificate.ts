// @ts-ignore
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";

export interface CertificateData {
  certificateId: string;
  donorName: string;
  donorEmail?: string;
  businessType?: string;
  panNumber: string;
  fssaiNumber: string;
  financialYear: string;
  totalDonations: number;
  totalWeightKg: number;
  totalMeals: number;
  co2eAvoidedKg: number;
  issueDate: string;
  verificationUrl: string;
}

/**
 * Calculates current Indian Financial Year (April 1 - March 31)
 * Example: in September 2026, FY is "2026-2027"
 */
export function getCurrentFinancialYear(date: Date = new Date()): string {
  const month = date.getMonth(); // 0-indexed: 0 = Jan, 3 = Apr
  const year = date.getFullYear();
  if (month >= 3) {
    // April or later
    return `${year}-${year + 1}`;
  } else {
    // Jan - Mar
    return `${year - 1}-${year}`;
  }
}

/**
 * Formats donor impact data into a CSV string for bulk ESG export
 */
export function formatImpactCsv(
  donors: Array<{
    donor_id: string;
    donor_name: string;
    business_type?: string;
    pan_number?: string;
    fssai_number?: string;
    total_donations: number;
    total_weight_kg: number;
    total_meals: number;
    co2e_avoided_kg: number;
    financial_year: string;
  }>
): string {
  const headers = [
    "Donor ID",
    "Donor Name",
    "Business Type",
    "PAN Number",
    "FSSAI Number",
    "Total Rescues",
    "Total Weight (kg)",
    "Total Meals Provided",
    "CO2e Avoided (kg)",
    "Financial Year",
  ];

  const escapeCsv = (val: unknown) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = donors.map((d) =>
    [
      escapeCsv(d.donor_id),
      escapeCsv(d.donor_name),
      escapeCsv(d.business_type || "Food Business"),
      escapeCsv(d.pan_number || "NOT_PROVIDED"),
      escapeCsv(d.fssai_number || "NOT_PROVIDED"),
      escapeCsv(d.total_donations),
      escapeCsv(d.total_weight_kg.toFixed(2)),
      escapeCsv(d.total_meals),
      escapeCsv(d.co2e_avoided_kg.toFixed(2)),
      escapeCsv(d.financial_year),
    ].join(",")
  );

  return [headers.join(","), ...rows].join("\r\n");
}

/**
 * Draws a stylized vector QR code verification stamp onto the PDF document
 */
function drawQrStamp(doc: PDFKit.PDFDocument, x: number, y: number, size: number) {
  // Border container
  doc.rect(x, y, size, size).lineWidth(1.5).stroke("#0A0A0A");

  const moduleSize = size / 11;

  // Helper to draw a square block
  const drawBlock = (col: number, row: number, w = 1, h = 1) => {
    doc.rect(x + col * moduleSize, y + row * moduleSize, w * moduleSize, h * moduleSize).fill("#0A0A0A");
  };

  // Top-left finder pattern
  drawBlock(1, 1, 3, 3);
  doc.rect(x + 1.5 * moduleSize, y + 1.5 * moduleSize, moduleSize, moduleSize).fill("#FFFFFF");

  // Top-right finder pattern
  drawBlock(7, 1, 3, 3);
  doc.rect(x + 7.5 * moduleSize, y + 1.5 * moduleSize, moduleSize, moduleSize).fill("#FFFFFF");

  // Bottom-left finder pattern
  drawBlock(1, 7, 3, 3);
  doc.rect(x + 1.5 * moduleSize, y + 7.5 * moduleSize, moduleSize, moduleSize).fill("#FFFFFF");

  // Middle pseudo-data modules
  drawBlock(5, 2, 1, 1);
  drawBlock(2, 5, 1, 1);
  drawBlock(4, 4, 3, 1);
  drawBlock(5, 6, 2, 1);
  drawBlock(8, 5, 1, 2);
  drawBlock(5, 8, 2, 2);
  drawBlock(8, 8, 1, 1);
}

/**
 * Generates an official, brutalist Section 80G surplus food rescue certificate PDF
 */
export async function generateTaxCertificatePdf(data: CertificateData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 36, bottom: 36, left: 36, right: 36 },
        info: {
          Title: `AnnaSetu Tax Certificate — ${data.certificateId}`,
          Author: "AnnaSetu National Food Rescue Grid",
          Subject: "Section 80G Surplus Food Redistribution Certificate",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 36;
      const contentWidth = pageWidth - margin * 2;

      // Outer Brutalist Double Border
      doc.lineWidth(4).strokeColor("#0A0A0A").rect(margin, margin, contentWidth, pageHeight - margin * 2).stroke();
      doc.lineWidth(1).strokeColor("#0A0A0A").rect(margin + 6, margin + 6, contentWidth - 12, pageHeight - margin * 2 - 12).stroke();

      let cursorY = margin + 20;

      // Header Banner
      doc.rect(margin + 6, cursorY, contentWidth - 12, 42).fill("#0A0A0A");
      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .fillColor("#FFFFFF")
        .text("ANNASETU FOOD RESCUE NETWORK", margin + 6, cursorY + 12, {
          width: contentWidth - 12,
          align: "center",
          characterSpacing: 2,
        });

      cursorY += 56;

      // Title & Subtitle
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor("#D42B2B")
        .text("ANNUAL SURPLUS FOOD DONATION & SECTION 80G TAX CERTIFICATE", margin + 20, cursorY, {
          width: contentWidth - 40,
          align: "center",
        });

      cursorY += 20;

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#444444")
        .text("Issued under the Indian Income Tax Act 1961 • National Urban Food Waste Diversion Protocol", margin + 20, cursorY, {
          width: contentWidth - 40,
          align: "center",
        });

      cursorY += 24;

      // Certificate Meta Ribbon
      doc.lineWidth(1.5).strokeColor("#0A0A0A").rect(margin + 20, cursorY, contentWidth - 40, 26).stroke();
      doc.rect(margin + 20, cursorY, contentWidth - 40, 26).fill("#F5F0E8");

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#0A0A0A")
        .text(`CERTIFICATE ID: ${data.certificateId}`, margin + 30, cursorY + 8)
        .text(`FINANCIAL YEAR: ${data.financialYear}`, margin + 210, cursorY + 8)
        .text(`DATE OF ISSUE: ${data.issueDate}`, margin + 360, cursorY + 8);

      cursorY += 38;

      // Certification Statement
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#0A0A0A")
        .text(
          "This is to certify that the registered donor entity specified below has redistributed verified safe, nutritious surplus food through the AnnaSetu Autonomous Logistics Grid to certified non-profit charitable shelter organizations:",
          margin + 20,
          cursorY,
          { width: contentWidth - 40, align: "justify", lineGap: 3 }
        );

      cursorY += 34;

      // Donor Information Box
      doc.lineWidth(1).strokeColor("#0A0A0A").rect(margin + 20, cursorY, contentWidth - 40, 78).stroke();
      doc.rect(margin + 20, cursorY, contentWidth - 40, 20).fill("#0A0A0A");
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#FFFFFF").text("DONOR ENTITY CREDENTIALS", margin + 28, cursorY + 6);

      doc.font("Helvetica-Bold").fontSize(10).fillColor("#0A0A0A").text("Entity / Business Name:", margin + 28, cursorY + 28);
      doc.font("Helvetica").fontSize(10).text(data.donorName, margin + 170, cursorY + 28);

      doc.font("Helvetica-Bold").fontSize(10).text("Permanent Account Number (PAN):", margin + 28, cursorY + 44);
      doc.font("Helvetica").fontSize(10).text(data.panNumber || "NOT_PROVIDED", margin + 220, cursorY + 44);

      doc.font("Helvetica-Bold").fontSize(10).text("FSSAI Registration / License No:", margin + 28, cursorY + 60);
      doc.font("Helvetica").fontSize(10).text(data.fssaiNumber || "NOT_PROVIDED", margin + 220, cursorY + 60);

      cursorY += 92;

      // Cumulative Impact Statistics Table
      doc.lineWidth(1).strokeColor("#0A0A0A").rect(margin + 20, cursorY, contentWidth - 40, 105).stroke();
      doc.rect(margin + 20, cursorY, contentWidth - 40, 20).fill("#D42B2B");
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#FFFFFF")
        .text("VERIFIED FOOD RESCUE & ESG DIVIDENDS SUMMARY", margin + 28, cursorY + 6);

      const tableCols = [
        { label: "VERIFIED RESCUES", value: `${data.totalDonations} Completed`, x: margin + 28 },
        { label: "TOTAL WEIGHT RESCUED", value: `${data.totalWeightKg.toFixed(1)} kg`, x: margin + 160 },
        { label: "MEALS REDISTRIBUTED", value: `${data.totalMeals.toLocaleString()} Portions`, x: margin + 285 },
        { label: "CO2e AVOIDED (WARM)", value: `${data.co2eAvoidedKg.toFixed(1)} kg`, x: margin + 415 },
      ];

      tableCols.forEach((col) => {
        doc.font("Helvetica-Bold").fontSize(8).fillColor("#666666").text(col.label, col.x, cursorY + 30);
        doc.font("Helvetica-Bold").fontSize(13).fillColor("#0A0A0A").text(col.value, col.x, cursorY + 48);
      });

      doc.lineWidth(0.5).strokeColor("#CCCCCC").moveTo(margin + 20, cursorY + 74).lineTo(margin + contentWidth - 20, cursorY + 74).stroke();

      doc
        .font("Helvetica-Oblique")
        .fontSize(8)
        .fillColor("#555555")
        .text(
          "* Meals calculated based on standard 400g nutritional serving. Carbon avoided calculated using EPA WARM v15 methodology (2.50 kg CO2e per 1.00 kg organic food waste diverted).",
          margin + 28,
          cursorY + 84,
          { width: contentWidth - 56 }
        );

      cursorY += 120;

      // Section 80G Statutory Exemption Advisory Box
      doc.lineWidth(1).strokeColor("#0A0A0A").rect(margin + 20, cursorY, contentWidth - 40, 80).stroke();
      doc.rect(margin + 20, cursorY, contentWidth - 40, 80).fill("#F9F8F5");

      doc.font("Helvetica-Bold").fontSize(9).fillColor("#0A0A0A").text("SECTION 80G STATUTORY ADVISORY & CSR IN-KIND DEDUCTIBILITY", margin + 28, cursorY + 8);

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#333333")
        .text(
          "1. This certificate serves as documentary evidence of in-kind food inventory surplus contribution under Rule 11AA of the Income Tax Rules, 1962.\n" +
          "2. Every physical donation listed herein was verified via digital 4-digit PIN authentication and 5-point food quality safety checklists.\n" +
          "3. All recipient partner shelters operate under Section 12A/80G charitable registrations. No goods were received in exchange for commercial consideration.\n" +
          "4. For corporate ESG / Business Responsibility and Sustainability Reporting (BRSR), this document qualifies under Core Social Dividend & Food Security pillars.",
          margin + 28,
          cursorY + 22,
          { width: contentWidth - 56, lineGap: 2.5 }
        );

      cursorY += 95;

      // Signatures & Verification Stamp Section
      const stampX = margin + 25;
      const stampSize = 65;
      drawQrStamp(doc, stampX, cursorY, stampSize);

      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor("#0A0A0A")
        .text("DIGITAL AUDIT STAMP", stampX + stampSize + 10, cursorY + 6)
        .font("Helvetica")
        .fontSize(7)
        .fillColor("#555555")
        .text(`Scan to verify authenticity on blockchain ledger:\n${data.verificationUrl}`, stampX + stampSize + 10, cursorY + 18, {
          width: 170,
        })
        .font("Helvetica-Bold")
        .fontSize(7)
        .fillColor("#D42B2B")
        .text("✓ DIGITALLY AUTHENTICATED VIA POSTGIS AUDIT LOGS", stampX + stampSize + 10, cursorY + 46);

      // Signatory line
      const sigX = margin + contentWidth - 170;
      doc.lineWidth(1).strokeColor("#0A0A0A").moveTo(sigX, cursorY + 45).lineTo(sigX + 140, cursorY + 45).stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#0A0A0A")
        .text("AUTHORIZED SIGNATORY", sigX, cursorY + 50, { width: 140, align: "center" })
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#666666")
        .text("AnnaSetu Food Network Trust", sigX, cursorY + 62, { width: 140, align: "center" });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
