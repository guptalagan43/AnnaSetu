import { BaseEmail } from "./BaseEmail";
import { Text, Hr } from "@react-email/components";
import * as React from "react";

export interface VerificationSubmittedProps {
  adminName: string;
  businessName: string;
  businessType: string;
  contactEmail: string;
  fssaiNumber: string;
  submittedAt: string;
}

export function VerificationSubmitted({
  adminName,
  businessName,
  businessType,
  contactEmail,
  fssaiNumber,
  submittedAt,
}: VerificationSubmittedProps) {
  return (
    <BaseEmail preheader="New donor verification application requires review">
      <Text style={styles.heading}>🔔 NEW VERIFICATION REQUEST</Text>
      <Text style={styles.body}>
        Hi {adminName},
      </Text>
      <Text style={styles.body}>
        A new donor verification request has been submitted and requires your review.
      </Text>

      <div style={styles.dataBlock}>
        <Text style={styles.dataLabel}>BUSINESS NAME</Text>
        <Text style={styles.dataValue}>{businessName}</Text>
        <Text style={styles.dataLabel}>TYPE</Text>
        <Text style={styles.dataValue}>{businessType}</Text>
        <Text style={styles.dataLabel}>CONTACT EMAIL</Text>
        <Text style={styles.dataValue}>{contactEmail}</Text>
        <Text style={styles.dataLabel}>FSSAI NUMBER</Text>
        <Text style={styles.dataValue}>{fssaiNumber}</Text>
        <Text style={styles.dataLabel}>SUBMITTED</Text>
        <Text style={styles.dataValue}>{new Date(submittedAt).toLocaleString()}</Text>
      </div>

      <Text style={styles.body}>
        Please log in to the admin dashboard to review the application and supporting documents.
      </Text>

      <Hr style={styles.divider} />

      <Text style={styles.smallText}>
        This is an automated notification from AnnaSetu. Do not reply to this email.
      </Text>
    </BaseEmail>
  );
}

const styles = {
  heading: {
    fontFamily: '"Bebas Neue", Impact, Arial Black, sans-serif',
    fontSize: "28px",
    color: "#0A0A0A",
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
    backgroundColor: "#F5F0E8",
    border: "2px solid #0A0A0A",
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
  divider: {
    borderColor: "#D42B2B",
    borderWidth: "2px",
    margin: "24px 0",
  },
  smallText: {
    fontSize: "12px",
    color: "#1A1A1A",
    opacity: 0.5,
    textAlign: "center" as const,
  },
};