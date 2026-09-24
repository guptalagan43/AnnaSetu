import { Text, Section, Button as EmailButton, Hr, Row, Column } from "@react-email/components";
import * as React from "react";
import { BaseEmail } from "./BaseEmail";

export interface WeeklyDigestProps {
  recipientName: string;
  role: string;
  weekPeriod: string;
  mealsRescued: number;
  divertedKg: number;
  co2eAvoidedKg: number;
  deliveriesCount: number;
  activeDonorsCount?: number;
  activeSheltersCount?: number;
  dashboardUrl: string;
  unsubscribeUrl?: string;
}

export function WeeklyDigest({
  recipientName,
  role,
  weekPeriod,
  mealsRescued,
  divertedKg,
  co2eAvoidedKg,
  deliveriesCount,
  dashboardUrl,
  unsubscribeUrl = "https://annasetu.org/settings",
}: WeeklyDigestProps) {
  return (
    <BaseEmail preheader={`Your weekly AnnaSetu impact summary — ${mealsRescued} meals rescued this week 🌱`}>
      {/* Header Banner */}
      <Section style={styles.banner}>
        <Text style={styles.bannerLabel}>WEEKLY RESCUE DIGEST // {weekPeriod.toUpperCase()}</Text>
      </Section>

      <Text style={styles.heading}>WEEKLY IMPACT SUMMARY</Text>

      <Text style={styles.body}>
        Hi <strong>{recipientName}</strong>,
      </Text>
      <Text style={styles.body}>
        Here is your weekly food rescue and environmental abatement report across the AnnaSetu network.
        Every kilogram diverted from landfills directly nourishes our communities and cuts methane emissions.
      </Text>

      {/* 2x2 Impact Grid */}
      <Section style={styles.metricGrid}>
        <Row>
          <Column style={styles.metricCard}>
            <Text style={styles.metricNumber}>{mealsRescued.toLocaleString()}</Text>
            <Text style={styles.metricLabel}>MEALS RESCUED</Text>
          </Column>
          <Column style={styles.metricCard}>
            <Text style={styles.metricNumber}>{divertedKg.toLocaleString()} kg</Text>
            <Text style={styles.metricLabel}>FOOD DIVERTED</Text>
          </Column>
        </Row>
        <Row style={{ marginTop: "12px" }}>
          <Column style={styles.metricCard}>
            <Text style={styles.metricNumber}>{co2eAvoidedKg.toLocaleString()} kg</Text>
            <Text style={styles.metricLabel}>CO₂e EMISSIONS AVOIDED</Text>
          </Column>
          <Column style={styles.metricCard}>
            <Text style={styles.metricNumber}>{deliveriesCount}</Text>
            <Text style={styles.metricLabel}>VERIFIED RESCUES</Text>
          </Column>
        </Row>
      </Section>

      {/* Call to action */}
      <Section style={styles.actionSection}>
        <EmailButton href={dashboardUrl} style={styles.button}>
          VIEW LIVE DASHBOARD & TAX LOGS →
        </EmailButton>
      </Section>

      <Hr style={styles.divider} />

      <Text style={styles.disclaimer}>
        Methodology: 1 kg rescued = 2.5 meals equivalent. GHG abatement calculated using US EPA WARM factor (2.5 kg CO₂e per kg food waste avoided).
      </Text>

      <Section style={styles.unsubSection}>
        <Text style={styles.unsubText}>
          You are receiving this automated weekly summary as a verified {role.replace(/_/g, " ")}.{" "}
          <a href={unsubscribeUrl} style={styles.unsubLink}>
            Manage email preferences or unsubscribe
          </a>
        </Text>
      </Section>
    </BaseEmail>
  );
}

const styles = {
  banner: {
    backgroundColor: "#0A0A0A",
    padding: "8px 16px",
    marginBottom: "20px",
  },
  bannerLabel: {
    fontFamily: '"Space Mono", monospace',
    fontSize: "11px",
    fontWeight: "bold",
    color: "#E5A93C",
    letterSpacing: "0.08em",
    margin: 0,
    textTransform: "uppercase" as const,
  },
  heading: {
    fontFamily: '"Bebas Neue", Impact, Arial Black, sans-serif',
    fontSize: "32px",
    lineHeight: "1.1",
    letterSpacing: "-0.01em",
    color: "#0A0A0A",
    margin: "0 0 16px 0",
  },
  body: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#1A1A1A",
    margin: "0 0 12px 0",
  },
  metricGrid: {
    margin: "24px 0",
  },
  metricCard: {
    backgroundColor: "#F5F0E8",
    border: "2px solid #0A0A0A",
    padding: "16px",
    textAlign: "center" as const,
    boxShadow: "3px 3px 0px 0px #0A0A0A",
    width: "48%",
  },
  metricNumber: {
    fontFamily: '"Bebas Neue", Impact, sans-serif',
    fontSize: "36px",
    lineHeight: "1",
    color: "#D42B2B",
    margin: "0 0 4px 0",
  },
  metricLabel: {
    fontFamily: '"Space Mono", monospace',
    fontSize: "10px",
    fontWeight: "bold",
    color: "#0A0A0A",
    opacity: 0.7,
    letterSpacing: "0.05em",
    margin: 0,
  },
  actionSection: {
    textAlign: "center" as const,
    margin: "28px 0 20px 0",
  },
  button: {
    backgroundColor: "#D42B2B",
    color: "#FFFFFF",
    fontFamily: '"Space Mono", monospace',
    fontSize: "13px",
    fontWeight: "bold",
    letterSpacing: "0.05em",
    padding: "14px 28px",
    border: "2px solid #0A0A0A",
    borderRadius: 0,
    textDecoration: "none",
    boxShadow: "4px 4px 0px 0px #0A0A0A",
    display: "inline-block",
  },
  divider: {
    borderColor: "#E0D8C8",
    borderWidth: "1px",
    margin: "24px 0 16px 0",
  },
  disclaimer: {
    fontSize: "11px",
    color: "#737373",
    lineHeight: "1.4",
    margin: "0 0 12px 0",
  },
  unsubSection: {
    textAlign: "center" as const,
    marginTop: "16px",
  },
  unsubText: {
    fontSize: "11px",
    color: "#737373",
    margin: 0,
  },
  unsubLink: {
    color: "#D42B2B",
    textDecoration: "underline",
  },
};
