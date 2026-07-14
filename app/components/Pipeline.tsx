'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Lead, LeadStage, LeadHeat } from '@/lib/types';

interface PipelineColumn {
  stage: LeadStage;
  leads: Lead[];
  count: number;
}

const STAGES: LeadStage[] = ['nuevo', 'calificando', 'visto_sin_pagar', 'pago_enviado', 'pagado_agendado'];

const STAGE_LABELS: Record<LeadStage, string> = {
  nuevo: 'Nuevo lead',
  calificando: 'Calificando',
  visto_sin_pagar: 'Visto · sin pagar',
  pago_enviado: 'Pago enviado',
  pagado_agendado: 'Pagado · agendado',
};

const STAGE_COLORS: Record<LeadStage, string> = {
  nuevo: 'border-t-blue-400',
  calificando: 'border-t-yellow-400',
  visto_sin_pagar: 'border-t-orange-400',
  pago_enviado: 'border-t-purple-400',
  pagado_agendado: 'border-t-green-500',
};

const HEAT_STYLES: Record<string, string> = {
  hot: 'bg-accent shadow-[0_0_0_2px_rgba(200,85,61,0.22)]',
  warm: 'bg-gold',
  cold: 'bg-ink-soft opacity-40',
};

const HEAT_LABELS: Record<LeadHeat, string> = {
  hot: 'Caliente',
  warm: 'Tibio',
  cold: 'Frío',
};

const SOURCE_MAP: Record<string, string> = {
  instagram: 'IG',
  facebook: 'FB Ads',
  whatsapp: 'WA',
  web: 'Web',
  tiktok: 'TikTok',
};

