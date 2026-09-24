import { BaseEmail } from "./BaseEmail";
import { Text, Button as EmailButton, Hr } from "@react-email/components";
import * as React from "react";

export interface WelcomeDonorProps {
  donorName: string;
  businessName: string;
  dashboardUrl: string;
}

/**
 * Post-approval onboarding email sent to a newly verified donor.
 * Explains next steps: listing food, how matching works, and what to expect.
 */
export function WelcomeDonor({ donorName, businessName, dashboardUrl }: WelcomeDonorProps) {
  return (
    <BaseEmail preheader="You're verified — start rescuing food today">
      <Text style={styles.tagline}>YOU'RE IN. LET'S RESCUE FOOD.</Text>
      <Text style={styles.heading}>WELCOME, {donorName.toUpperCase()}</Text>

      <Text style={styles.body}>
        <strong>{businessName}</strong> is now a verified AnnaSetu food donor. Every listing you
        post helps us route surplus food to the shelters and communities that need it most — before
        it goes to waste.
      </Text>

      <div style={styles.ctaContainer}>
        <EmailButton href={dashboardUrl} style={styles.ctaButton}>
          GO TO YOUR DASHBOARD →
        </EmailButton>
      </div>

      <Hr style={styles.divider} />

      <Text style={styles.subHeading}>HOW IT WORKS IN 3 STEPS</Text>

      <div style={styles.stepBlock}>
        <Text style={styles.stepNumber}>01</Text>
        <Text style={styles.stepTitle}>POST A LISTING</Text>
        <Text style={styles.stepDesc}>
          Upload a photo — our AI fills in the details automatically. Takes under 60 seconds. Add
          your pickup window and we handle the rest.
        </Text>
      </div>

      <div style={styles.stepBlock}>
        <Text style={styles.stepNumber}>02</Text>
        <Text style={styles.stepTitle}>WE FIND A MATCH</Text>
        <Text style={styles.stepDesc}>
          Our matching engine pairs your donation with the nearest shelter based on capacity,
          dietary requirements, and distance. A driver is dispatched automatically.
        </Text>
      </div>

      <div style={styles.stepBlock}>
        <Text style={styles.stepNumber}>03</Text>
        <Text style={styles.stepTitle}>TRACK TO DELIVERY</Text>
        <Text style={styles.stepDesc}>
          You'll receive email updates at every stage. After delivery, you get an impact summary
          — meals saved, CO₂ avoided — and a monthly tax certificate.
        </Text>
      </div>

      <Hr style={styles.divider} />

      <Text style={styles.impactText}>
        Together, we're building a city where no surplus meal goes to waste.
      </Text>
      <Text style={styles.signoff}>— The AnnaSetu Team</Text>
    </BaseEmail>
  );
}

const styles = {
  tagline: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    color: "#D42B2B",
    marginBottom: "8px",
  },
  heading: {
    fontFamily: '"Bebas Neue", Impact, Arial Black, sans-serif',
    fontSize: "36px",
    color: "#0A0A0A",
    letterSpacing: "-0.015em",
    marginBottom: "16px",
    lineHeight: 1.1,
  },
  body: {
    fontSize: "16px",
    color: "#1A1A1A",
    lineHeight: 1.6,
    marginBottom: "24px",
  },
  ctaContainer: {
    textAlign: "center" as const,
    margin: "24px 0 32px",
  },
  ctaButton: {
    backgroundColor: "#D42B2B",
    color: "#F5F0E8",
    border: "2px solid #0A0A0A",
    padding: "14px 32px",
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontWeight: 700,
    textTransform: "uppercase" as const,
    fontSize: "14px",
    letterSpacing: "0.08em",
    textDecoration: "none",
    display: "inline-block",
    boxShadow: "3px 3px 0px 0px #0A0A0A",
  },
  divider: {
    borderColor: "#D42B2B",
    borderWidth: "2px",
    margin: "28px 0",
  },
  subHeading: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: "14px",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "#0A0A0A",
    marginBottom: "20px",
  },
  stepBlock: {
    borderLeft: "4px solid #D42B2B",
    paddingLeft: "16px",
    marginBottom: "24px",
  },
  stepNumber: {
    fontFamily: '"Bebas Neue", Impact, Arial Black, sans-serif',
    fontSize: "42px",
    color: "#EDE8DC",
    lineHeight: 1,
    margin: "0 0 4px",
  },
  stepTitle: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: "13px",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "#0A0A0A",
    margin: "0 0 6px",
  },
  stepDesc: {
    fontSize: "15px",
    color: "#1A1A1A",
    lineHeight: 1.6,
    margin: 0,
  },
  impactText: {
    fontSize: "16px",
    color: "#0A0A0A",
    textAlign: "center" as const,
    fontStyle: "italic",
    marginBottom: "8px",
  },
  signoff: {
    fontSize: "14px",
    color: "#0A0A0A",
    textAlign: "center" as const,
    fontWeight: 700,
  },
};
