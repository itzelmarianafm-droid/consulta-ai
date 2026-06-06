// =====================================================================
// WhatsApp Cloud API — send messages via Meta Graph API
// =====================================================================

const GRAPH_API = 'https://graph.facebook.com/v21.0';

interface WhatsAppConfig {
  token: string;
  phoneId: string;
}

function getConfig(): WhatsAppConfig {
  return {
    token: process.env.WHATSAPP_TOKEN!,
    phoneId: process.env.WHATSAPP_PHONE_ID!,
  };
}

// Send a plain text message
export async function sendMessage(to: string, text: string): Promise<boolean> {
  const { token, phoneId } = getConfig();

  const res = await fetch(`${GRAPH_API}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[WhatsApp] Error sending message:', err);
    return false;
  }

  return true;
}

// Mark a message as read (blue checkmarks)
export async function markAsRead(messageId: string): Promise<void> {
  const { token, phoneId } = getConfig();

  await fetch(`${GRAPH_API}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    }),
  });
}

// Verify webhook challenge from Meta
export function verifyWebhook(params: URLSearchParams): string | null {
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return challenge;
  }

  return null;
}

// Extract incoming message data from Meta webhook payload
export function parseWebhookPayload(body: Record<string, unknown>): {
  from: string;
  text: string;
  messageId: string;
  timestamp: string;
} | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entry = (body as any).entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message || message.type !== 'text') return null;

    return {
      from: message.from,
      text: message.text.body,
      messageId: message.id,
      timestamp: message.timestamp,
    };
  } catch {
    return null;
  }
}
