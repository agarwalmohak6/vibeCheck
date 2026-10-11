import 'server-only';

export type WhatsAppDeliveryResult = {
  sent: boolean;
  to: string;
  provider: 'whatsapp_cloud';
  reason?: 'missing_config' | 'invalid_number' | 'provider_error';
  actionUrl?: string;
  detail?: string;
};

export function normalizeWhatsAppNumber(value: string) {
  let digits = value.replace(/[^\d]/g, '');

  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }

  if (digits.length === 10) {
    digits = `91${digits}`;
  }

  return digits;
}

export function buildWhatsAppActionUrl(to: string, message: string) {
  const normalized = normalizeWhatsAppNumber(to);
  if (!normalized) return '';
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export async function sendWhatsAppText(input: {
  to: string;
  message: string;
}): Promise<WhatsAppDeliveryResult> {
  const to = normalizeWhatsAppNumber(input.to);
  const actionUrl = buildWhatsAppActionUrl(input.to, input.message);
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_CLOUD_API_VERSION || 'v24.0';

  if (!to || to.length < 10 || to.length > 15) {
    return {
      sent: false,
      to,
      provider: 'whatsapp_cloud',
      reason: 'invalid_number',
      actionUrl,
    };
  }

  if (!token || !phoneNumberId) {
    console.info('WhatsApp skipped because Cloud API credentials are not configured.');
    return {
      sent: false,
      to,
      provider: 'whatsapp_cloud',
      reason: 'missing_config',
      actionUrl,
    };
  }

  const res = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        preview_url: true,
        body: input.message,
      },
    }),
    signal: AbortSignal.timeout(12_000),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error('WhatsApp Cloud API failed:', detail);
    return {
      sent: false,
      to,
      provider: 'whatsapp_cloud',
      reason: 'provider_error',
      actionUrl,
      detail,
    };
  }

  return {
    sent: true,
    to,
    provider: 'whatsapp_cloud',
    actionUrl,
  };
}
