import { Text, Section, Button as EmailButton, Hr } from "@react-email/components";
import * as React from "react";
import { BaseEmail } from "./BaseEmail";

export interface AutoConfirmShelterProps {
  shelterName: string;
  recipientName: string;
  listingTitle: string;
  foodCategory: string;
  quantityKg: number;
  ersScore: number;
  pickupAddress: string;
  optOutUrl: string;
  dashboardUrl: string;
}

export function AutoConfirmShelter({
  shelterName,
  recipientName,
  listingTitle,
  foodCategory,
  quantityKg,
  ersScore,
  pickupAddress,
  optOutUrl,
  dashboardUrl,
}: AutoConfirmShelterProps) {
  return (
    <BaseEmail preheader={`Food rescue auto-confirmed for ${shelterName} — action within 5 minutes to opt out`}>
      {/* Urgency banner */}
      <Section style={styles.urgencyBanner}>
        <Text style={styles.urgencyLabel}>⚡ AGENTIC DISPATCHER — AUTO-CONFIRMED</Text>
      </Section>

      {/* Main content */}
      <Text style={styles.heading}>FOOD RESCUE AUTO-CONFIRMED</Text>

      <Text style={styles.body}>
        Hi <strong>{recipientName}</strong>,
      </Text>
      <Text style={styles.body}>
        Due to a critical Expiry Risk Score (ERS: <strong style={{ color: "#D42B2B" }}>{ersScore}/100</strong>),
        AnnaSetu's agentic dispatcher has automatically matched the following donation to{" "}
        <strong>{shelterName}</strong>.
      </Text>

      {/* Listing details */}
      <Section style={styles.detailBox}>
        <Text style={styles.detailLabel}>FOOD ITEM</Text>
        <Text style={styles.detailValue}>{listingTitle}</Text>
        <Hr style={styles.inlineDivider} />
        <Text style={styles.detailLabel}>CATEGORY</Text>
        <Text style={styles.detailValue}>{foodCategory}</Text>
        <Hr style={styles.inlineDivider} />
        <Text style={styles.detailLabel}>QUANTITY</Text>
        <Text style={styles.detailValue}>{quantityKg} kg</Text>
        <Hr style={styles.inlineDivider} />
        <Text style={styles.detailLabel}>PICKUP ADDRESS</Text>
        <Text style={styles.detailValue}>{pickupAddress}</Text>
        <Hr style={styles.inlineDivider} />
        <Text style={styles.detailLabel}>EXPIRY RISK SCORE</Text>
        <Text style={{ ...styles.detailValue, color: "#D42B2B", fontWeight: "bold" }}>{ersScore}/100 — CRITICAL</Text>
      </Section>

      <Text style={styles.body}>
        This match was made automatically because the food is at critical expiry risk and no manual
        confirmation was received within the required window.
      </Text>

      <Text style={styles.body}>
        <strong>You have 5 minutes to opt out if your shelter cannot accept this delivery.</strong>
      </Text>

      {/* CTA buttons */}
      <Section style={styles.ctaSection}>
        <EmailButton href={dashboardUrl} style={styles.primaryButton}>
          VIEW IN DASHBOARD →
        </EmailButton>
        <EmailButton href={optOutUrl} style={styles.secondaryButton}>
          OPT OUT OF THIS MATCH
        </EmailButton>
      </Section>

      <Text style={styles.footnote}>
        If no action is taken within 5 minutes, this match will proceed automatically. A driver will be
        assigned and you will receive a pickup notification.
      </Text>
    </BaseEmail>
  );
}

const styles = {
  urgencyBanner: {
    backgroundColor: "#D42B2B",
    padding: "12px 24px",
    marginBottom: "8px",
  },
  urgencyLabel: {
    fontFamily: '"Bebas Neue", Impact, Arial Black, sans-serif',
    fontSize: "14px",
    color: "#FFFFFF",
    letterSpacing: "0.05em",
    margin: 0,
    textAlign: "center" as const,
  },
  heading: {
    fontFamily: '"Bebas Neue", Impact, Arial Black, sans-serif',
    fontSize: "28px",
    color: "#0A0A0A",
    letterSpacing: "-0.01em",
    margin: "0 0 16px",
  },
  body: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: "15px",
    color: "#1A1A1A",
    lineHeight: "1.6",
    margin: "0 0 14px",
  },
  detailBox: {
    border: "2px solid #0A0A0A",
    padding: "16px",
    backgroundColor: "#F5F0E8",
    margin: "16px 0",
  },
  detailLabel: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: "10px",
    color: "#1A1A1A",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    margin: "4px 0 2px",
    opacity: 0.6,
  },
  detailValue: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: "15px",
    color: "#0A0A0A",
    margin: "0 0 8px",
    fontWeight: "600",
  },
  inlineDivider: {
    borderColor: "#0A0A0A",
    borderWidth: "1px",
    margin: "8px 0",
    opacity: 0.15,
  },
  ctaSection: {
    margin: "24px 0",
    display: "flex",
    gap: "12px",
  },
  primaryButton: {
    fontFamily: '"Bebas Neue", Impact, Arial Black, sans-serif',
    backgroundColor: "#0A0A0A",
    color: "#FFFFFF",
    fontSize: "14px",
    letterSpacing: "0.05em",
    padding: "12px 24px",
    border: "2px solid #0A0A0A",
    textDecoration: "none",
    display: "inline-block",
    marginRight: "12px",
  },
  secondaryButton: {
    fontFamily: '"Bebas Neue", Impact, Arial Black, sans-serif',
    backgroundColor: "transparent",
    color: "#D42B2B",
    fontSize: "14px",
    letterSpacing: "0.05em",
    padding: "12px 24px",
    border: "2px solid #D42B2B",
    textDecoration: "none",
    display: "inline-block",
  },
  footnote: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: "12px",
    color: "#1A1A1A",
    opacity: 0.6,
    margin: "16px 0 0",
    lineHeight: "1.5",
  },
};
