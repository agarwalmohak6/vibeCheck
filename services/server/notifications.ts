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
  recipientUrl?: string;
  templateType?: string;
  themeId?: string;
  testMode?: boolean;
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

async function deliverNotifications(input: {
  emailTo?: string;
  email: (to: string) => Promise<EmailDeliveryResult>;
  whatsappTo?: string;
  message: string;
}): Promise<NotificationResult> {
  const whatsappUrl = input.whatsappTo
    ? buildWhatsAppActionUrl(input.whatsappTo, input.message)
    : undefined;

  // A failed or slow channel must not discard another channel's result.
  const [email, whatsapp] = await Promise.all([
    input.emailTo ? input.email(input.emailTo).catch((): EmailDeliveryResult => {
      console.error('Email notification failed unexpectedly.');
      return { sent: false, to: input.emailTo!, provider: 'none', reason: 'provider_error' };
    }) : undefined,
    input.whatsappTo ? sendWhatsAppText({ to: input.whatsappTo, message: input.message })
      .catch((): WhatsAppDeliveryResult => {
        console.error('WhatsApp notification failed.');
        return {
          sent: false,
          to: input.whatsappTo!,
          provider: 'whatsapp_cloud',
          reason: 'provider_error',
          actionUrl: whatsappUrl,
        };
      }) : undefined,
  ]);

  return { email, whatsapp, whatsappUrl };
}

function buildCreatorTrackingMessage(input: CreatorOrderNotificationInput) {
  return [
    `VibeCheck order ${input.orderId} is saved. Payment verification is pending.`,
    `For: ${input.recipientName || 'your recipient'}`,
    `Track privately: ${input.trackingUrl}`,
    'Keep this creator link private.',
  ].join('\n');
}

function buildCreatorVerifiedMessage(input: CreatorPaymentVerifiedNotificationInput) {
  return [
    input.testMode ? `Test VibeCheck order ${input.orderId} is ready. No payment was collected.` : `Payment verified for VibeCheck order ${input.orderId}.`,
    `For: ${input.recipientName || 'your recipient'}`,
    ...(input.recipientUrl ? [`Your card is ready to share: ${input.recipientUrl}`] : []),
    `Open tracking: ${input.trackingUrl}`,
  ].join('\n');
}

function buildAdminReviewMessage(input: AdminPaymentReviewNotificationInput, adminUrl: string) {
  return [
    'VibeCheck UPI proof needs review.',
    `Order: ${input.orderId}`,
    `Transaction ID: ${input.paymentReference}`,
    `Creator: ${input.creatorName || 'Creator'}`,
    `Recipient: ${input.recipientName || 'Recipient'}`,
    `Admin: ${adminUrl}`,
  ].join('\n');
}

export async function sendCreatorOrderNotifications(input: CreatorOrderNotificationInput): Promise<NotificationResult> {
  return deliverNotifications({
    emailTo: input.creatorEmail,
    email: (to) => sendCreatorOrderEmail({
      to,
      orderId: input.orderId,
      recipientName: input.recipientName,
      creatorName: input.creatorName,
      trackingUrl: input.trackingUrl,
      templateType: input.templateType,
      themeId: input.themeId,
    }),
    whatsappTo: input.creatorWhatsapp,
    message: buildCreatorTrackingMessage(input),
  });
}

export async function sendAdminPaymentReviewNotifications(input: AdminPaymentReviewNotificationInput): Promise<NotificationResult> {
  const adminEmail = getConfiguredAdminEmail();
  const adminUrl = `${input.baseUrl.replace(/\/$/, '')}/admin`;
  return deliverNotifications({
    emailTo: adminEmail,
    email: (to) => sendAdminPaymentReviewEmail({
      to,
      orderId: input.orderId,
      cardId: input.cardId,
      recipientName: input.recipientName,
      creatorName: input.creatorName,
      paymentReference: input.paymentReference,
      adminUrl,
    }),
    whatsappTo: process.env.VIBECHECK_ADMIN_WHATSAPP?.trim(),
    message: buildAdminReviewMessage(input, adminUrl),
  });
}

export async function sendCreatorPaymentVerifiedNotifications(input: CreatorPaymentVerifiedNotificationInput): Promise<NotificationResult> {
  return deliverNotifications({
    emailTo: input.creatorEmail,
    email: (to) => sendCreatorPaymentVerifiedEmail({
      to,
      orderId: input.orderId,
      recipientName: input.recipientName,
      creatorName: input.creatorName,
      trackingUrl: input.trackingUrl,
      recipientUrl: input.recipientUrl,
      testMode: input.testMode,
      templateType: input.templateType,
      themeId: input.themeId,
    }),
    whatsappTo: input.creatorWhatsapp,
    message: buildCreatorVerifiedMessage(input),
  });
}
