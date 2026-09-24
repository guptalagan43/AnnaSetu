import { BaseEmail } from "./BaseEmail";
import { Text, Button as EmailButton, Hr } from "@react-email/components";
import * as React from "react";

export interface CoordinatorInviteProps {
  inviteeEmail: string;
  shelterName: string;
  inviterName: string;
  role: string;
  inviteLink: string;
  expiresInDays?: number;
}

export function CoordinatorInvite({
  inviteeEmail,
  shelterName,
  inviterName,
  role = "Shelter Coordinator",
  inviteLink,
  expiresInDays = 7,
}: CoordinatorInviteProps) {
  return (
    <BaseEmail preheader={`INVITATION: Join ${shelterName} as ${role} on AnnaSetu`}>
      <Text style={styles.heading}>🤝 INVITATION TO JOIN ANNASETU</Text>
      
      <Text style={styles.body}>
        Hello,
      </Text>

      <Text style={styles.body}>
        <strong>{inviterName}</strong> has invited you ({inviteeEmail}) to join 
        {" "}<strong>{shelterName}</strong> as a <strong>{role}</strong> on AnnaSetu.
      </Text>

      <div style={styles.dataBlock}>
        <Text style={styles.dataLabel}>ORGANIZATION / SHELTER</Text>
        <Text style={styles.dataValue}>{shelterName}</Text>

        <Text style={styles.dataLabel}>ASSIGNED ROLE</Text>
        <Text style={styles.dataValue}>{role}</Text>

        <Text style={styles.dataLabel}>LINK EXPIRATION</Text>
        <Text style={styles.dataValue}>Valid for {expiresInDays} days</Text>
      </div>

      <Text style={styles.body}>
        As a coordinator, you will be able to review incoming food rescue matches, 
        accept or decline donations in real time, and monitor upcoming shelter deliveries.
      </Text>

      <div style={styles.ctaContainer}>
        <EmailButton
          href={inviteLink}
          style={styles.ctaButton}
        >
          ACCEPT INVITATION & JOIN →
        </EmailButton>
      </div>

      <Hr style={styles.divider} />

      <Text style={styles.smallText}>
        If you did not expect this invitation, you can safely ignore this email.
      </Text>

      <Text style={styles.impactText}>
        AnnaSetu — Autonomous surplus food rescue and redistribution.
      </Text>
    </BaseEmail>
  );
}

const styles = {
  heading: {
    fontFamily: "monospace",
    fontSize: "20px",
    fontWeight: "900" as const,
    color: "#111111",
    letterSpacing: "-0.5px",
    margin: "0 0 16px 0",
  },
  body: {
    fontFamily: "monospace",
    fontSize: "14px",
    lineHeight: "22px",
    color: "#222222",
    margin: "0 0 16px 0",
  },
  dataBlock: {
    backgroundColor: "#F3F4F6",
    border: "2px solid #111111",
    padding: "16px",
    margin: "20px 0",
  },
  dataLabel: {
    fontFamily: "monospace",
    fontSize: "11px",
    fontWeight: "700" as const,
    color: "#6B7280",
    letterSpacing: "1px",
    margin: "8px 0 2px 0",
    textTransform: "uppercase" as const,
  },
  dataValue: {
    fontFamily: "monospace",
    fontSize: "14px",
    fontWeight: "700" as const,
    color: "#111111",
    margin: "0 0 4px 0",
  },
  ctaContainer: {
    margin: "24px 0",
    textAlign: "center" as const,
  },
  ctaButton: {
    backgroundColor: "#111111",
    color: "#FFFFFF",
    fontFamily: "monospace",
    fontSize: "13px",
    fontWeight: "800" as const,
    letterSpacing: "1px",
    padding: "14px 28px",
    border: "2px solid #111111",
    boxShadow: "4px 4px 0px 0px #FF3815",
    textDecoration: "none",
    display: "inline-block",
  },
  divider: {
    borderColor: "#E5E7EB",
    borderWidth: "1px",
    margin: "24px 0 16px 0",
  },
  smallText: {
    fontFamily: "monospace",
    fontSize: "12px",
    color: "#9CA3AF",
    margin: "0 0 8px 0",
  },
  impactText: {
    fontFamily: "monospace",
    fontSize: "12px",
    color: "#6B7280",
    lineHeight: "18px",
    margin: "0",
  },
};
