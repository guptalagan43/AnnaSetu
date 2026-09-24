import { BaseEmail } from "./BaseEmail";
import { Text, Button as EmailButton, Hr } from "@react-email/components";
import * as React from "react";

export interface DriverPickedUpProps {
  recipientName: string;
  recipientRole: "donor" | "shelter";
  listingTitle: string;
  foodCategory: string;
  quantityKg: number;
  servings: number;
  driverName: string;
  pickedUpAt: string;
  destinationName: string;
  destinationAddress: string;
  actionUrl: string;
}

export function DriverPickedUp({
  recipientName,
  recipientRole,
  listingTitle,
  foodCategory,
  quantityKg,
  servings,
  driverName,
  pickedUpAt,
  destinationName,
  destinationAddress,
  actionUrl,
}: DriverPickedUpProps) {
  const isDonor = recipientRole === "donor";
  const formattedTime = new Date(pickedUpAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <BaseEmail preheader={`FOOD IN TRANSIT: ${listingTitle} picked up by ${driverName}`}>
      <Text style={styles.heading}>
        {isDonor ? "📦 FOOD PICKED UP BY DRIVER" : "🚚 RESCUE RUN IN TRANSIT TO SHELTER"}
      </Text>

      <Text style={styles.body}>
        Hi {recipientName},
      </Text>

      <Text style={styles.body}>
        {isDonor
          ? `Volunteer driver ${driverName} has successfully collected your surplus food donation at ${formattedTime}. It is now en route to ${destinationName}.`
          : `Driver ${driverName} has collected "${listingTitle}" and is currently en route to your shelter facility.`}
      </Text>

      <div style={styles.dataBlock}>
        <Text style={styles.dataLabel}>DONATION ITEM</Text>
        <Text style={styles.dataValue}>{listingTitle} ({foodCategory})</Text>
        <Text style={styles.dataSubValue}>{`${quantityKg} kg · approx ${servings} servings`}</Text>

        <Text style={styles.dataLabel}>ASSIGNED DRIVER</Text>
        <Text style={styles.dataValue}>{driverName}</Text>

        <Text style={styles.dataLabel}>PICKUP TIMESTAMP</Text>
        <Text style={styles.dataValue}>{formattedTime}</Text>

        <Text style={styles.dataLabel}>DELIVERY DESTINATION</Text>
        <Text style={styles.dataValue}>{destinationName}</Text>
        <Text style={styles.dataSubValue}>{destinationAddress}</Text>
      </div>

      <div style={styles.ctaContainer}>
        <EmailButton href={actionUrl} style={styles.ctaButton}>
          TRACK RESCUE STATUS →
        </EmailButton>
      </div>

      <Hr style={styles.divider} />

      <Text style={styles.impactText}>
        AnnaSetu Food Rescue Network — Closing the Loop on Surplus Food
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
    margin: "0 0 2px 0",
  },
  dataSubValue: {
    fontFamily: "monospace",
    fontSize: "12px",
    color: "#4B5563",
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
