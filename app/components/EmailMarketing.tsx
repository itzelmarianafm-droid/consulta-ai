'use client';

import { useEffect, useState, useCallback } from 'react';

interface Campaign {
  id: string;
  subject: string;
  body_text: string;
  cta_text: string | null;
  cta_url: string | null;
  segment: string;
  status: string;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  sent_at: string | null;
  created_at: string;
}

interface EmailConfig {
  email_mode: string;
  email_from_name: string | null;
  email_from_address: string | null;
  email_external_provider: string | null;
  email_external_api_key: string | null;
  has_external_key: boolean;
  email_enabled: boolean;
}

const SEGMENTS = [
  { value: 'all', label: 'Todos los leads' },
  { value: 'nuevo', label: 'Nuevos' },
  { value: 'calificando', label: 'Calificando' },
  { value: 'visto_sin_pagar', label: 'Visto sin pagar' },
  { value: 'pago_enviado', label: 'Pago enviado' },
  { value: 'pagado_agendado', label: 'Pagado y agendado' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-600',
};

export default function EmailMarketing() {
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [message, setMessage] = useState('');

  // Create form
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [segment, setSegment] = useState('all');
  const [sending, setSending] = useState(false);

  // Config form
  const [fromName, setFromName] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [emailMode, setEmailMode] = useState('built_in');
  const [externalProvider, setExternalProvider] = useState('');
  const [externalKey, setExternalKey] = useState('');

  const load = useCallback(() => {
    fetch('/api/email-config').then(r => r.json()).then(data => {
      setConfig(data);
      setFromName(data.email_from_name || '');
      setFromEmail(data.email_from_address || '');
      setEmailMode(data.email_mode || 'built_in');
      setExternalProvider(data.email_external_provider || '');
    }).catch(console.error);

    fetch('/api/email-campaigns').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setCampaigns(data);
    }).catch(console.error);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveConfig = useCallback(async () => {
    await fetch('/api/email-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email_mode: emailMode,
        email_from_name: fromName,
        email_from_address: fromEmail,
        email_external_provider: externalProvider || null,
        email_external_api_key: externalKey || undefined,
      }),
    });
    setShowConfig(false);
    setExternalKey('');
    setMessage('Configuración guardada');
    load();
    setTimeout(() => setMessage(''), 3000);
  }, [emailMode, fromName, fromEmail, externalProvider, externalKey, load]);

  const createCampaign = useCallback(async (sendNow: boolean) => {
    if (!subject || !bodyText) return;
    setSending(true);
    setMessage('');

    const res = await fetch('/api/email-campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject, body_text: bodyText, cta_text: ctaText || null,
        cta_url: ctaUrl || null, segment, send_now: sendNow,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(sendNow ? `Campaña enviada a ${data.sent || 0} contactos` : 'Borrador guardado');
      setShowCreate(false);
      setSubject(''); setBodyText(''); setCtaText(''); setCtaUrl(''); setSegment('all');
      load();
    } else {
      setMessage(`Error: ${data.error}`);
    }
    setSending(false);
    setTimeout(() => setMessage(''), 5000);
  }, [subject, bodyText, ctaText, ctaUrl, segment, load]);

  if (!config) {
    return <div className="bg-paper-warm border border-line rounded-lg p-6 shadow-sm"><div className="text-ink-soft text-sm">Cargando...</div></div>;
  }

  if (!config.email_enabled) {
    return (
      <div className="bg-paper-warm border border-line rounded-lg p-8 shadow-sm text-center">
        <div className="font-serif text-[22px] font-medium tracking-tight mb-2">Email Marketing</div>
        <p className="text-ink-soft text-sm mb-4">Este módulo no está activado para tu clínica.</p>
        <p className="text-ink-soft text-xs">Contacta al administrador para habilitarlo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-paper-warm border border-line rounded-lg overflow-hidden shadow-sm">
        <div className="px-5 pt-4 pb-3 flex justify-between items-center border-b border-line flex-wrap gap-3">
          <div>
            <div className="font-serif text-[22px] font-medium tracking-tight">Email Marketing</div>
            <div className="text-[11.5px] text-ink-soft mt-0.5">Crea y envía campañas de email a tus leads</div>
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 border border-line-strong rounded-md text-[11px] font-medium text-ink-soft hover:text-ink transition-colors"
              onClick={() => { setShowConfig(!showConfig); setShowCreate(false); }}
            >
              Configuración
            </button>
            <button
              className="px-4 py-2 bg-ink text-paper text-[12px] font-semibold rounded-md hover:bg-accent transition-colors"
              onClick={() => { setShowCreate(!showCreate); setShowConfig(false); }}
            >
              {showCreate ? 'Cancelar' : '+ Nueva campaña'}
            </button>
          </div>
        </div>

        {/* Config panel */}
        {showConfig && (
          <div className="p-5 border-b border-line bg-paper space-y-4">
            <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
              <div>
                <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-1">Nombre del remitente</label>
                <input className="w-full p-3 bg-paper-warm border border-line-strong rounded-md text-[13px]" placeholder="Clínica Ejemplo" value={fromName} onChange={e => setFromName(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-1">Email del remitente</label>
                <input type="email" className="w-full p-3 bg-paper-warm border border-line-strong rounded-md text-[13px]" placeholder="info@tuclinica.com" value={fromEmail} onChange={e => setFromEmail(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-2">Modo de envío</label>
              <div className="flex gap-3">
                <button
                  className={`flex-1 p-3 border rounded-md text-left text-[12px] transition-colors ${emailMode === 'built_in' ? 'border-accent bg-accent/5' : 'border-line hover:border-line-strong'}`}
                  onClick={() => setEmailMode('built_in')}
                >
                  <strong>Built-in (Resend)</strong>
                  <div className="text-ink-soft mt-1">Nosotros enviamos por ti. Solo configura el remitente.</div>
                </button>
                <button
                  className={`flex-1 p-3 border rounded-md text-left text-[12px] transition-colors ${emailMode === 'external' ? 'border-accent bg-accent/5' : 'border-line hover:border-line-strong'}`}
                  onClick={() => setEmailMode('external')}
                >
                  <strong>Servicio externo</strong>
                  <div className="text-ink-soft mt-1">Conecta tu Brevo, Mailchimp o SendGrid.</div>
                </button>
              </div>
            </div>

            {emailMode === 'external' && (
              <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-1">Proveedor</label>
                  <select className="w-full p-3 bg-paper-warm border border-line-strong rounded-md text-[13px]" value={externalProvider} onChange={e => setExternalProvider(e.target.value)}>
                    <option value="">Selecciona...</option>
                    <option value="brevo">Brevo (Sendinblue)</option>
                    <option value="mailchimp">Mailchimp</option>
                    <option value="sendgrid">SendGrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-1">API Key</label>
                  <input type="password" className="w-full p-3 bg-paper-warm border border-line-strong rounded-md text-[13px]" placeholder={config.has_external_key ? '••••' : 'Tu API key'} value={externalKey} onChange={e => setExternalKey(e.target.value)} />
                </div>
              </div>
            )}

            <button className="px-6 py-2.5 bg-ink text-paper text-[12px] font-semibold rounded-md hover:bg-accent transition-colors" onClick={saveConfig}>
              Guardar configuración
            </button>
          </div>
        )}

        {/* Create campaign */}
        {showCreate && (
          <div className="p-5 border-b border-line bg-paper space-y-4">
            <div>
              <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-1">Asunto del email</label>
              <input className="w-full p-3 bg-paper-warm border border-line-strong rounded-md text-[13px]" placeholder="Ej: Tenemos algo especial para ti" value={subject} onChange={e => setSubject(e.target.value)} />
            </div>

            <div>
              <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-1">Cuerpo del email</label>
              <textarea
                className="w-full p-3 bg-paper-warm border border-line-strong rounded-md text-[13px] min-h-[140px] resize-y leading-relaxed"
                placeholder="Escribe tu mensaje aquí..."
                value={bodyText}
                onChange={e => setBodyText(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
              <div>
                <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-1">Texto del botón (CTA)</label>
                <input className="w-full p-3 bg-paper-warm border border-line-strong rounded-md text-[13px]" placeholder="Ej: Agendar mi cita" value={ctaText} onChange={e => setCtaText(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-1">URL del botón</label>
                <input type="url" className="w-full p-3 bg-paper-warm border border-line-strong rounded-md text-[13px]" placeholder="https://..." value={ctaUrl} onChange={e => setCtaUrl(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-1">Enviar a</label>
              <select className="w-full p-3 bg-paper-warm border border-line-strong rounded-md text-[13px]" value={segment} onChange={e => setSegment(e.target.value)}>
                {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {/* Preview */}
            {(subject || bodyText) && (
              <div>
                <div className="text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-2">Vista previa</div>
                <div className="bg-[#F5F3EE] p-6 rounded-md">
                  <div className="bg-white rounded-lg p-8 border border-[#E8E0D4] max-w-md mx-auto">
                    {bodyText.split('\n').map((p, i) => (
                      <p key={i} className="text-[14px] text-ink mb-3 leading-relaxed">{p}</p>
                    ))}
                    {ctaText && ctaUrl && (
                      <div className="text-center mt-6">
                        <span className="inline-block bg-[#5C3D2E] text-[#FAF7F2] px-8 py-3 rounded-md font-semibold text-[14px]">{ctaText}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-center text-[11px] text-ink-soft mt-4">{fromName || 'Tu clínica'}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                className="px-6 py-2.5 bg-ink text-paper text-[12px] font-semibold rounded-md hover:bg-accent transition-colors disabled:opacity-50"
                onClick={() => createCampaign(true)}
                disabled={sending || !subject || !bodyText}
              >
                {sending ? 'Enviando...' : 'Enviar ahora'}
              </button>
              <button
                className="px-6 py-2.5 border border-line-strong text-[12px] font-medium rounded-md hover:bg-paper-deep transition-colors disabled:opacity-50"
                onClick={() => createCampaign(false)}
                disabled={sending || !subject || !bodyText}
              >
                Guardar borrador
              </button>
            </div>
          </div>
        )}

        {/* Campaigns list */}
        <div className="divide-y divide-line">
          {campaigns.length === 0 && !showCreate ? (
            <div className="p-8 text-center text-ink-soft text-sm">No hay campañas todavía. Crea tu primera campaña.</div>
          ) : campaigns.map(c => (
            <div key={c.id} className="px-5 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold truncate">{c.subject}</div>
                <div className="text-[11px] text-ink-soft mt-0.5">
                  {SEGMENTS.find(s => s.value === c.segment)?.label || c.segment}
                  {c.sent_at && ` · Enviado ${new Date(c.sent_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {c.status === 'sent' && (
                  <span className="text-[11px] text-ink-soft font-mono">{c.sent_count} enviados</span>
                )}
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded ${STATUS_COLORS[c.status] || 'bg-gray-100'}`}>
                  {c.status === 'draft' ? 'Borrador' : c.status === 'sent' ? 'Enviado' : 'Error'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {message && (
        <div className={`text-[12px] font-medium px-3 py-2 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
