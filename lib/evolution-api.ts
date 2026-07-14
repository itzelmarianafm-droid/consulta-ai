const getBaseUrl = () => process.env.EVOLUTION_API_URL || '';
const getApiKey = () => process.env.EVOLUTION_API_KEY || '';

function headers() {
  return {
    'Content-Type': 'application/json',
    apikey: getApiKey(),
  };
}

export async function createInstance(instanceName: string, webhookUrl: string) {
  const res = await fetch(`${getBaseUrl()}/instance/create`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      instanceName,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
      webhook: {
        url: webhookUrl,
        byEvents: false,
        base64: false,
        events: [
          'MESSAGES_UPSERT',
          'CONNECTION_UPDATE',
        ],
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Evolution API create error: ${err}`);
  }

  return res.json();
}

export async function getQrCode(instanceName: string): Promise<{ base64: string; code: string } | null> {
  const res = await fetch(`${getBaseUrl()}/instance/connect/${instanceName}`, {
    method: 'GET',
    headers: headers(),
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.base64 ? { base64: data.base64, code: data.code || '' } : null;
}

export async function getConnectionState(instanceName: string): Promise<string> {
  try {
    const res = await fetch(`${getBaseUrl()}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: headers(),
    });

    if (!res.ok) return 'close';

    const data = await res.json();
    return data.instance?.state || data.state || 'close';
  } catch {
    return 'close';
  }
}

export async function sendText(instanceName: string, to: string, text: string): Promise<boolean> {
  const number = to.replace(/\D/g, '');

  const res = await fetch(`${getBaseUrl()}/message/sendText/${instanceName}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      number,
      text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[Evolution] Send error:', err);
    return false;
  }

  return true;
}

export async function logoutInstance(instanceName: string): Promise<boolean> {
  try {
    const res = await fetch(`${getBaseUrl()}/instance/logout/${instanceName}`, {
      method: 'DELETE',
      headers: headers(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteInstance(instanceName: string): Promise<boolean> {
  try {
    const res = await fetch(`${getBaseUrl()}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: headers(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    message?: {
      conversation?: string;
      extendedTextMessage?: { text: string };
    };
    messageTimestamp?: number;
    pushName?: string;
  };
}

export function parseEvolutionMessage(body: EvolutionWebhookPayload): {
  from: string;
  text: string;
  messageId: string;
  pushName: string | null;
  instanceName: string;
} | null {
  if (body.event !== 'messages.upsert') return null;
  if (body.data.key.fromMe) return null;

  const jid = body.data.key.remoteJid;
  if (!jid || jid.endsWith('@g.us')) return null;

  const phone = jid.replace('@s.whatsapp.net', '').replace('@c.us', '');

  const text =
    body.data.message?.conversation ||
    body.data.message?.extendedTextMessage?.text ||
    '';

  if (!text.trim()) return null;

  return {
    from: phone,
    text,
    messageId: body.data.key.id,
    pushName: body.data.pushName || null,
    instanceName: body.instance,
  };
}