export default function Pipeline() {
  const [pipeline, setPipeline] = useState<PipelineColumn[]>([]);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStage | null>(null);
  const [updating, setUpdating] = useState(false);
  const dragCounter = useRef<Record<string, number>>({});

  const loadPipeline = useCallback(() => {
    fetch('/api/leads?grouped=stage')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPipeline(data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => { loadPipeline(); }, [loadPipeline]);

  const updateLead = useCallback(async (id: string, updates: Record<string, unknown>) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPipeline(prev => {
          const newPipeline = prev.map(col => ({
            ...col,
            leads: col.leads.filter(l => l.id !== id),
            count: col.leads.filter(l => l.id !== id).length,
          }));
          const targetStage = (updates.stage as LeadStage) || selected?.stage;
          return newPipeline.map(col => {
            if (col.stage === targetStage) {
              const updatedLeads = [...col.leads, updated];
              return { ...col, leads: updatedLeads, count: updatedLeads.length };
            }
            return col;
          });
        });
        if (selected?.id === id) {
          setSelected(updated);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setUpdating(false);
  }, [selected]);

  const moveLeadToStage = useCallback(async (lead: Lead, newStage: LeadStage) => {
    if (lead.stage === newStage) return;

    setPipeline(prev => prev.map(col => {
      if (col.stage === lead.stage) {
        const filtered = col.leads.filter(l => l.id !== lead.id);
        return { ...col, leads: filtered, count: filtered.length };
      }
      if (col.stage === newStage) {
        const moved = { ...lead, stage: newStage };
        return { ...col, leads: [...col.leads, moved], count: col.count + 1 };
      }
      return col;
    }));

    if (selected?.id === lead.id) {
      setSelected({ ...lead, stage: newStage });
    }

    await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lead.id, stage: newStage }),
    });
  }, [selected]);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', lead.id);
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = '0.4';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = '1';
    setDraggedLead(null);
    setDragOverStage(null);
    dragCounter.current = {};
  };

  const handleDragEnter = (e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    dragCounter.current[stage] = (dragCounter.current[stage] || 0) + 1;
    setDragOverStage(stage);
  };

  const handleDragLeave = (_e: React.DragEvent, stage: LeadStage) => {
    dragCounter.current[stage] = (dragCounter.current[stage] || 0) - 1;
    if (dragCounter.current[stage] <= 0) {
      dragCounter.current[stage] = 0;
      if (dragOverStage === stage) setDragOverStage(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    setDragOverStage(null);
    dragCounter.current = {};
    if (draggedLead) {
      moveLeadToStage(draggedLead, stage);
    }
    setDraggedLead(null);
  };

  const totalLeads = pipeline.reduce((sum, col) => sum + col.count, 0);

  return (
    <section className="bg-paper-warm border border-line rounded-lg overflow-hidden shadow-sm mb-9" style={{ animation: 'fadeUp .5s ease-out backwards .35s' }}>
      <div className="px-5 pt-4 pb-3 flex justify-between items-end gap-4 border-b border-line flex-wrap">
        <div>
          <div className="font-serif text-[22px] font-medium tracking-tight">Pipeline de pacientes</div>
          <div className="text-[11.5px] text-ink-soft mt-0.5">{totalLeads} conversaciones activas · Arrastra las tarjetas para mover leads</div>
        </div>
      </div>

      <div className="grid grid-cols-5 max-lg:grid-cols-[repeat(5,minmax(220px,1fr))] max-lg:overflow-x-auto gap-3 p-4">
        {pipeline.map((col) => (
          <div
            key={col.stage}
            className={`bg-paper border border-line rounded-md p-3 min-h-[380px] border-t-[3px] transition-colors ${STAGE_COLORS[col.stage]} ${
              dragOverStage === col.stage && draggedLead?.stage !== col.stage
                ? 'bg-blue-50/60 border-blue-300'
                : ''
            }`}
            onDragEnter={(e) => handleDragEnter(e, col.stage)}
            onDragLeave={(e) => handleDragLeave(e, col.stage)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.stage)}
          >
            <div className="flex justify-between items-center pb-2.5 mb-2.5 border-b border-dashed border-line-strong">
              <span className="text-[10.5px] tracking-[0.14em] uppercase font-semibold">
                {STAGE_LABELS[col.stage]}
              </span>
              <span className="font-mono text-[10.5px] text-ink-soft bg-paper-deep px-1.5 py-0.5 rounded">
                {col.count}
              </span>
            </div>

            {col.leads.map((lead) => (
              <div
                key={lead.id}
                draggable
                onDragStart={(e) => handleDragStart(e, lead)}
                onDragEnd={handleDragEnd}
                onClick={() => setSelected(lead)}
                className={`w-full text-left bg-paper-warm border border-line rounded p-2.5 mb-2 cursor-grab active:cursor-grabbing transition-all hover:border-ink hover:-translate-y-0.5 hover:shadow-md ${
                  col.stage === 'pagado_agendado' ? 'border-l-[3px] border-l-accent' : ''
                } ${selected?.id === lead.id ? 'ring-2 ring-accent/40' : ''}`}
              >
                <div className="text-[12.5px] font-semibold mb-1 flex justify-between items-center gap-2">
                  <span className="truncate">{lead.name || lead.phone}</span>
                  <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${HEAT_STYLES[lead.heat]}`} aria-label={`Lead ${lead.heat}`} />
                </div>
                <div className="text-[11px] text-ink-soft mb-1.5">{lead.service_interest || '—'}</div>
                <div className="flex justify-between items-center text-[10.5px] text-ink-soft font-mono">
                  <span>{SOURCE_MAP[lead.source] || lead.source}</span>
                  <span className="text-ink font-semibold">
                    {lead.potential_amount > 0 ? `$${lead.potential_amount.toLocaleString()}` : '—'}
                  </span>
                </div>
              </div>
            ))}

            {col.leads.length === 0 && (
              <div className={`text-center text-[11px] text-ink-soft py-8 border-2 border-dashed border-line rounded-md ${
                dragOverStage === col.stage ? 'border-blue-300 bg-blue-50/40' : ''
              }`}>
                {dragOverStage === col.stage ? 'Soltar aquí' : 'Sin leads'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="border-t border-line bg-paper p-5">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div>
              <div className="font-serif text-[18px] font-medium">{selected.name || selected.phone}</div>
              <div className="text-[11px] text-ink-soft mt-0.5">
                {selected.phone} · {SOURCE_MAP[selected.source] || selected.source} · Creado {new Date(selected.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <button className="text-ink-soft hover:text-ink text-lg px-2" onClick={() => setSelected(null)}>×</button>
          </div>

          <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4 mb-5">
            {selected.name && (
              <div className="bg-paper-warm border border-line rounded-md p-3">
                <div className="text-[10px] uppercase tracking-wider text-ink-soft font-semibold">Nombre</div>
                <div className="text-[13px] mt-1">{selected.name}</div>
              </div>
            )}
            <div className="bg-paper-warm border border-line rounded-md p-3">
              <div className="text-[10px] uppercase tracking-wider text-ink-soft font-semibold">Teléfono</div>
              <div className="text-[13px] font-mono mt-1">{selected.phone}</div>
            </div>
            {selected.service_interest && (
              <div className="bg-paper-warm border border-line rounded-md p-3">
                <div className="text-[10px] uppercase tracking-wider text-ink-soft font-semibold">Servicio de interés</div>
                <div className="text-[13px] mt-1">{selected.service_interest}</div>
              </div>
            )}
            <div className="bg-paper-warm border border-line rounded-md p-3">
              <div className="text-[10px] uppercase tracking-wider text-ink-soft font-semibold">Monto potencial</div>
              <div className="text-[13px] font-semibold mt-1">
                {selected.potential_amount > 0 ? `$${selected.potential_amount.toLocaleString()}` : '—'}
              </div>
            </div>
          </div>

          {/* Stage selector */}
          <div className="mb-4">
            <div className="text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-2">Mover a etapa</div>
            <div className="flex gap-1.5 flex-wrap">
              {STAGES.map(st => (
                <button
                  key={st}
                  disabled={updating}
                  className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors ${
                    selected.stage === st
                      ? 'bg-ink text-paper'
                      : 'border border-line text-ink-soft hover:text-ink hover:border-ink'
                  } disabled:opacity-50`}
                  onClick={() => moveLeadToStage(selected, st)}
                >
                  {STAGE_LABELS[st]}
                </button>
              ))}
            </div>
          </div>

          {/* Heat selector */}
          <div className="mb-4">
            <div className="text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-2">Temperatura del lead</div>
            <div className="flex gap-1.5">
              {(['hot', 'warm', 'cold'] as LeadHeat[]).map(h => (
                <button
                  key={h}
                  disabled={updating}
                  className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                    selected.heat === h
                      ? 'bg-ink text-paper'
                      : 'border border-line text-ink-soft hover:text-ink hover:border-ink'
                  } disabled:opacity-50`}
                  onClick={() => updateLead(selected.id, { heat: h })}
                >
                  <span className={`w-[7px] h-[7px] rounded-full ${HEAT_STYLES[h]}`} />
                  {HEAT_LABELS[h]}
                </button>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 pt-3 border-t border-line">
            {selected.phone && (
              <a
                href={`https://wa.me/${selected.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 text-white text-[11px] font-semibold rounded-md hover:bg-green-700 transition-colors"
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
