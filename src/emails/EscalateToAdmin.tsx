import { Text, Section, Button as EmailButton, Hr } from "@react-email/components";
import * as React from "react";
import { BaseEmail } from "./BaseEmail";

export interface EscalateToAdminProps {
  listingTitle: string;
  listingId: string;
  ersScore: number;
  reason: string;
  adminUrl: string;
  pickupAddress: string;
  foodCategory: string;
  quantityKg: number;
}

export function EscalateToAdmin({
  listingTitle,
  listingId,
  ersScore,
  reason,
  adminUrl,
  pickupAddress,
  foodCategory,
  quantityKg,
}: EscalateToAdminProps) {
  return (
    <BaseEmail preheader={`ESCALATION: Manual intervention required — ERS ${ersScore}/100`}>
      {/* Emergency banner */}
      <Section style={styles.emergencyBanner}>
        <Text style={styles.emergencyLabel}>🚨 AGENTIC DISPATCHER — HUMAN INTERVENTION REQUIRED</Text>
      </Section>

      <Text style={styles.heading}>ESCALATION ALERT</Text>

      <Text style={styles.body}>
        The agentic dispatcher was unable to automatically resolve a critical food listing and requires
        your immediate attention.
      </Text>

      {/* Listing details */}
      <Section style={styles.detailBox}>
        <Text style={styles.detailLabel}>LISTING ID</Text>
        <Text style={{ ...styles.detailValue, fontFamily: "monospace" }}>{listingId}</Text>
        <Hr style={styles.inlineDivider} />
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

      {/* Reason */}
      <Section style={styles.reasonBox}>
        <Text style={styles.detailLabel}>ESCALATION REASON</Text>
        <Text style={styles.reasonText}>{reason}</Text>
      </Section>

      <Text style={styles.body}>
        Please log in to the admin dashboard immediately to manually assign a shelter or driver,
        or override the listing status.
      </Text>

      <Section style={styles.ctaSection}>
        <EmailButton href={adminUrl} style={styles.primaryButton}>
          GO TO ADMIN DASHBOARD →
        </EmailButton>
      </Section>

      <Text style={styles.footnote}>
        This food is at critical expiry risk. Without intervention, it may expire and be wasted.
        The dispatcher has exhausted all automated options.
      </Text>
    </BaseEmail>
  );
}

const styles = {
  emergencyBanner: {
    backgroundColor: "#0A0A0A",
    padding: "12px 24px",
    marginBottom: "8px",
  },
  emergencyLabel: {
    fontFamily: '"Bebas Neue", Impact, Arial Black, sans-serif',
    fontSize: "13px",
    color: "#D42B2B",
    letterSpacing: "0.05em",
    margin: 0,
    textAlign: "center" as const,
  },
  heading: {
    fontFamily: '"Bebas Neue", Impact, Arial Black, sans-serif',
    fontSize: "32px",
    color: "#D42B2B",
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
  reasonBox: {
    border: "2px solid #D42B2B",
    padding: "16px",
    backgroundColor: "#FFF0F0",
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
  reasonText: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: "14px",
    color: "#D42B2B",
    margin: "4px 0 0",
    fontWeight: "600",
    lineHeight: "1.5",
  },
  inlineDivider: {
    borderColor: "#0A0A0A",
    borderWidth: "1px",
    margin: "8px 0",
    opacity: 0.15,
  },
  ctaSection: {
    margin: "24px 0",
  },
  primaryButton: {
    fontFamily: '"Bebas Neue", Impact, Arial Black, sans-serif',
    backgroundColor: "#D42B2B",
    color: "#FFFFFF",
    fontSize: "15px",
    letterSpacing: "0.05em",
    padding: "14px 28px",
    border: "2px solid #D42B2B",
    textDecoration: "none",
    display: "inline-block",
  },
  footnote: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: "12px",
    color: "#D42B2B",
    margin: "16px 0 0",
    lineHeight: "1.5",
    fontWeight: "600",
  },
};
