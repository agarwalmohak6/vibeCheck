import 'server-only';

import { getConfiguredAdminEmail } from './admin-auth';
import {
  sendAdminPaymentReviewEmail,
  sendCreatorOrderEmail,
  sendCreatorPaymentVerifiedEmail,
  type EmailDeliveryResult,
} from './email';
import { buildWhatsAppActionUrl, sendWhatsAppText, type WhatsAppDeliveryResult } from './whatsapp';

type NotificationResult = {
  email?: EmailDeliveryResult;
  whatsapp?: WhatsAppDeliveryResult;
  whatsappUrl?: string;
};

type CreatorOrderNotificationInput = {
  creatorEmail?: string;
  creatorWhatsapp?: string;
  orderId: string;
  recipientName: string;
  creatorName: string;
  trackingUrl: string;
};

type AdminPaymentReviewNotificationInput = {
  baseUrl: string;
  orderId: string;
  cardId: string;
  recipientName: string;
  creatorName: string;
  paymentReference: string;
};

type CreatorPaymentVerifiedNotificationInput = CreatorOrderNotificationInput;

function buildCreatorTrackingMessage(input: CreatorOrderNotificationInput) {
  return [
    `VibeCheck order ${input.orderId} is ready.`,
    `For: ${input.recipientName || 'your recipient'}`,
    `Track privately: ${input.trackingUrl}`,
    'Keep this creator link private.',
  ].join('\n');
}

function buildCreatorVerifiedMessage(input: CreatorPaymentVerifiedNotificationInput) {
  return [
    `Payment verified for VibeCheck order ${input.orderId}.`,
    `For: ${input.recipientName || 'your recipient'}`,
    `Open tracking: ${input.trackingUrl}`,
  ].join('\n');
}

function buildAdminReviewMessage(input: AdminPaymentReviewNotificationInput, adminUrl: string) {
  return [
    'VibeCheck UPI proof needs review.',
    `Order: ${input.orderId}`,
    `UTR: ${input.paymentReference}`,
    `Creator: ${input.creatorName || 'Creator'}`,
    `Recipient: ${input.recipientName || 'Recipient'}`,
    `Admin: ${adminUrl}`,
  ].join('\n');
}

export async function sendCreatorOrderNotifications(input: CreatorOrderNotificationInput): Promise<NotificationResult> {
  const result: NotificationResult = {};
  const message = buildCreatorTrackingMessage(input);

  if (input.creatorEmail) {
    result.email = await sendCreatorOrderEmail({
      to: input.creatorEmail,
      orderId: input.orderId,
      recipientName: input.recipientName,
      creatorName: input.creatorName,
      trackingUrl: input.trackingUrl,
    });
  }

  if (input.creatorWhatsapp) {
    result.whatsappUrl = buildWhatsAppActionUrl(input.creatorWhatsapp, message);
    result.whatsapp = await sendWhatsAppText({
      to: input.creatorWhatsapp,
      message,
    });
  }

  return result;
}

export async function sendAdminPaymentReviewNotifications(input: AdminPaymentReviewNotificationInput): Promise<NotificationResult> {
  const adminEmail = getConfiguredAdminEmail();
  const adminUrl = `${input.baseUrl.replace(/\/$/, '')}/admin`;
  const result: NotificationResult = {};

  result.email = await sendAdminPaymentReviewEmail({
    to: adminEmail,
    orderId: input.orderId,
    cardId: input.cardId,
    recipientName: input.recipientName,
    creatorName: input.creatorName,
    paymentReference: input.paymentReference,
    adminUrl,
  });

  const adminWhatsapp = process.env.VIBECHECK_ADMIN_WHATSAPP?.trim();
  if (adminWhatsapp) {
    const message = buildAdminReviewMessage(input, adminUrl);
    result.whatsappUrl = buildWhatsAppActionUrl(adminWhatsapp, message);
    result.whatsapp = await sendWhatsAppText({
      to: adminWhatsapp,
      message,
    });
  }

  return result;
}

export async function sendCreatorPaymentVerifiedNotifications(input: CreatorPaymentVerifiedNotificationInput): Promise<NotificationResult> {
  const result: NotificationResult = {};
  const message = buildCreatorVerifiedMessage(input);

  if (input.creatorEmail) {
    result.email = await sendCreatorPaymentVerifiedEmail({
      to: input.creatorEmail,
      orderId: input.orderId,
      recipientName: input.recipientName,
      creatorName: input.creatorName,
      trackingUrl: input.trackingUrl,
    });
  }

  if (input.creatorWhatsapp) {
    result.whatsappUrl = buildWhatsAppActionUrl(input.creatorWhatsapp, message);
    result.whatsapp = await sendWhatsAppText({
      to: input.creatorWhatsapp,
      message,
    });
  }

  return result;
}
