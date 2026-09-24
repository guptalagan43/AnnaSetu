import { BaseEmail } from "./BaseEmail";
import { Text, Button as EmailButton, Hr } from "@react-email/components";
import * as React from "react";

export interface ERSAlertProps {
  donorName: string;
  listingTitle: string;
  ersScore: number;
  foodCategory: string;
  quantityKg: number;
  servings: number;
  expiryTime: string;
  actionUrl: string;
  recipientType?: "donor" | "admin";
}

export function ERSAlert({
  donorName,
  listingTitle,
  ersScore,
  foodCategory,
  quantityKg,
  servings,
  expiryTime,
  actionUrl,
  recipientType = "donor",
}: ERSAlertProps) {
  const isEmergency = ersScore >= 96;

  return (
    <BaseEmail preheader={`CRITICAL URGENCY: ERS score ${ersScore}/100 for ${listingTitle}`}>
      <Text style={styles.heading}>
        {isEmergency ? "⚫ EMERGENCY EXPIRY ALERT" : "🔴 URGENT EXPIRY RISK ALERT"}
      </Text>
      
      <Text style={styles.body}>
        Hi {donorName},
      </Text>

      <Text style={styles.body}>
        {recipientType === "admin"
          ? `Listing "${listingTitle}" has crossed critical urgency with an Expiry Risk Score of ${ersScore}/100. Autonomous matching is elevating dispatch priority.`
          : `Your food donation "${listingTitle}" has reached an Expiry Risk Score of ${ersScore}/100. Our system is actively searching for shelters and volunteer drivers within an expanded radius.`}
      </Text>

      <div style={isEmergency ? styles.dataBlockEmergency : styles.dataBlockCritical}>
        <div style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>EXPIRY RISK SCORE</Text>
          <Text style={styles.scoreValue}>{ersScore} / 100</Text>
        </div>
        
        <Text style={styles.dataLabel}>FOOD ITEM</Text>
        <Text style={styles.dataValue}>{listingTitle} ({foodCategory})</Text>

        <Text style={styles.dataLabel}>QUANTITY</Text>
        <Text style={styles.dataValue}>{quantityKg} kg · approx {servings} servings</Text>

        <Text style={styles.dataLabel}>EXPIRY TIME</Text>
        <Text style={styles.dataValue}>
          {new Date(expiryTime).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "numeric",
            month: "short",
          })}
        </Text>
      </div>

      <div style={styles.ctaContainer}>
        <EmailButton href={actionUrl} style={styles.ctaButton}>
          VIEW ACTIVE LISTING →
        </EmailButton>
      </div>

      <Hr style={styles.divider} />

      <Text style={styles.subHeading}>SYSTEM ACTIONS UNDERWAY</Text>
      <Text style={styles.bullet}>• Search radius automatically expanded to 10–15 km</Text>
      <Text style={styles.bullet}>• Matched shelters notified with urgent priority tags</Text>
      <Text style={styles.bullet}>• Agentic dispatcher standby if no human pickup responds within timeout</Text>

      <Hr style={styles.divider} />

      <Text style={styles.smallText}>
        AnnaSetu Automated Urgency Dispatch Engine. Real-time food rescue routing.
      </Text>
    </BaseEmail>
  );
}

const styles = {
  heading: {
    fontFamily: '"Bebas Neue", Impact, Arial Black, sans-serif',
    fontSize: "30px",
    color: "#C4201F",
    marginBottom: "16px",
    letterSpacing: "-0.01em",
  },
  body: {
    fontSize: "16px",
    color: "#1A1A1A",
    lineHeight: 1.6,
    marginBottom: "16px",
  },
  dataBlockCritical: {
    backgroundColor: "#FDE8E8",
    border: "3px solid #C4201F",
    padding: "20px",
    margin: "24px 0",
  },
  dataBlockEmergency: {
    backgroundColor: "#1A0A0A",
    border: "3px solid #D42B2B",
    padding: "20px",
    margin: "24px 0",
    color: "#F5F0E8",
  },
  scoreRow: {
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "2px solid #C4201F",
  },
  scoreLabel: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "#C4201F",
    marginBottom: "4px",
    display: "block" as const,
  },
  scoreValue: {
    fontFamily: '"Bebas Neue", Impact, Arial Black, sans-serif',
    fontSize: "36px",
    color: "#C4201F",
    margin: 0,
    display: "block" as const,
  },
  dataLabel: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "#1A1A1A",
    opacity: 0.6,
    marginBottom: "4px",
    display: "block" as const,
  },
  dataValue: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: "15px",
    fontWeight: 600,
    color: "#1A1A1A",
    marginBottom: "14px",
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
    borderColor: "#0A0A0A",
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
    lineHeight: 1.8,
    marginLeft: "8px",
  },
  smallText: {
    fontSize: "12px",
    color: "#1A1A1A",
    opacity: 0.6,
    textAlign: "center" as const,
    marginBottom: "8px",
  },
};
