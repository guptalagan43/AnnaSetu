import { Text, Section, Hr } from "@react-email/components";
import * as React from "react";
import { BaseEmail } from "./BaseEmail";

export interface AgentOverrideAlertProps {
  actionType: string;
  listingTitle: string;
  listingId: string;
  reason: string;
  adminName: string;
  overriddenAt: string;
  recipientRole: "donor" | "shelter" | "driver" | "admin";
  reversalSummary: string;
}

export function AgentOverrideAlert({
  actionType,
  listingTitle,
  listingId,
  reason,
  adminName,
  overriddenAt,
  recipientRole,
  reversalSummary,
}: AgentOverrideAlertProps) {
  return (
    <BaseEmail preheader={`ADMIN OVERRIDE NOTICE: Autonomous decision ${actionType} reversed`}>
      <Section style={styles.banner}>
        <Text style={styles.bannerLabel}>⚠️ DISPATCHER ACTION OVERRIDDEN BY ADMIN</Text>
      </Section>

      <Text style={styles.heading}>ACTION REVERSED</Text>

      <Text style={styles.body}>
        An administrator has manually intervened and reversed an autonomous decision made by the AnnaSetu Agentic Dispatcher.
      </Text>

      <Section style={styles.detailBox}>
        <Text style={styles.detailLabel}>ORIGINAL ACTION TYPE</Text>
        <Text style={styles.detailValue}>{actionType}</Text>
        <Hr style={styles.inlineDivider} />

        <Text style={styles.detailLabel}>LISTING / DONATION</Text>
        <Text style={styles.detailValue}>{listingTitle} ({listingId})</Text>
        <Hr style={styles.inlineDivider} />

        <Text style={styles.detailLabel}>OVERRIDE REASON</Text>
        <Text style={styles.reasonText}>{reason}</Text>
        <Hr style={styles.inlineDivider} />

        <Text style={styles.detailLabel}>REVERSAL IMPACT</Text>
        <Text style={styles.detailValue}>{reversalSummary}</Text>
        <Hr style={styles.inlineDivider} />

        <Text style={styles.detailLabel}>ACTIONED BY</Text>
        <Text style={styles.detailValue}>{adminName} • {overriddenAt}</Text>
      </Section>

      <Text style={styles.footnote}>
        {recipientRole === "shelter"
          ? "Your reserved intake capacity has been adjusted accordingly. No pickup is expected for this allocation."
          : recipientRole === "driver"
          ? "Your delivery dispatch assignment for this listing has been cancelled. Please check your dashboard for active routes."
          : "The listing status has been restored to the available matching pool for optimal re-allocation."}
      </Text>
    </BaseEmail>
  );
}

const styles = {
  banner: {
    backgroundColor: "#F59E0B",
    border: "2px solid #0A0A0A",
    padding: "8px 12px",
    margin: "16px 0",
  },
  bannerLabel: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: "12px",
    fontWeight: "bold" as const,
    color: "#0A0A0A",
    margin: "0",
    letterSpacing: "0.05em",
  },
  heading: {
    fontFamily: '"Bebas Neue", Impact, Arial Black, sans-serif',
    fontSize: "32px",
    lineHeight: "1.1",
    color: "#0A0A0A",
    margin: "16px 0 8px",
    letterSpacing: "0.03em",
  },
  body: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: "15px",
    lineHeight: "1.6",
    color: "#0A0A0A",
    margin: "0 0 16px",
  },
  detailBox: {
    border: "2px solid #0A0A0A",
    backgroundColor: "#F5F0E8",
    padding: "16px",
    margin: "16px 0",
  },
  detailLabel: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: "11px",
    color: "#555555",
    letterSpacing: "0.05em",
    margin: "0 0 2px",
    fontWeight: "600",
  },
  detailValue: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: "14px",
    color: "#0A0A0A",
    margin: "0",
    fontWeight: "bold" as const,
  },
  reasonText: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: "14px",
    color: "#D42B2B",
    margin: "0",
    fontWeight: "bold" as const,
  },
  inlineDivider: {
    borderColor: "#0A0A0A",
    borderWidth: "1px",
    margin: "10px 0",
    opacity: 0.15,
  },
  footnote: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: "13px",
    lineHeight: "1.5",
    color: "#666666",
    margin: "16px 0 0",
  },
};
