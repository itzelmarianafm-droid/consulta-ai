'use client';

import { useEffect, useState, useCallback } from 'react';

interface StripeState {
  stripe_secret_key: string | null;
  stripe_webhook_secret: string | null;
  stripe_active: boolean;
  has_secret_key: boolean;
  has_webhook_secret: boolean;
}

export default function StripeConfig() {
  const [config, setConfig] = useState<StripeState | null>(null);
  const [secretKey, setSecretKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState<'secret_key' | 'webhook_secret' | null>(null);

  useEffect(() => {
    fetch('/api/stripe-config')
      .then((r) => r.json())
      .then(setConfig)
      .catch(console.error);
  }, []);

  const save = useCallback(async (updates: Record<string, unknown>) => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/stripe-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Error al guardar');

      // Reload config
      const updated = await fetch('/api/stripe-config').then((r) => r.json());
      setConfig(updated);
      setEditing(null);
      setSecretKey('');
      setWebhookSecret('');
      setMessage('Guardado correctamente');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Error al guardar');
    }
    setSaving(false);
  }, []);

  if (!config) {
    return (
      <div className="bg-paper-warm border border-line rounded-lg p-6 shadow-sm">
        <div className="text-ink-soft text-sm">Cargando configuración de Stripe...</div>
      </div>
    );
  }

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhook/stripe`
      : '/api/webhook/stripe';

  return (
    <div className="bg-paper-warm border border-line rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex justify-between items-center border-b border-line flex-wrap gap-3">
        <div>
          <div className="font-serif text-[22px] font-medium tracking-tight">
            Stripe · pagos
          </div>
          <div className="text-[11.5px] text-ink-soft mt-0.5">
            Configura tus llaves de Stripe para recibir pagos de anticipos
          </div>
        </div>

        {/* Toggle activo */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-ink-soft uppercase tracking-wider font-semibold">
            {config.stripe_active ? 'Activo' : 'Inactivo'}
          </span>
          <button
            className={`w-[38px] h-[22px] rounded-full relative transition-colors shrink-0 ${
              config.stripe_active ? 'bg-accent' : 'bg-paper-deep'
            }`}
            onClick={() => save({ stripe_active: !config.stripe_active })}
            role="switch"
            aria-checked={config.stripe_active}
            aria-label="Activar Stripe"
            disabled={!config.has_secret_key || !config.has_webhook_secret}
          >
            <span
              className={`absolute w-4 h-4 bg-paper rounded-full top-[3px] transition-[left] shadow ${
                config.stripe_active ? 'left-[19px]' : 'left-[3px]'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Stripe Secret Key */}
        <div>
          <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-2">
            Secret Key
          </label>
          {editing === 'secret_key' ? (
            <div className="flex gap-2">
              <input
                type="password"
                className="flex-1 p-3 bg-paper border border-line-strong rounded-md text-[13px] text-ink transition-colors focus:outline-2 focus:outline-accent focus:-outline-offset-1 focus:border-accent"
                placeholder="sk_live_..."
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                autoFocus
              />
              <button
                className="px-4 py-2 bg-ink text-paper text-[12px] font-semibold rounded-md hover:bg-accent transition-colors disabled:opacity-50"
                onClick={() => save({ stripe_secret_key: secretKey })}
                disabled={saving || !secretKey.trim()}
              >
                Guardar
              </button>
              <button
                className="px-3 py-2 border border-line rounded-md text-[12px] text-ink-soft hover:text-ink transition-colors"
                onClick={() => { setEditing(null); setSecretKey(''); }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1 p-3 bg-paper border border-line rounded-md text-[13px] text-ink-soft font-mono">
                {config.has_secret_key ? config.stripe_secret_key : 'No configurada'}
              </div>
              <button
                className="px-4 py-2 border border-line-strong rounded-md text-[12px] font-medium text-ink hover:bg-paper-deep transition-colors"
                onClick={() => setEditing('secret_key')}
              >
                {config.has_secret_key ? 'Cambiar' : 'Agregar'}
              </button>
            </div>
          )}
          <p className="text-[11px] text-ink-soft mt-1.5">
            Encuéntrala en{' '}
            <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener" className="underline">
              dashboard.stripe.com/apikeys
            </a>
          </p>
        </div>

        {/* Webhook Secret */}
        <div>
          <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-2">
            Webhook Secret
          </label>
          {editing === 'webhook_secret' ? (
            <div className="flex gap-2">
              <input
                type="password"
                className="flex-1 p-3 bg-paper border border-line-strong rounded-md text-[13px] text-ink transition-colors focus:outline-2 focus:outline-accent focus:-outline-offset-1 focus:border-accent"
                placeholder="whsec_..."
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                autoFocus
              />
              <button
                className="px-4 py-2 bg-ink text-paper text-[12px] font-semibold rounded-md hover:bg-accent transition-colors disabled:opacity-50"
                onClick={() => save({ stripe_webhook_secret: webhookSecret })}
                disabled={saving || !webhookSecret.trim()}
              >
                Guardar
              </button>
              <button
                className="px-3 py-2 border border-line rounded-md text-[12px] text-ink-soft hover:text-ink transition-colors"
                onClick={() => { setEditing(null); setWebhookSecret(''); }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1 p-3 bg-paper border border-line rounded-md text-[13px] text-ink-soft font-mono">
                {config.has_webhook_secret ? config.stripe_webhook_secret : 'No configurado'}
              </div>
              <button
                className="px-4 py-2 border border-line-strong rounded-md text-[12px] font-medium text-ink hover:bg-paper-deep transition-colors"
                onClick={() => setEditing('webhook_secret')}
              >
                {config.has_webhook_secret ? 'Cambiar' : 'Agregar'}
              </button>
            </div>
          )}
          <p className="text-[11px] text-ink-soft mt-1.5">
            Se genera al crear el webhook en{' '}
            <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener" className="underline">
              dashboard.stripe.com/webhooks
            </a>
          </p>
        </div>

        {/* Webhook URL to copy */}
        <div className="bg-paper border border-line rounded-md p-4">
          <div className="text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-2">
            URL del Webhook (copia esta URL en Stripe)
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[12.5px] text-ink bg-paper-deep px-3 py-2 rounded font-mono break-all">
              {webhookUrl}
            </code>
            <button
              className="px-3 py-2 border border-line-strong rounded-md text-[11px] font-medium text-ink hover:bg-paper-deep transition-colors shrink-0"
              onClick={() => {
                navigator.clipboard.writeText(webhookUrl);
                setMessage('URL copiada');
                setTimeout(() => setMessage(''), 2000);
              }}
            >
              Copiar
            </button>
          </div>
          <p className="text-[11px] text-ink-soft mt-2">
            Eventos requeridos: <code className="text-[10.5px]">checkout.session.completed</code>,{' '}
            <code className="text-[10.5px]">checkout.session.expired</code>,{' '}
            <code className="text-[10.5px]">charge.refunded</code>
          </p>
        </div>

        {/* Setup steps */}
        <div className="border border-line rounded-md p-4 bg-paper">
          <div className="text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-3">
            Pasos para configurar
          </div>
          <ol className="space-y-2 text-[12.5px] text-ink-soft">
            <li className="flex gap-2">
              <span className={`shrink-0 w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold ${config.has_secret_key ? 'bg-accent text-paper' : 'bg-paper-deep text-ink-soft'}`}>
                {config.has_secret_key ? '✓' : '1'}
              </span>
              Pega tu <strong className="text-ink">Secret Key</strong> de Stripe arriba
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold bg-paper-deep text-ink-soft">2</span>
              Crea un webhook en Stripe con la <strong className="text-ink">URL de arriba</strong>
            </li>
            <li className="flex gap-2">
              <span className={`shrink-0 w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold ${config.has_webhook_secret ? 'bg-accent text-paper' : 'bg-paper-deep text-ink-soft'}`}>
                {config.has_webhook_secret ? '✓' : '3'}
              </span>
              Pega el <strong className="text-ink">Webhook Secret</strong> que Stripe te da
            </li>
            <li className="flex gap-2">
              <span className={`shrink-0 w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold ${config.stripe_active ? 'bg-accent text-paper' : 'bg-paper-deep text-ink-soft'}`}>
                {config.stripe_active ? '✓' : '4'}
              </span>
              Activa el toggle de <strong className="text-ink">Stripe</strong>
            </li>
          </ol>
        </div>

        {/* Status message */}
        {message && (
          <div className={`text-[12px] font-medium px-3 py-2 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
