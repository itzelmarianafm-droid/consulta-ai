'use client';

import { useEffect, useState, useCallback } from 'react';

interface Clinic {
  id: string;
  name: string;
  slug: string;
  plan_status: string;
  trial_days: number;
  trial_remaining: number | null;
  plan_price: number;
  plan_currency: string;
  plan_payment_method: string;
  owner_email: string;
  user_count: number;
  stripe_active: boolean;
  paypal_active: boolean;
  bank_active: boolean;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  trial: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-600',
  suspended: 'bg-gray-100 text-gray-500',
};

const PAYMENT_METHODS = [
  { value: 'stripe', label: 'Stripe' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'hotmart', label: 'Hotmart' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'free', label: 'Gratis' },
];

export default function AdminPanel() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  // Create form
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [trialDays, setTrialDays] = useState('14');
  const [planStatus, setPlanStatus] = useState('trial');
  const [planPrice, setPlanPrice] = useState('0');
  const [planCurrency, setPlanCurrency] = useState('usd');
  const [planPaymentMethod, setPlanPaymentMethod] = useState('stripe');
  const [creating, setCreating] = useState(false);

  const loadClinics = useCallback(() => {
    fetch('/api/admin/clinics').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setClinics(data);
    }).catch(console.error);
  }, []);

  useEffect(() => { loadClinics(); }, [loadClinics]);

  const createClinic = useCallback(async () => {
    if (!name || !slug || !ownerEmail || !ownerPassword) return;
    setCreating(true);
    setMessage('');

    const res = await fetch('/api/admin/clinics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, slug, owner_email: ownerEmail, owner_password: ownerPassword,
        trial_days: Number(trialDays), plan_status: planStatus,
        plan_price: Number(planPrice), plan_currency: planCurrency,
        plan_payment_method: planPaymentMethod,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(`Clínica "${name}" creada exitosamente`);
      setShowCreate(false);
      setName(''); setSlug(''); setOwnerEmail(''); setOwnerPassword('');
      setTrialDays('14'); setPlanStatus('trial'); setPlanPrice('0');
      loadClinics();
    } else {
      setMessage(`Error: ${data.error}`);
    }
    setCreating(false);
    setTimeout(() => setMessage(''), 5000);
  }, [name, slug, ownerEmail, ownerPassword, trialDays, planStatus, planPrice, planCurrency, planPaymentMethod, loadClinics]);

  const updateClinic = useCallback(async (id: string, updates: Record<string, unknown>) => {
    await fetch('/api/admin/clinics', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    loadClinics();
    setEditing(null);
  }, [loadClinics]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-paper-warm border border-line rounded-lg overflow-hidden shadow-sm">
        <div className="px-5 pt-4 pb-3 flex justify-between items-center border-b border-line flex-wrap gap-3">
          <div>
            <div className="font-serif text-[22px] font-medium tracking-tight">Panel de Administración</div>
            <div className="text-[11.5px] text-ink-soft mt-0.5">{clinics.length} clínica{clinics.length !== 1 ? 's' : ''} registrada{clinics.length !== 1 ? 's' : ''}</div>
          </div>
          <button
            className="px-4 py-2 bg-ink text-paper text-[12px] font-semibold rounded-md hover:bg-accent transition-colors"
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? 'Cancelar' : '+ Nueva clínica'}
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="p-5 border-b border-line bg-paper space-y-4">
            <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
              <div>
                <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-1">Nombre de la clínica</label>
                <input className="w-full p-3 bg-paper-warm border border-line-strong rounded-md text-[13px]" placeholder="Clínica Ejemplo" value={name} onChange={e => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')); }} />
              </div>
              <div>
                <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-1">Slug (URL)</label>
                <input className="w-full p-3 bg-paper-warm border border-line-strong rounded-md text-[13px] font-mono" placeholder="clinica-ejemplo" value={slug} onChange={e => setSlug(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-1">Email del doctor (login)</label>
                <input type="email" className="w-full p-3 bg-paper-warm border border-line-strong rounded-md text-[13px]" placeholder="doctor@email.com" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-1">Contraseña inicial</label>
                <input type="text" className="w-full p-3 bg-paper-warm border border-line-strong rounded-md text-[13px] font-mono" placeholder="Mínimo 6 caracteres" value={ownerPassword} onChange={e => setOwnerPassword(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-4 max-sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-1">Estado</label>
                <select className="w-full p-3 bg-paper-warm border border-line-strong rounded-md text-[13px]" value={planStatus} onChange={e => setPlanStatus(e.target.value)}>
                  <option value="trial">Trial</option>
                  <option value="active">Activo (pago)</option>
                  <option value="free">Gratis</option>
                </select>
              </div>
              <div>
                <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-1">Días de trial</label>
                <input type="number" className="w-full p-3 bg-paper-warm border border-line-strong rounded-md text-[13px]" value={trialDays} onChange={e => setTrialDays(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-1">Precio mensual</label>
                <input type="number" className="w-full p-3 bg-paper-warm border border-line-strong rounded-md text-[13px]" value={planPrice} onChange={e => setPlanPrice(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-1">Método de cobro</label>
                <select className="w-full p-3 bg-paper-warm border border-line-strong rounded-md text-[13px]" value={planPaymentMethod} onChange={e => setPlanPaymentMethod(e.target.value)}>
                  {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>

            <button
              className="px-6 py-3 bg-ink text-paper text-[13px] font-semibold rounded-md hover:bg-accent transition-colors disabled:opacity-50"
              onClick={createClinic}
              disabled={creating || !name || !slug || !ownerEmail || !ownerPassword}
            >
              {creating ? 'Creando...' : 'Crear clínica'}
            </button>
          </div>
        )}

        {/* Clinics list */}
        <div className="divide-y divide-line">
          {clinics.map(c => (
            <div key={c.id} className="px-5 py-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold">{c.name}</div>
                  <div className="text-[11px] text-ink-soft mt-0.5">
                    {c.owner_email || 'Sin email'} · {c.user_count} usuario{c.user_count !== 1 ? 's' : ''} · Desde {new Date(c.created_at).toLocaleDateString('es-MX')}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.stripe_active && <span className="text-[9px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded font-semibold">Stripe</span>}
                  {c.paypal_active && <span className="text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-semibold">PayPal</span>}
                  {c.bank_active && <span className="text-[9px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-semibold">Transfer</span>}
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded ${STATUS_COLORS[c.plan_status] || 'bg-gray-100'}`}>
                    {c.plan_status === 'trial' && c.trial_remaining !== null
                      ? `Trial · ${c.trial_remaining}d`
                      : c.plan_status.charAt(0).toUpperCase() + c.plan_status.slice(1)}
                  </span>
                  <button
                    className="px-3 py-1.5 border border-line-strong rounded-md text-[11px] font-medium hover:bg-paper-deep transition-colors"
                    onClick={() => setEditing(editing === c.id ? null : c.id)}
                  >
                    {editing === c.id ? 'Cerrar' : 'Editar'}
                  </button>
                </div>
              </div>

              {/* Edit panel */}
              {editing === c.id && (
                <div className="mt-4 pt-4 border-t border-line space-y-3">
                  <div className="grid grid-cols-4 max-sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-ink-soft font-semibold mb-1">Estado</label>
                      <select
                        className="w-full p-2.5 bg-paper border border-line-strong rounded-md text-[12px]"
                        defaultValue={c.plan_status}
                        onChange={e => updateClinic(c.id, { plan_status: e.target.value })}
                      >
                        <option value="trial">Trial</option>
                        <option value="active">Activo</option>
                        <option value="expired">Expirado</option>
                        <option value="suspended">Suspendido</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-ink-soft font-semibold mb-1">Días trial</label>
                      <input
                        type="number"
                        className="w-full p-2.5 bg-paper border border-line-strong rounded-md text-[12px]"
                        defaultValue={c.trial_days}
                        onBlur={e => updateClinic(c.id, { trial_days: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-ink-soft font-semibold mb-1">Precio</label>
                      <input
                        type="number"
                        className="w-full p-2.5 bg-paper border border-line-strong rounded-md text-[12px]"
                        defaultValue={c.plan_price}
                        onBlur={e => updateClinic(c.id, { plan_price: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-ink-soft font-semibold mb-1">Cobro</label>
                      <select
                        className="w-full p-2.5 bg-paper border border-line-strong rounded-md text-[12px]"
                        defaultValue={c.plan_payment_method}
                        onChange={e => updateClinic(c.id, { plan_payment_method: e.target.value })}
                      >
                        {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="text-[10px] text-ink-soft font-mono">ID: {c.id}</div>
                </div>
              )}
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
