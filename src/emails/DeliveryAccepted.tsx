import * as React from "react";
import {
  Section,
  Row,
  Column,
  Text,
  Button,
} from "@react-email/components";
import { BaseEmail } from "./BaseEmail";

export interface DeliveryAcceptedProps {
  donorName: string;
  listingTitle: string;
  quantityKg: number;
  servings: number;
  co2eAvoidedKg: number;
  shelterName: string;
  shelterAddress: string;
  deliveryDate: string;
  pinVerified: boolean;
  actionUrl: string;
}

export function DeliveryAccepted({
  donorName = "Valued Donor",
  listingTitle = "45 Fresh Meals",
  quantityKg = 22.5,
  servings = 45,
  co2eAvoidedKg = 56.25,
  shelterName = "Asha Kiran Community Shelter",
  shelterAddress = "8th Main Road, Sampangiram Nagar, Bengaluru",
  deliveryDate = new Date().toLocaleDateString("en-IN"),
  pinVerified = true,
  actionUrl = "https://annasetu.in/donor",
}: DeliveryAcceptedProps) {
  return (
    <BaseEmail preheader={`🎉 Delivery Confirmed: ${listingTitle} (${quantityKg} kg) accepted at ${shelterName}!`}>
      <Section style={{ borderBottom: "3px solid #000000", paddingBottom: "12px", marginBottom: "16px" }}>
        <Text style={{ fontSize: "22px", fontWeight: "900", textTransform: "uppercase", margin: "0 0 6px", color: "#000000", letterSpacing: "1px" }}>
          FOOD RESCUE COMPLETE
        </Text>
        <Text style={{ display: "inline-block", backgroundColor: "#16a34a", color: "#ffffff", padding: "4px 8px", fontSize: "11px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1px" }}>
          DELIVERY VERIFIED ✅
        </Text>
      </Section>

      <Section style={{ padding: "0 0 16px" }}>
        <Text style={{ fontSize: "16px", lineHeight: "24px", margin: "0 0 16px", color: "#000000" }}>
          Dear <strong>{donorName}</strong>,
        </Text>
        <Text style={{ fontSize: "15px", lineHeight: "22px", margin: "0 0 20px", color: "#1f2937" }}>
          Great news! Your surplus food donation has been delivered, inspected, and fully accepted by{" "}
          <strong>{shelterName}</strong>. The 5-point quality checklist was passed and your Donor PIN was successfully confirmed.
        </Text>
      </Section>

      {/* Impact Stats Banner */}
      <Section
        style={{
          border: "3px solid #000000",
          backgroundColor: "#f0fdf4",
          padding: "16px",
          marginBottom: "24px",
        }}
      >
        <Row>
          <Column style={{ width: "33%", textAlign: "center" }}>
            <Text style={{ fontSize: "24px", fontWeight: "900", margin: "0", color: "#16a34a" }}>
              {`${quantityKg} kg`}
            </Text>
            <Text style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", margin: "4px 0 0", color: "#4b5563" }}>
              FOOD RESCUED
            </Text>
          </Column>
          <Column style={{ width: "33%", textAlign: "center", borderLeft: "2px solid #000000", borderRight: "2px solid #000000" }}>
            <Text style={{ fontSize: "24px", fontWeight: "900", margin: "0", color: "#000000" }}>
              {`${servings}`}
            </Text>
            <Text style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", margin: "4px 0 0", color: "#4b5563" }}>
              MEALS SERVED
            </Text>
          </Column>
          <Column style={{ width: "33%", textAlign: "center" }}>
            <Text style={{ fontSize: "24px", fontWeight: "900", margin: "0", color: "#2563eb" }}>
              {`${co2eAvoidedKg.toFixed(1)} kg`}
            </Text>
            <Text style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", margin: "4px 0 0", color: "#4b5563" }}>
              CO2e AVOIDED
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Delivery Receipt Card */}
      <Section
        style={{
          border: "3px solid #000000",
          backgroundColor: "#ffffff",
          padding: "20px",
          marginBottom: "24px",
        }}
      >
        <Text style={{ fontSize: "12px", fontWeight: "900", textTransform: "uppercase", margin: "0 0 12px", color: "#000000", letterSpacing: "1px" }}>
          OFFICIAL ACCEPTANCE RECEIPT
        </Text>

        <Row style={{ marginBottom: "8px" }}>
          <Column style={{ width: "35%", fontSize: "13px", fontWeight: "bold", color: "#6b7280" }}>
            DONATION:
          </Column>
          <Column style={{ width: "65%", fontSize: "13px", fontWeight: "bold", color: "#000000" }}>
            {listingTitle}
          </Column>
        </Row>

        <Row style={{ marginBottom: "8px" }}>
          <Column style={{ width: "35%", fontSize: "13px", fontWeight: "bold", color: "#6b7280" }}>
            RECIPIENT:
          </Column>
          <Column style={{ width: "65%", fontSize: "13px", fontWeight: "bold", color: "#000000" }}>
            {shelterName}
          </Column>
        </Row>

        <Row style={{ marginBottom: "8px" }}>
          <Column style={{ width: "35%", fontSize: "13px", fontWeight: "bold", color: "#6b7280" }}>
            DELIVERED TO:
          </Column>
          <Column style={{ width: "65%", fontSize: "13px", color: "#374151" }}>
            {shelterAddress}
          </Column>
        </Row>

        <Row style={{ marginBottom: "8px" }}>
          <Column style={{ width: "35%", fontSize: "13px", fontWeight: "bold", color: "#6b7280" }}>
            TIMESTAMP:
          </Column>
          <Column style={{ width: "65%", fontSize: "13px", color: "#374151" }}>
            {deliveryDate}
          </Column>
        </Row>

        <Row style={{ marginBottom: "8px" }}>
          <Column style={{ width: "35%", fontSize: "13px", fontWeight: "bold", color: "#6b7280" }}>
            CHECKLIST:
          </Column>
          <Column style={{ width: "65%", fontSize: "13px", fontWeight: "bold", color: "#16a34a" }}>
            PASSED (5/5 Verification Items)
          </Column>
        </Row>

        <Row>
          <Column style={{ width: "35%", fontSize: "13px", fontWeight: "bold", color: "#6b7280" }}>
            DONOR PIN:
          </Column>
          <Column style={{ width: "65%", fontSize: "13px", fontWeight: "bold", color: pinVerified ? "#16a34a" : "#dc2626" }}>
            {pinVerified ? "CONFIRMED & MATCHED" : "UNCONFIRMED"}
          </Column>
        </Row>
      </Section>

      {/* CTA Button */}
      <Section style={{ textAlign: "center", margin: "24px 0 16px" }}>
        <Button
          href={actionUrl}
          style={{
            backgroundColor: "#000000",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: "bold",
            padding: "14px 28px",
            textDecoration: "none",
            borderRadius: "0px",
            border: "2px solid #000000",
            boxShadow: "4px 4px 0px #dc2626",
            display: "inline-block",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          VIEW DONATION IMPACT & TAX CERTIFICATE
        </Button>
      </Section>

      <Text style={{ fontSize: "11px", color: "#6b7280", textAlign: "center", margin: "0" }}>
        Your formal Section 80G tax receipt and ESG diversion report are updated in your dashboard.
      </Text>
    </BaseEmail>
  );
}

export default DeliveryAccepted;
