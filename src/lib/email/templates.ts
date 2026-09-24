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
import { MatchAccepted } from "@/emails/MatchAccepted";
import { CoordinatorInvite } from "@/emails/CoordinatorInvite";
import { DriverAssigned } from "@/emails/DriverAssigned";
import { DriverPickedUp } from "@/emails/DriverPickedUp";
import { DeliveryAccepted } from "@/emails/DeliveryAccepted";
import { DeliveryDisputed } from "@/emails/DeliveryDisputed";
import { AutoConfirmShelter } from "@/emails/AutoConfirmShelter";
import { EscalateToAdmin } from "@/emails/EscalateToAdmin";

// Re-export prop types so callers can import them from a single location
export type { VerificationSubmittedProps } from "@/emails/VerificationSubmitted";
export type { VerificationApprovedProps } from "@/emails/VerificationApproved";
export type { VerificationRejectedProps } from "@/emails/VerificationRejected";
export type { WelcomeDonorProps } from "@/emails/WelcomeDonor";
export type { ERSAlertProps } from "@/emails/ERSAlert";
export type { MatchAcceptedProps } from "@/emails/MatchAccepted";
export type { CoordinatorInviteProps } from "@/emails/CoordinatorInvite";
export type { DriverAssignedProps } from "@/emails/DriverAssigned";
export type { DriverPickedUpProps } from "@/emails/DriverPickedUp";
export type { DeliveryAcceptedProps } from "@/emails/DeliveryAccepted";
export type { DeliveryDisputedProps } from "@/emails/DeliveryDisputed";
export type { AutoConfirmShelterProps } from "@/emails/AutoConfirmShelter";
export type { EscalateToAdminProps } from "@/emails/EscalateToAdmin";

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

export async function renderMatchAccepted(
  props: React.ComponentProps<typeof MatchAccepted>
): Promise<string> {
  return await render(React.createElement(MatchAccepted, props));
}

export async function renderCoordinatorInvite(
  props: React.ComponentProps<typeof CoordinatorInvite>
): Promise<string> {
  return await render(React.createElement(CoordinatorInvite, props));
}

export async function renderDriverAssigned(
  props: React.ComponentProps<typeof DriverAssigned>
): Promise<string> {
  return await render(React.createElement(DriverAssigned, props));
}

export async function renderDriverPickedUp(
  props: React.ComponentProps<typeof DriverPickedUp>
): Promise<string> {
  return await render(React.createElement(DriverPickedUp, props));
}

export async function renderDeliveryAccepted(
  props: React.ComponentProps<typeof DeliveryAccepted>
): Promise<string> {
  return await render(React.createElement(DeliveryAccepted, props));
}

export async function renderDeliveryDisputed(
  props: React.ComponentProps<typeof DeliveryDisputed>
): Promise<string> {
  return await render(React.createElement(DeliveryDisputed, props));
}

export async function renderAutoConfirmShelter(
  props: React.ComponentProps<typeof AutoConfirmShelter>
): Promise<string> {
  return await render(React.createElement(AutoConfirmShelter, props));
}

export async function renderEscalateToAdmin(
  props: React.ComponentProps<typeof EscalateToAdmin>
): Promise<string> {
  return await render(React.createElement(EscalateToAdmin, props));
}
