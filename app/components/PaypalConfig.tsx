'use client';

import { useEffect, useState, useCallback } from 'react';

interface PaypalState {
  paypal_client_id: string | null;
  paypal_secret: string | null;
  paypal_webhook_id: string | null;
  paypal_active: boolean;
  has_client_id: boolean;
  has_secret: boolean;
  has_webhook_id: boolean;
}

export default function PaypalConfig() {
  const [config, setConfig] = useState<PaypalState | null>(null);
  const [clientId, setClientId] = useState('');
  const [secret, setSecret] = useState('');
  const [webhookId, setWebhookId] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState<'client_id' | 'secret' | 'webhook_id' | null>(null);

  useEffect(() => {
    fetch('/api/paypal-config').then((r) => r.json()).then(setConfig).catch(console.error);
  }, []);

  const save = useCallback(async (updates: Record<string, unknown>) => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/paypal-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Error al guardar');
      const updated = await fetch('/api/paypal-config').then((r) => r.json());
      setConfig(updated);
      setEditing(null);
      setClientId('');
      setSecret('');
      setWebhookId('');
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
        <div className="text-ink-soft text-sm">Cargando configuración de PayPal...</div>
      </div>
    );
  }

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhook/paypal`
      : '/api/webhook/paypal';

  return (
    <div className="bg-paper-warm border border-line rounded-lg overflow-hidden shadow-sm">
      <div className="px-5 pt-4 pb-3 flex justify-between items-center border-b border-line flex-wrap gap-3">
        <div>
          <div className="font-serif text-[22px] font-medium tracking-tight">PayPal · pagos</div>
          <div className="text-[11.5px] text-ink-soft mt-0.5">Configura tus llaves de PayPal para recibir pagos</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-ink-soft uppercase tracking-wider font-semibold">
            {config.paypal_active ? 'Activo' : 'Inactivo'}
          </span>
          <button
            className={`w-[38px] h-[22px] rounded-full relative transition-colors shrink-0 ${config.paypal_active ? 'bg-accent' : 'bg-paper-deep'}`}
            onClick={() => save({ paypal_active: !config.paypal_active })}
            role="switch"
            aria-checked={config.paypal_active}
            disabled={!config.has_client_id || !config.has_secret}
          >
            <span className={`absolute w-4 h-4 bg-paper rounded-full top-[3px] transition-[left] shadow ${config.paypal_active ? 'left-[19px]' : 'left-[3px]'}`} />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Client ID */}
        <FieldRow
          label="Client ID"
          masked={config.paypal_client_id}
          hasValue={config.has_client_id}
          editing={editing === 'client_id'}
          value={clientId}
          placeholder="AX..."
          onChange={setClientId}
          onEdit={() => setEditing('client_id')}
          onCancel={() => { setEditing(null); setClientId(''); }}
          onSave={() => save({ paypal_client_id: clientId })}
          saving={saving}
          helpText={<>Encuéntralo en <a href="https://developer.paypal.com/dashboard/applications" target="_blank" rel="noopener" className="underline">developer.paypal.com</a></>}
        />

        {/* Secret */}
        <FieldRow
          label="Secret"
          masked={config.paypal_secret}
          hasValue={config.has_secret}
          editing={editing === 'secret'}
          value={secret}
          placeholder="EL..."
          onChange={setSecret}
          onEdit={() => setEditing('secret')}
          onCancel={() => { setEditing(null); setSecret(''); }}
          onSave={() => save({ paypal_secret: secret })}
          saving={saving}
          isPassword
          helpText="El secret de tu aplicación PayPal"
        />

        {/* Webhook ID */}
        <FieldRow
          label="Webhook ID"
          masked={config.paypal_webhook_id}
          hasValue={config.has_webhook_id}
          editing={editing === 'webhook_id'}
          value={webhookId}
          placeholder="WH-..."
          onChange={setWebhookId}
          onEdit={() => setEditing('webhook_id')}
          onCancel={() => { setEditing(null); setWebhookId(''); }}
          onSave={() => save({ paypal_webhook_id: webhookId })}
          saving={saving}
          helpText="Se genera al crear el webhook en PayPal Developer"
        />

        {/* Webhook URL */}
        <div className="bg-paper border border-line rounded-md p-4">
          <div className="text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-2">
            URL del Webhook (copia esta URL en PayPal)
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
            Eventos: <code className="text-[10.5px]">PAYMENT.CAPTURE.COMPLETED</code>,{' '}
            <code className="text-[10.5px]">PAYMENT.CAPTURE.REFUNDED</code>
          </p>
        </div>

        {/* Steps */}
        <div className="border border-line rounded-md p-4 bg-paper">
          <div className="text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-3">
            Pasos para configurar
          </div>
          <ol className="space-y-2 text-[12.5px] text-ink-soft">
            {[
              { done: config.has_client_id, text: <>Crea una app en <strong className="text-ink">PayPal Developer</strong> y pega tu Client ID</> },
              { done: config.has_secret, text: <>Pega el <strong className="text-ink">Secret</strong> de tu app</> },
              { done: false, text: <>Crea un webhook con la <strong className="text-ink">URL de arriba</strong></> },
              { done: config.has_webhook_id, text: <>Pega el <strong className="text-ink">Webhook ID</strong> que PayPal te da</> },
              { done: config.paypal_active, text: <>Activa el <strong className="text-ink">toggle</strong></> },
            ].map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className={`shrink-0 w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold ${step.done ? 'bg-accent text-paper' : 'bg-paper-deep text-ink-soft'}`}>
                  {step.done ? '✓' : i + 1}
                </span>
                {step.text}
              </li>
            ))}
          </ol>
        </div>

        {message && (
          <div className={`text-[12px] font-medium px-3 py-2 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

function FieldRow({ label, masked, hasValue, editing, value, placeholder, onChange, onEdit, onCancel, onSave, saving, isPassword, helpText }: {
  label: string; masked: string | null; hasValue: boolean; editing: boolean;
  value: string; placeholder: string; onChange: (v: string) => void;
  onEdit: () => void; onCancel: () => void; onSave: () => void;
  saving: boolean; isPassword?: boolean; helpText: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-2">{label}</label>
      {editing ? (
        <div className="flex gap-2">
          <input
            type={isPassword ? 'password' : 'text'}
            className="flex-1 p-3 bg-paper border border-line-strong rounded-md text-[13px] text-ink transition-colors focus:outline-2 focus:outline-accent focus:-outline-offset-1 focus:border-accent"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoFocus
          />
          <button className="px-4 py-2 bg-ink text-paper text-[12px] font-semibold rounded-md hover:bg-accent transition-colors disabled:opacity-50" onClick={onSave} disabled={saving || !value.trim()}>Guardar</button>
          <button className="px-3 py-2 border border-line rounded-md text-[12px] text-ink-soft hover:text-ink transition-colors" onClick={onCancel}>Cancelar</button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex-1 p-3 bg-paper border border-line rounded-md text-[13px] text-ink-soft font-mono">
            {hasValue ? masked : 'No configurado'}
          </div>
          <button className="px-4 py-2 border border-line-strong rounded-md text-[12px] font-medium text-ink hover:bg-paper-deep transition-colors" onClick={onEdit}>
            {hasValue ? 'Cambiar' : 'Agregar'}
          </button>
        </div>
      )}
      <p className="text-[11px] text-ink-soft mt-1.5">{helpText}</p>
    </div>
  );
}
