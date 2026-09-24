import { Html, Head, Body, Container, Section, Column, Text, Button as EmailButton, Hr } from "@react-email/components";
import * as React from "react";

interface BaseEmailProps {
  children: React.ReactNode;
  preheader?: string;
}

export function BaseEmail({ children, preheader }: BaseEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Column>
              <Text style={styles.logo}>ANNA <span style={{ color: "#D42B2B" }}>SETU</span></Text>
              <Hr style={styles.divider} />
            </Column>
          </Section>

          <Section style={styles.content}>
            <Column>{children}</Column>
          </Section>

          <Section style={styles.footer}>
            <Column>
              <Hr style={styles.divider} />
              <Text style={styles.footerText}>
                You received this email because you're registered on AnnaSetu.
              </Text>
              <Text style={styles.footerText}>
                © 2026 AnnaSetu. All rights reserved.
              </Text>
            </Column>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#F5F0E8",
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    margin: 0,
    padding: "40px 20px",
  },
  container: {
    backgroundColor: "#FFFFFF",
    border: "2px solid #0A0A0A",
    borderRadius: 0,
    maxWidth: "600px",
    margin: "0 auto",
    boxShadow: "4px 4px 0px 0px #0A0A0A",
  },
  header: {
    backgroundColor: "#0A0A0A",
    padding: "24px",
  },
  logo: {
    fontFamily: '"Bebas Neue", Impact, Arial Black, sans-serif',
    fontSize: "32px",
    color: "#F5F0E8",
    letterSpacing: "-0.015em",
    margin: 0,
    textAlign: "center" as const,
  },
  divider: {
    borderColor: "#D42B2B",
    borderWidth: "2px",
    margin: "16px 0",
  },
  content: {
    padding: "32px 24px",
  },
  footer: {
    backgroundColor: "#EDE8DC",
    padding: "24px",
  },
  footerText: {
    fontSize: "12px",
    color: "#1A1A1A",
    opacity: 0.6,
    textAlign: "center" as const,
    margin: "4px 0",
  },
};