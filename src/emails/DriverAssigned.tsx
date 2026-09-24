import { BaseEmail } from "./BaseEmail";
import { Text, Button as EmailButton, Hr } from "@react-email/components";
import * as React from "react";

export interface DriverAssignedProps {
  recipientName: string;
  recipientRole: "driver" | "shelter";
  listingTitle: string;
  foodCategory: string;
  quantityKg: number;
  servings: number;
  ersScore: number;
  pickupAddress: string;
  dropoffAddress: string;
  shelterName: string;
  donorName: string;
  actionUrl: string;
}

export function DriverAssigned({
  recipientName,
  recipientRole,
  listingTitle,
  foodCategory,
  quantityKg,
  servings,
  ersScore,
  pickupAddress,
  dropoffAddress,
  shelterName,
  donorName,
  actionUrl,
}: DriverAssignedProps) {
  const isDriver = recipientRole === "driver";

  return (
    <BaseEmail preheader={`RESCUE ASSIGNMENT: ${listingTitle} allocated for pickup`}>
      <Text style={styles.heading}>
        {isDriver ? "🚗 NEW RESCUE RUN ASSIGNED" : "🚚 DRIVER DISPATCHED FOR PICKUP"}
      </Text>

      <Text style={styles.body}>
        Hi {recipientName},
      </Text>

      <Text style={styles.body}>
        {isDriver
          ? `You have been assigned to pick up surplus food from "${donorName}" and deliver it to "${shelterName}".`
          : `A volunteer driver has been assigned and dispatched to pick up "${listingTitle}" from "${donorName}".`}
      </Text>

      <div style={styles.dataBlock}>
        <div style={styles.ersRow}>
          <Text style={styles.scoreLabel}>EXPIRY RISK SCORE</Text>
          <Text style={styles.scoreValue}>{`${ersScore} / 100`}</Text>
        </div>

        <Text style={styles.dataLabel}>FOOD DONATION</Text>
        <Text style={styles.dataValue}>{listingTitle} ({foodCategory})</Text>
        <Text style={styles.dataSubValue}>{`${quantityKg} kg · approx ${servings} servings`}</Text>

        <Text style={styles.dataLabel}>1. PICKUP LOCATION (DONOR)</Text>
        <Text style={styles.dataValue}>{donorName}</Text>
        <Text style={styles.dataSubValue}>{pickupAddress}</Text>

        <Text style={styles.dataLabel}>2. DELIVERY DESTINATION (SHELTER)</Text>
        <Text style={styles.dataValue}>{shelterName}</Text>
        <Text style={styles.dataSubValue}>{dropoffAddress}</Text>
      </div>

      {isDriver && (
        <div style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>DRIVER INSTRUCTIONS</Text>
          <Text style={styles.bullet}>• Proceed to the pickup location and verify package condition.</Text>
          <Text style={styles.bullet}>• Request the 4-digit Donor PIN from the donor on collection.</Text>
          <Text style={styles.bullet}>• Tap "Mark Picked Up" in your driver dashboard when departing.</Text>
        </div>
      )}

      <div style={styles.ctaContainer}>
        <EmailButton href={actionUrl} style={styles.ctaButton}>
          {isDriver ? "OPEN DRIVER ROUTE DASHBOARD →" : "VIEW RESCUE STATUS →"}
        </EmailButton>
      </div>

      <Hr style={styles.divider} />

      <Text style={styles.impactText}>
        AnnaSetu Food Rescue Network — Real-Time Autonomous Logistics
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
  ersRow: {
    borderBottom: "1px solid #D1D5DB",
    paddingBottom: "8px",
    marginBottom: "10px",
  },
  scoreLabel: {
    fontFamily: "monospace",
    fontSize: "11px",
    fontWeight: "700" as const,
    color: "#6B7280",
    letterSpacing: "1px",
    margin: "0 0 2px 0",
  },
  scoreValue: {
    fontFamily: "monospace",
    fontSize: "18px",
    fontWeight: "900" as const,
    color: "#FF3815",
    margin: "0",
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
    margin: "0 0 2px 0",
  },
  dataSubValue: {
    fontFamily: "monospace",
    fontSize: "12px",
    color: "#4B5563",
    margin: "0 0 6px 0",
  },
  noticeBox: {
    backgroundColor: "#EFF6FF",
    border: "2px solid #2563EB",
    padding: "14px 16px",
    margin: "16px 0",
  },
  noticeTitle: {
    fontFamily: "monospace",
    fontSize: "12px",
    fontWeight: "900" as const,
    color: "#1E40AF",
    letterSpacing: "0.5px",
    margin: "0 0 8px 0",
  },
  bullet: {
    fontFamily: "monospace",
    fontSize: "13px",
    lineHeight: "20px",
    color: "#1E3A8A",
    margin: "0 0 6px 0",
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
  impactText: {
    fontFamily: "monospace",
    fontSize: "12px",
    color: "#6B7280",
    lineHeight: "18px",
    margin: "0",
  },
};
