/**
 * Email render helpers.
 * Wraps @react-email/components `render()` for each template.
 * Import these — not the React components directly — from API routes.
 */
import { render } from "@react-email/components";
import * as React from "react";
import { VerificationSubmitted } from "@/emails/VerificationSubmitted";
import { VerificationApproved } from "@/emails/VerificationApproved";
import { VerificationRejected } from "@/emails/VerificationRejected";
import { WelcomeDonor } from "@/emails/WelcomeDonor";
import { ERSAlert } from "@/emails/ERSAlert";

// Re-export prop types so callers can import them from a single location
export type { VerificationSubmittedProps } from "@/emails/VerificationSubmitted";
export type { VerificationApprovedProps } from "@/emails/VerificationApproved";
export type { VerificationRejectedProps } from "@/emails/VerificationRejected";
export type { WelcomeDonorProps } from "@/emails/WelcomeDonor";
export type { ERSAlertProps } from "@/emails/ERSAlert";

export async function renderVerificationSubmitted(
  props: React.ComponentProps<typeof VerificationSubmitted>
): Promise<string> {
  return await render(React.createElement(VerificationSubmitted, props));
}

export async function renderVerificationApproved(
  props: React.ComponentProps<typeof VerificationApproved>
): Promise<string> {
  return await render(React.createElement(VerificationApproved, props));
}

export async function renderVerificationRejected(
  props: React.ComponentProps<typeof VerificationRejected>
): Promise<string> {
  return await render(React.createElement(VerificationRejected, props));
}

export async function renderWelcomeDonor(
  props: React.ComponentProps<typeof WelcomeDonor>
): Promise<string> {
  return await render(React.createElement(WelcomeDonor, props));
}

export async function renderERSAlert(
  props: React.ComponentProps<typeof ERSAlert>
): Promise<string> {
  return await render(React.createElement(ERSAlert, props));
}
