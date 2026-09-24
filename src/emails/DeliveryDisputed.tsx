import * as React from "react";
import {
  Section,
  Row,
  Column,
  Text,
  Button,
} from "@react-email/components";
import { BaseEmail } from "./BaseEmail";

export interface DeliveryDisputedProps {
  donorName: string;
  listingTitle: string;
  shelterName: string;
  violationNumber: number; // 1 or 2
  discrepancyType: string;
  volunteerNotes?: string;
  actionTaken: "warning_issued" | "account_suspended";
  actionUrl: string;
}

export function DeliveryDisputed({
  donorName = "Valued Donor",
  listingTitle = "Surplus Donation",
  shelterName = "Community Food Shelter",
  violationNumber = 1,
  discrepancyType = "Packaging Damaged / Unhygienic",
  volunteerNotes = "Boxes arrived opened with temperature above safe threshold.",
  actionTaken = "warning_issued",
  actionUrl = "https://annasetu.in/donor",
}: DeliveryDisputedProps) {
  const isSuspension = violationNumber >= 2 || actionTaken === "account_suspended";

  return (
    <BaseEmail
      preheader={
        isSuspension
          ? `🚫 AnnaSetu Account Suspended: Multiple discrepancies reported for ${listingTitle}`
          : `⚠️ Notice: Delivery Discrepancy Reported for ${listingTitle}`
      }
    >
      <Section style={{ borderBottom: `3px solid ${isSuspension ? "#dc2626" : "#000000"}`, paddingBottom: "12px", marginBottom: "16px" }}>
        <Text style={{ fontSize: "22px", fontWeight: "900", textTransform: "uppercase", margin: "0 0 6px", color: isSuspension ? "#dc2626" : "#000000", letterSpacing: "1px" }}>
          {isSuspension ? "ACCOUNT SUSPENDED" : "DELIVERY DISCREPANCY"}
        </Text>
        <Text
          style={{
            display: "inline-block",
            backgroundColor: isSuspension ? "#dc2626" : "#d97706",
            color: "#ffffff",
            padding: "4px 8px",
            fontSize: "11px",
            fontWeight: "900",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          {isSuspension ? "POLICY VIOLATION #2 🚫" : "POLICY WARNING #1 ⚠️"}
        </Text>
      </Section>

      <Section style={{ padding: "0 0 16px" }}>
        <Text style={{ fontSize: "16px", lineHeight: "24px", margin: "0 0 16px", color: "#000000" }}>
          Dear <strong>{donorName}</strong>,
        </Text>
        <Text style={{ fontSize: "15px", lineHeight: "22px", margin: "0 0 20px", color: "#1f2937" }}>
          {isSuspension ? (
            <>
              During delivery inspection for <strong>{listingTitle}</strong> at <strong>{shelterName}</strong>, the
              shelter recorded a critical checklist failure. Because this is the <strong>second recorded discrepancy</strong> against
              your account, your AnnaSetu donor account has been <strong>suspended immediately</strong> and all active listings cancelled per platform safety policy.
            </>
          ) : (
            <>
              During delivery inspection for <strong>{listingTitle}</strong> at <strong>{shelterName}</strong>, a checklist discrepancy
              was recorded by the receiving team. Per our Food Safety & Quality Policy (SRS §13.8), this email serves as a <strong>formal first warning</strong>.
              Your account remains active, but future discrepancies will trigger account removal.
            </>
          )}
        </Text>
      </Section>

      {/* Discrepancy Details Box */}
      <Section
        style={{
          border: `3px solid ${isSuspension ? "#dc2626" : "#000000"}`,
          backgroundColor: isSuspension ? "#fef2f2" : "#fffbeb",
          padding: "20px",
          marginBottom: "24px",
        }}
      >
        <Text
          style={{
            fontSize: "12px",
            fontWeight: "900",
            textTransform: "uppercase",
            margin: "0 0 12px",
            color: isSuspension ? "#dc2626" : "#b45309",
            letterSpacing: "1px",
          }}
        >
          {isSuspension ? "CRITICAL DISCREPANCY RECORD" : "INSPECTION DISCREPANCY NOTICE"}
        </Text>

        <Row style={{ marginBottom: "8px" }}>
          <Column style={{ width: "35%", fontSize: "13px", fontWeight: "bold", color: "#6b7280" }}>
            DONATION:
          </Column>
          <Column style={{ width: "65%", fontSize: "13px", fontWeight: "bold", color: "#000000" }}>
            {listingTitle}
          </Column>
        </Row>

        <Row style={{ marginBottom: "8px" }}>
          <Column style={{ width: "35%", fontSize: "13px", fontWeight: "bold", color: "#6b7280" }}>
            SHELTER:
          </Column>
          <Column style={{ width: "65%", fontSize: "13px", fontWeight: "bold", color: "#000000" }}>
            {shelterName}
          </Column>
        </Row>

        <Row style={{ marginBottom: "8px" }}>
          <Column style={{ width: "35%", fontSize: "13px", fontWeight: "bold", color: "#6b7280" }}>
            ISSUE TYPE:
          </Column>
          <Column style={{ width: "65%", fontSize: "13px", fontWeight: "bold", color: "#dc2626" }}>
            {discrepancyType}
          </Column>
        </Row>

        <Row style={{ marginBottom: "8px" }}>
          <Column style={{ width: "35%", fontSize: "13px", fontWeight: "bold", color: "#6b7280" }}>
            STATUS:
          </Column>
          <Column style={{ width: "65%", fontSize: "13px", fontWeight: "bold", color: "#dc2626" }}>
            {isSuspension ? "ACCOUNT SUSPENDED" : "WARNING ISSUED (STRIKE 1)"}
          </Column>
        </Row>

        {volunteerNotes ? (
          <Row>
            <Column style={{ width: "35%", fontSize: "13px", fontWeight: "bold", color: "#6b7280" }}>
              INSPECTION NOTES:
            </Column>
            <Column style={{ width: "65%", fontSize: "13px", color: "#374151", fontStyle: "italic" }}>
              "{volunteerNotes}"
            </Column>
          </Row>
        ) : null}
      </Section>

      {/* Contest & Support Note */}
      <Section
        style={{
          border: "2px solid #000000",
          backgroundColor: "#ffffff",
          padding: "16px",
          marginBottom: "24px",
        }}
      >
        <Text style={{ fontSize: "13px", fontWeight: "bold", margin: "0 0 6px", color: "#000000" }}>
          HOW TO CONTEST THIS REPORT:
        </Text>
        <Text style={{ fontSize: "12px", lineHeight: "18px", margin: "0", color: "#4b5563" }}>
          Donors have a <strong>7-day contest window</strong> to dispute this report. If you believe this checklist discrepancy was made in error or was caused during transit, please contact Platform Support at <strong>support@annasetu.in</strong> with photos and dispatch notes for administrative review.
        </Text>
      </Section>

      {/* CTA Button */}
      <Section style={{ textAlign: "center", margin: "24px 0 16px" }}>
        <Button
          href={actionUrl}
          style={{
            backgroundColor: isSuspension ? "#dc2626" : "#000000",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: "bold",
            padding: "14px 28px",
            textDecoration: "none",
            borderRadius: "0px",
            border: "2px solid #000000",
            boxShadow: "4px 4px 0px #000000",
            display: "inline-block",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          {isSuspension ? "CONTACT PLATFORM SUPPORT" : "REVIEW DONOR ACCOUNT"}
        </Button>
      </Section>
    </BaseEmail>
  );
}

export default DeliveryDisputed;
