'use client';

import { useEffect, useState, useCallback } from 'react';

interface Submission {
  id: string;
  form_name: string;
  data: Record<string, string>;
  status: string;
  utm_source: string | null;
  utm_campaign: string | null;
  created_at: string;
  lead: { name: string | null; phone: string; stage: string; heat: string } | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: 'Nuevo', color: 'bg-blue-100 text-blue-700' },
  reviewed: { label: 'Revisado', color: 'bg-yellow-100 text-yellow-700' },
  contacted: { label: 'Contactado', color: 'bg-purple-100 text-purple-700' },
  booked: { label: 'Agendado', color: 'bg-green-100 text-green-700' },
  closed: { label: 'Cerrado', color: 'bg-gray-100 text-gray-500' },
};

export default function FormSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/form-submissions').then(r => r.json()).then(setSubmissions).catch(console.error);
  }, []);

  const updateStatus = useCallback(async (id: string, status: string) => {
    await fetch('/api/form-submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  }, [selected]);

  const filtered = filter === 'all' ? submissions : submissions.filter(s => s.status === filter);

  return (
    <div className="space-y-6">
      {/* Header + Filter */}
      <div className="bg-paper-warm border border-line rounded-lg overflow-hidden shadow-sm">
        <div className="px-5 pt-4 pb-3 flex justify-between items-center border-b border-line flex-wrap gap-3">
          <div>
            <div className="font-serif text-[22px] font-medium tracking-tight">Respuestas de formulario</div>
            <div className="text-[11.5px] text-ink-soft mt-0.5">Diagnósticos recibidos desde la landing page</div>
          </div>
          <div className="flex gap-1.5">
            {['all', 'new', 'reviewed', 'contacted', 'booked'].map(f => (
              <button
                key={f}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors ${filter === f ? 'bg-ink text-paper' : 'bg-paper border border-line text-ink-soft hover:text-ink'}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'Todos' : STATUS_LABELS[f]?.label}
                {f === 'new' && submissions.filter(s => s.status === 'new').length > 0 && (
                  <span className="ml-1 bg-accent text-paper text-[9px] px-1.5 py-0.5 rounded-full">
                    {submissions.filter(s => s.status === 'new').length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-line max-h-[500px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-ink-soft text-sm">No hay respuestas todavía</div>
          ) : filtered.map(s => (
            <button
              key={s.id}
              className={`w-full text-left px-5 py-4 hover:bg-paper-deep/50 transition-colors ${selected?.id === s.id ? 'bg-paper-deep/70' : ''}`}
              onClick={() => setSelected(s)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium truncate">
                    {s.data.nombre || 'Sin nombre'}
                  </div>
                  <div className="text-[11px] text-ink-soft mt-0.5">
                    {s.data.whatsapp || s.data.email || '—'} · {new Date(s.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {s.utm_source && (
                    <span className="text-[10px] text-ink-soft bg-paper border border-line px-2 py-0.5 rounded">{s.utm_source}</span>
                  )}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${STATUS_LABELS[s.status]?.color || 'bg-gray-100'}`}>
                    {STATUS_LABELS[s.status]?.label || s.status}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="bg-paper-warm border border-line rounded-lg overflow-hidden shadow-sm">
          <div className="px-5 pt-4 pb-3 flex justify-between items-center border-b border-line">
            <div className="font-serif text-[18px] font-medium">
              {selected.data.nombre || 'Sin nombre'}
            </div>
            <button className="text-ink-soft hover:text-ink text-lg" onClick={() => setSelected(null)}>×</button>
          </div>
          <div className="p-5 space-y-4">
            {/* Contact info */}
            <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-3">
              {selected.data.whatsapp && (
                <div className="bg-paper border border-line rounded-md p-3">
                  <div className="text-[10px] uppercase tracking-wider text-ink-soft font-semibold">WhatsApp</div>
                  <div className="text-[13px] font-mono mt-1">{selected.data.whatsapp}</div>
                </div>
              )}
              {selected.data.email && (
                <div className="bg-paper border border-line rounded-md p-3">
                  <div className="text-[10px] uppercase tracking-wider text-ink-soft font-semibold">Email</div>
                  <div className="text-[13px] mt-1">{selected.data.email}</div>
                </div>
              )}
              {selected.data.ciudad && (
                <div className="bg-paper border border-line rounded-md p-3">
                  <div className="text-[10px] uppercase tracking-wider text-ink-soft font-semibold">Ciudad</div>
                  <div className="text-[13px] mt-1">{selected.data.ciudad}</div>
                </div>
              )}
            </div>

            {/* All form answers */}
            <div>
              <div className="text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-2">Respuestas</div>
              <div className="space-y-2">
                {Object.entries(selected.data)
                  .filter(([k]) => !['nombre', 'email', 'whatsapp', 'ciudad'].includes(k))
                  .map(([key, value]) => (
                    <div key={key} className="bg-paper border border-line rounded-md p-3">
                      <div className="text-[10px] uppercase tracking-wider text-ink-soft font-semibold">{key.replace(/_/g, ' ')}</div>
                      <div className="text-[13px] mt-1 text-ink-soft">{value || '—'}</div>
                    </div>
                  ))}
              </div>
            </div>

            {/* UTM */}
            {(selected.utm_source || selected.utm_campaign) && (
              <div className="flex gap-2 flex-wrap">
                {selected.utm_source && <span className="text-[10px] bg-paper-deep px-2 py-1 rounded">source: {selected.utm_source}</span>}
                {selected.utm_campaign && <span className="text-[10px] bg-paper-deep px-2 py-1 rounded">campaign: {selected.utm_campaign}</span>}
              </div>
            )}

            {/* Status actions */}
            <div className="flex gap-2 flex-wrap pt-2 border-t border-line">
              {['new', 'reviewed', 'contacted', 'booked', 'closed'].map(st => (
                <button
                  key={st}
                  className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors ${selected.status === st ? 'bg-ink text-paper' : 'border border-line text-ink-soft hover:text-ink hover:border-ink'}`}
                  onClick={() => updateStatus(selected.id, st)}
                >
                  {STATUS_LABELS[st]?.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
