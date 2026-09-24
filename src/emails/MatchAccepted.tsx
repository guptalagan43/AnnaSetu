import { BaseEmail } from "./BaseEmail";
import { Text, Button as EmailButton, Hr } from "@react-email/components";
import * as React from "react";

export interface MatchAcceptedProps {
  donorName: string;
  listingTitle: string;
  shelterName: string;
  shelterAddress: string;
  quantityKg: number;
  servings: number;
  pickupAddress: string;
  pickupWindowStart?: string;
  pickupWindowEnd?: string;
  viewListingUrl: string;
}

export function MatchAccepted({
  donorName,
  listingTitle,
  shelterName,
  shelterAddress,
  quantityKg,
  servings,
  pickupAddress,
  pickupWindowStart,
  pickupWindowEnd,
  viewListingUrl,
}: MatchAcceptedProps) {
  const windowTime = pickupWindowStart && pickupWindowEnd
    ? `${new Date(pickupWindowStart).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} – ${new Date(pickupWindowEnd).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
    : "Immediate Pickup";

  return (
    <BaseEmail preheader={`MATCH ACCEPTED: ${shelterName} accepted your donation of ${listingTitle}`}>
      <Text style={styles.heading}>🎉 DONATION MATCH ACCEPTED</Text>
      
      <Text style={styles.body}>
        Hi {donorName},
      </Text>

      <Text style={styles.body}>
        Great news! <strong>{shelterName}</strong> has accepted your surplus food donation:
        {" "}<strong>{listingTitle}</strong>.
      </Text>

      <div style={styles.dataBlock}>
        <Text style={styles.dataLabel}>RECIPIENT SHELTER</Text>
        <Text style={styles.dataValue}>{shelterName}</Text>
        <Text style={styles.dataSubValue}>{shelterAddress}</Text>

        <Text style={styles.dataLabel}>FOOD DETAILS</Text>
        <Text style={styles.dataValue}>{listingTitle}</Text>
        <Text style={styles.dataSubValue}>{`${quantityKg} kg · approx ${servings} servings`}</Text>

        <Text style={styles.dataLabel}>PICKUP LOCATION</Text>
        <Text style={styles.dataValue}>{pickupAddress}</Text>

        <Text style={styles.dataLabel}>PICKUP WINDOW</Text>
        <Text style={styles.dataValue}>{windowTime}</Text>
      </div>

      <div style={styles.nextStepsCard}>
        <Text style={styles.nextStepsTitle}>WHAT TO PREPARE NOW</Text>
        <Text style={styles.bullet}>• Please keep the food packed and stored at safe temperature.</Text>
        <Text style={styles.bullet}>• A volunteer driver is being assigned for pickup shortly.</Text>
        <Text style={styles.bullet}>• Have your 4-digit Donor PIN ready when the driver arrives.</Text>
      </div>

      <div style={styles.ctaContainer}>
        <EmailButton
          href={viewListingUrl}
          style={styles.ctaButton}
        >
          VIEW DONATION STATUS →
        </EmailButton>
      </div>

      <Hr style={styles.divider} />

      <Text style={styles.impactText}>
        Thank you for preventing food waste and feeding those in need.
        <br />
        — AnnaSetu Dispatch Team
      </Text>
    </BaseEmail>
  );
}

const styles = {
  heading: {
    fontFamily: "monospace",
    fontSize: "22px",
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
  dataSubValue: {
    fontFamily: "monospace",
    fontSize: "12px",
    color: "#4B5563",
    margin: "0 0 6px 0",
  },
  nextStepsCard: {
    backgroundColor: "#EFF6FF",
    border: "2px solid #2563EB",
    padding: "14px 16px",
    margin: "16px 0",
  },
  nextStepsTitle: {
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
