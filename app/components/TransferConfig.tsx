'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

interface BankConfig {
  bank_name: string | null;
  bank_clabe: string | null;
  bank_holder: string | null;
  bank_active: boolean;
}

interface Transfer {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  transfer_proof_url: string | null;
  notes: string | null;
  created_at: string;
  lead: { name: string | null; phone: string } | null;
}

export default function TransferConfig() {
  const [config, setConfig] = useState<BankConfig | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [bankName, setBankName] = useState('');
  const [bankClabe, setBankClabe] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [editingBank, setEditingBank] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // New transfer form
  const [leads, setLeads] = useState<{ id: string; name: string | null; phone: string }[]>([]);
  const [selectedLead, setSelectedLead] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [viewProof, setViewProof] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/bank-config').then((r) => r.json()).then((data) => {
      setConfig(data);
      setBankName(data.bank_name || '');
      setBankClabe(data.bank_clabe || '');
      setBankHolder(data.bank_holder || '');
    }).catch(console.error);

    fetch('/api/transfers').then((r) => r.json()).then(setTransfers).catch(console.error);
    fetch('/api/leads').then((r) => r.json()).then(setLeads).catch(console.error);
  }, []);

  const saveBank = useCallback(async () => {
    setSaving(true);
    try {
      await fetch('/api/bank-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bank_name: bankName, bank_clabe: bankClabe, bank_holder: bankHolder }),
      });
      const updated = await fetch('/api/bank-config').then((r) => r.json());
      setConfig(updated);
      setEditingBank(false);
      setMessage('Datos bancarios guardados');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Error al guardar');
    }
    setSaving(false);
  }, [bankName, bankClabe, bankHolder]);

  const toggleActive = useCallback(async () => {
    setSaving(true);
    await fetch('/api/bank-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bank_active: !config?.bank_active }),
    });
    const updated = await fetch('/api/bank-config').then((r) => r.json());
    setConfig(updated);
    setSaving(false);
  }, [config]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setProofFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setProofPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setProofPreview(null);
    }
  };

  const registerTransfer = useCallback(async () => {
    if (!selectedLead || !amount) return;
    setRegistering(true);
    setMessage('');

    try {
      let proofUrl = null;

      if (proofFile) {
        const formData = new FormData();
        formData.append('file', proofFile);
        const uploadRes = await fetch('/api/transfer-upload', { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          proofUrl = uploadData.url;
        }
      }

      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: selectedLead,
          amount: Number(amount),
          notes: notes || null,
          transfer_proof_url: proofUrl,
        }),
      });

      if (!res.ok) throw new Error('Error al registrar');

      // Refresh
      const updated = await fetch('/api/transfers').then((r) => r.json());
      setTransfers(updated);
      setSelectedLead('');
      setAmount('');
      setNotes('');
      setProofFile(null);
      setProofPreview(null);
      setShowForm(false);
      setMessage('Transferencia registrada correctamente');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Error al registrar la transferencia');
    }
    setRegistering(false);
  }, [selectedLead, amount, notes, proofFile]);

  if (!config) {
    return (
      <div className="bg-paper-warm border border-line rounded-lg p-6 shadow-sm">
        <div className="text-ink-soft text-sm">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bank Config */}
      <div className="bg-paper-warm border border-line rounded-lg overflow-hidden shadow-sm">
        <div className="px-5 pt-4 pb-3 flex justify-between items-center border-b border-line flex-wrap gap-3">
          <div>
            <div className="font-serif text-[22px] font-medium tracking-tight">Transferencias bancarias</div>
            <div className="text-[11.5px] text-ink-soft mt-0.5">Datos bancarios y registro de pagos por transferencia</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-ink-soft uppercase tracking-wider font-semibold">
              {config.bank_active ? 'Activo' : 'Inactivo'}
            </span>
            <button
              className={`w-[38px] h-[22px] rounded-full relative transition-colors shrink-0 ${config.bank_active ? 'bg-accent' : 'bg-paper-deep'}`}
              onClick={toggleActive}
              role="switch"
              aria-checked={config.bank_active}
            >
              <span className={`absolute w-4 h-4 bg-paper rounded-full top-[3px] transition-[left] shadow ${config.bank_active ? 'left-[19px]' : 'left-[3px]'}`} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Bank details */}
          <div>
            <div className="text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-3">
              Datos bancarios para tus clientes
            </div>
            {editingBank ? (
              <div className="space-y-3">
                <input className="w-full p-3 bg-paper border border-line-strong rounded-md text-[13px] text-ink focus:outline-2 focus:outline-accent" placeholder="Nombre del banco (ej. BBVA)" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                <input className="w-full p-3 bg-paper border border-line-strong rounded-md text-[13px] text-ink focus:outline-2 focus:outline-accent font-mono" placeholder="CLABE interbancaria (18 dígitos)" value={bankClabe} onChange={(e) => setBankClabe(e.target.value)} maxLength={18} />
                <input className="w-full p-3 bg-paper border border-line-strong rounded-md text-[13px] text-ink focus:outline-2 focus:outline-accent" placeholder="Titular de la cuenta" value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} />
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-ink text-paper text-[12px] font-semibold rounded-md hover:bg-accent transition-colors disabled:opacity-50" onClick={saveBank} disabled={saving}>Guardar</button>
                  <button className="px-3 py-2 border border-line rounded-md text-[12px] text-ink-soft hover:text-ink transition-colors" onClick={() => setEditingBank(false)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="bg-paper border border-line rounded-md p-4">
                {config.bank_name ? (
                  <div className="space-y-1.5 text-[13px]">
                    <div><span className="text-ink-soft">Banco:</span> <strong>{config.bank_name}</strong></div>
                    <div><span className="text-ink-soft">CLABE:</span> <code className="font-mono bg-paper-deep px-2 py-0.5 rounded text-[12px]">{config.bank_clabe}</code></div>
                    <div><span className="text-ink-soft">Titular:</span> <strong>{config.bank_holder}</strong></div>
                  </div>
                ) : (
                  <p className="text-ink-soft text-sm">No hay datos bancarios configurados</p>
                )}
                <button className="mt-3 px-4 py-2 border border-line-strong rounded-md text-[12px] font-medium text-ink hover:bg-paper-deep transition-colors" onClick={() => setEditingBank(true)}>
                  {config.bank_name ? 'Editar' : 'Configurar'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Register transfer */}
      <div className="bg-paper-warm border border-line rounded-lg overflow-hidden shadow-sm">
        <div className="px-5 pt-4 pb-3 flex justify-between items-center border-b border-line">
          <div>
            <div className="font-serif text-[18px] font-medium tracking-tight">Registrar pago por transferencia</div>
          </div>
          <button
            className="px-4 py-2 bg-ink text-paper text-[12px] font-semibold rounded-md hover:bg-accent transition-colors"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancelar' : '+ Registrar pago'}
          </button>
        </div>

        {showForm && (
          <div className="p-5 space-y-4 border-b border-line">
            <div>
              <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-2">Paciente / Lead</label>
              <select
                className="w-full p-3 bg-paper border border-line-strong rounded-md text-[13px] text-ink focus:outline-2 focus:outline-accent"
                value={selectedLead}
                onChange={(e) => setSelectedLead(e.target.value)}
              >
                <option value="">Selecciona un paciente...</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>{l.name || 'Sin nombre'} — {l.phone}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-2">Monto (MXN)</label>
              <input
                type="number"
                className="w-full p-3 bg-paper border border-line-strong rounded-md text-[13px] text-ink focus:outline-2 focus:outline-accent font-mono"
                placeholder="1500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-2">Comprobante de transferencia</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-[13px] text-ink file:mr-3 file:px-4 file:py-2 file:rounded-md file:border file:border-line-strong file:bg-paper file:text-ink file:text-[12px] file:font-medium file:cursor-pointer hover:file:bg-paper-deep"
              />
              {proofPreview && (
                <div className="mt-3 relative w-48 h-48 rounded-md overflow-hidden border border-line">
                  <Image src={proofPreview} alt="Comprobante" fill className="object-contain" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-2">Notas (opcional)</label>
              <input
                type="text"
                className="w-full p-3 bg-paper border border-line-strong rounded-md text-[13px] text-ink focus:outline-2 focus:outline-accent"
                placeholder="Ej: Anticipo para consulta diagnóstico"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              className="px-6 py-3 bg-ink text-paper text-[13px] font-semibold rounded-md hover:bg-accent transition-colors disabled:opacity-50"
              onClick={registerTransfer}
              disabled={registering || !selectedLead || !amount}
            >
              {registering ? 'Registrando...' : 'Registrar pago'}
            </button>
          </div>
        )}

        {/* Transfer history */}
        <div className="p-5">
          <div className="text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-3">
            Historial de transferencias
          </div>
          {transfers.length === 0 ? (
            <p className="text-ink-soft text-sm">No hay transferencias registradas</p>
          ) : (
            <div className="space-y-2">
              {transfers.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-4 p-3 bg-paper border border-line rounded-md">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{t.lead?.name || 'Sin nombre'}</div>
                    <div className="text-[11px] text-ink-soft">{t.lead?.phone} · {new Date(t.created_at).toLocaleDateString('es-MX')}</div>
                    {t.notes && <div className="text-[11px] text-ink-soft mt-0.5 italic">{t.notes}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[14px] font-mono font-semibold">${t.amount.toLocaleString()}</div>
                    <span className={`text-[10px] uppercase tracking-wider font-semibold ${t.status === 'completed' ? 'text-accent' : 'text-ink-soft'}`}>
                      {t.status === 'completed' ? 'Pagado' : t.status}
                    </span>
                  </div>
                  {t.transfer_proof_url && (
                    <button
                      className="px-3 py-1.5 border border-line-strong rounded-md text-[11px] font-medium text-ink hover:bg-paper-deep transition-colors shrink-0"
                      onClick={() => setViewProof(t.transfer_proof_url)}
                    >
                      Ver comprobante
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Proof viewer modal */}
      {viewProof && (
        <div className="fixed inset-0 z-50 bg-ink/70 flex items-center justify-center p-4" onClick={() => setViewProof(null)}>
          <div className="bg-paper rounded-lg max-w-lg w-full max-h-[80vh] overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <div className="font-serif text-[18px] font-medium">Comprobante de transferencia</div>
              <button className="text-ink-soft hover:text-ink text-xl leading-none" onClick={() => setViewProof(null)}>×</button>
            </div>
            <div className="relative w-full aspect-square rounded-md overflow-hidden border border-line">
              <Image src={viewProof} alt="Comprobante" fill className="object-contain" />
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`text-[12px] font-medium px-3 py-2 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
