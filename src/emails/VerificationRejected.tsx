import { BaseEmail } from "./BaseEmail";
import { Text, Hr } from "@react-email/components";
import * as React from "react";

export interface VerificationRejectedProps {
  donorName: string;
  businessName: string;
  rejectionReason: string;
  reviewedAt: string;
  supportEmail?: string;
}

export function VerificationRejected({
  donorName,
  businessName,
  rejectionReason,
  reviewedAt,
  supportEmail = "support@annasetu.in",
}: VerificationRejectedProps) {
  return (
    <BaseEmail preheader="Update on your AnnaSetu donor verification application">
      <Text style={styles.heading}>APPLICATION NOT APPROVED</Text>
      <Text style={styles.body}>Hi {donorName},</Text>
      <Text style={styles.body}>
        Thank you for applying to join AnnaSetu as a verified food donor. After reviewing your
        application for <strong>{businessName}</strong>, we are unable to approve it at this time.
      </Text>

      <div style={styles.reasonBlock}>
        <Text style={styles.reasonLabel}>REASON FOR REJECTION</Text>
        <Text style={styles.reasonText}>{rejectionReason}</Text>
        <Text style={styles.reviewedAt}>Reviewed on {new Date(reviewedAt).toLocaleDateString()}</Text>
      </div>

      <Text style={styles.body}>
        You may address the issues above and re-apply. Please ensure all documents are valid and
        up-to-date before submitting a new application.
      </Text>

      <Hr style={styles.divider} />

      <Text style={styles.subHeading}>WHAT YOU CAN DO</Text>
      <Text style={styles.bullet}>✦ Review the reason above carefully</Text>
      <Text style={styles.bullet}>✦ Renew or correct any expired / invalid documents</Text>
      <Text style={styles.bullet}>✦ Contact us if you believe this is an error</Text>
      <Text style={styles.bullet}>✦ Re-apply once the issues have been resolved</Text>

      <Hr style={styles.divider} />

      <Text style={styles.smallText}>
        Questions? Reply to this email or contact{" "}
        <a href={`mailto:${supportEmail}`} style={styles.link}>
          {supportEmail}
        </a>
      </Text>
    </BaseEmail>
  );
}

const styles = {
  heading: {
    fontFamily: '"Bebas Neue", Impact, Arial Black, sans-serif',
    fontSize: "28px",
    color: "#D42B2B",
    marginBottom: "16px",
    letterSpacing: "-0.01em",
  },
  body: {
    fontSize: "16px",
    color: "#1A1A1A",
    lineHeight: 1.6,
    marginBottom: "16px",
  },
  reasonBlock: {
    backgroundColor: "#FFF0F0",
    border: "2px solid #D42B2B",
    padding: "20px",
    margin: "24px 0",
  },
  reasonLabel: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "#D42B2B",
    marginBottom: "8px",
    display: "block" as const,
  },
  reasonText: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: "15px",
    color: "#1A1A1A",
    lineHeight: 1.6,
    marginBottom: "12px",
  },
  reviewedAt: {
    fontSize: "12px",
    color: "#1A1A1A",
    opacity: 0.5,
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
    textTransform: "uppercase" as const,
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
  },
  link: {
    color: "#D42B2B",
    textDecoration: "underline",
  },
};
