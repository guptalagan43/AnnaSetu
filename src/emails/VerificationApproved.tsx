import { BaseEmail } from "./BaseEmail";
import { Text, Button as EmailButton, Hr } from "@react-email/components";
import * as React from "react";

export interface VerificationApprovedProps {
  donorName: string;
  businessName: string;
  businessType: string;
  fssaiNumber: string;
  reviewedAt: string;
  reviewedBy: string;
  loginUrl: string;
}

export function VerificationApproved({
  donorName,
  businessName,
  businessType,
  fssaiNumber,
  reviewedAt,
  reviewedBy,
  loginUrl,
}: VerificationApprovedProps) {
  return (
    <BaseEmail preheader="Your AnnaSetu donor account has been approved">
      <Text style={styles.heading}>✅ WELCOME TO ANNASETU</Text>
      <Text style={styles.body}>
        Hi {donorName},
      </Text>
      <Text style={styles.body}>
        Your business, <strong>{businessName}</strong>, has been verified and your account is now active.
        You can start listing surplus food immediately.
      </Text>

      <div style={styles.dataBlock}>
        <Text style={styles.dataLabel}>BUSINESS</Text>
        <Text style={styles.dataValue}>{businessName}</Text>
        <Text style={styles.dataLabel}>TYPE</Text>
        <Text style={styles.dataValue}>{businessType}</Text>
        <Text style={styles.dataLabel}>FSSAI LICENSE</Text>
        <Text style={styles.dataValue}>{fssaiNumber} ✅ Valid</Text>
        <Text style={styles.dataLabel}>VERIFIED BY</Text>
        <Text style={styles.dataValue}>{reviewedBy}, {new Date(reviewedAt).toLocaleDateString()}</Text>
      </div>

      <div style={styles.ctaContainer}>
        <EmailButton
          href={loginUrl}
          style={styles.ctaButton}
        >
          START LISTING FOOD →
        </EmailButton>
      </div>

      <Hr style={styles.divider} />

      <Text style={styles.subHeading}>WHAT HAPPENS NEXT</Text>
      <Text style={styles.bullet}>• Post a donation in under 60 seconds using a photo</Text>
      <Text style={styles.bullet}>• Our system matches you with a nearby shelter instantly</Text>
      <Text style={styles.bullet}>• A driver picks up your food and we track it to delivery</Text>
      <Text style={styles.bullet}>• You receive an impact summary and tax certificate monthly</Text>

      <Hr style={styles.divider} />

      <Text style={styles.smallText}>
        If you have questions, reply to this email.
      </Text>
      <Text style={styles.impactText}>
        You've joined businesses saving food and feeding communities.
        — The AnnaSetu Team
      </Text>
    </BaseEmail>
  );
}

const styles = {
  heading: {
    fontFamily: '"Bebas Neue", Impact, Arial Black, sans-serif',
    fontSize: "28px",
    color: "#2D8A3E",
    marginBottom: "16px",
    letterSpacing: "-0.01em",
  },
  body: {
    fontSize: "16px",
    color: "#1A1A1A",
    lineHeight: 1.6,
    marginBottom: "16px",
  },
  dataBlock: {
    backgroundColor: "#E8F5EA",
    border: "2px solid #2D8A3E",
    padding: "20px",
    margin: "24px 0",
  },
  dataLabel: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "#1A1A1A",
    opacity: 0.5,
    marginBottom: "4px",
    display: "block" as const,
  },
  dataValue: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: "15px",
    color: "#1A1A1A",
    marginBottom: "16px",
    display: "block" as const,
  },
  ctaContainer: {
    textAlign: "center" as const,
    margin: "32px 0",
  },
  ctaButton: {
    backgroundColor: "#D42B2B",
    color: "#F5F0E8",
    border: "2px solid #0A0A0A",
    padding: "14px 28px",
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontWeight: 700,
    textTransform: "uppercase",
    fontSize: "14px",
    letterSpacing: "0.08em",
    textDecoration: "none",
    display: "inline-block",
    boxShadow: "3px 3px 0px 0px #0A0A0A",
  },
  divider: {
    borderColor: "#D42B2B",
    borderWidth: "2px",
    margin: "24px 0",
  },
  subHeading: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: "14px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#0A0A0A",
    marginBottom: "12px",
  },
  bullet: {
    fontSize: "15px",
    color: "#1A1A1A",
    lineHeight: 2,
    marginLeft: "8px",
  },
  smallText: {
    fontSize: "12px",
    color: "#1A1A1A",
    opacity: 0.5,
    textAlign: "center" as const,
    marginBottom: "8px",
  },
  impactText: {
    fontSize: "14px",
    color: "#0A0A0A",
    textAlign: "center" as const,
    fontStyle: "italic",
  },
};