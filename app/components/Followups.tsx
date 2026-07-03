'use client';

import { useEffect, useState, useCallback } from 'react';

interface Followup {
  id: string;
  data: Record<string, string>;
  status: string;
  created_at: string;
  lead: { name: string | null; phone: string; stage: string; heat: string } | null;
}

export default function Followups() {
  const [items, setItems] = useState<Followup[]>([]);

  const load = useCallback(() => {
    fetch('/api/followups').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setItems(data);
    }).catch(console.error);
  }, []);

  useEffect(() => { load(); }, [load]);

  const markContacted = useCallback(async (id: string) => {
    await fetch('/api/form-submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'contacted' }),
    });
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const timeSince = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 60) return `hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="bg-paper-warm border border-line rounded-lg overflow-hidden shadow-sm">
      <div className="px-5 pt-4 pb-3 flex justify-between items-center border-b border-line">
        <div>
          <div className="font-serif text-[22px] font-medium tracking-tight">
            Seguimiento
            {items.length > 0 && (
              <span className="ml-2 bg-red-500 text-paper text-[10px] px-2 py-0.5 rounded-full font-sans font-semibold">
                {items.length}
              </span>
            )}
          </div>
          <div className="text-[11.5px] text-ink-soft mt-0.5">
            Prospectos que completaron el formulario pero NO agendaron su llamada
          </div>
        </div>
        <button
          className="px-3 py-1.5 border border-line-strong rounded-md text-[11px] font-medium text-ink-soft hover:text-ink transition-colors"
          onClick={load}
        >
          Actualizar
        </button>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center text-ink-soft text-sm">
          No hay prospectos pendientes de seguimiento
        </div>
      ) : (
        <div className="divide-y divide-line max-h-[500px] overflow-y-auto">
          {items.map(item => (
            <div key={item.id} className="px-5 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold">{item.data.nombre || 'Sin nombre'}</span>
                  <span className="text-[10px] text-red-500 font-semibold bg-red-50 px-2 py-0.5 rounded">
                    Sin agendar · {timeSince(item.created_at)}
                  </span>
                </div>
                <div className="text-[11px] text-ink-soft mt-1 flex gap-3 flex-wrap">
                  {item.data.whatsapp && (
                    <a
                      href={`https://wa.me/${item.data.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener"
                      className="text-accent hover:underline font-medium"
                    >
                      WhatsApp: {item.data.whatsapp}
                    </a>
                  )}
                  {item.data.email && <span>{item.data.email}</span>}
                  {item.data.ciudad && <span>{item.data.ciudad}</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {item.data.whatsapp && (
                  <a
                    href={`https://wa.me/${item.data.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hola ' + (item.data.nombre?.split(' ')[0] || '') + ', soy del equipo de la Dra. Estela Durán. Vi que completaste tu diagnóstico pero no alcanzaste a agendar tu llamada estratégica. ¿Te gustaría que te ayude a encontrar un horario?')}`}
                    target="_blank"
                    rel="noopener"
                    className="px-3 py-1.5 bg-accent text-paper text-[11px] font-semibold rounded-md hover:bg-accent/85 transition-colors"
                  >
                    Enviar WhatsApp
                  </a>
                )}
                <button
                  className="px-3 py-1.5 border border-line-strong rounded-md text-[11px] font-medium text-ink-soft hover:text-ink transition-colors"
                  onClick={() => markContacted(item.id)}
                >
                  Marcar contactado
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
