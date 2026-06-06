'use client';

import { useEffect, useState } from 'react';
import type { Lead, LeadStage } from '@/lib/types';

interface PipelineColumn {
  stage: LeadStage;
  leads: Lead[];
  count: number;
}

const STAGE_LABELS: Record<LeadStage, string> = {
  nuevo: 'Nuevo lead',
  calificando: 'Calificando',
  visto_sin_pagar: 'Visto · sin pagar',
  pago_enviado: 'Pago enviado',
  pagado_agendado: 'Pagado · agendado',
};

const HEAT_STYLES: Record<string, string> = {
  hot: 'bg-accent shadow-[0_0_0_2px_rgba(200,85,61,0.22)]',
  warm: 'bg-gold',
  cold: 'bg-ink-soft opacity-40',
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
  const [filter, setFilter] = useState('Todos');

  useEffect(() => {
    fetch('/api/leads?grouped=stage')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPipeline(data);
      })
      .catch(console.error);
  }, []);

  const totalLeads = pipeline.reduce((sum, col) => sum + col.count, 0);

  return (
    <section className="bg-paper-warm border border-line rounded-lg overflow-hidden shadow-sm mb-9" style={{ animation: 'fadeUp .5s ease-out backwards .35s' }}>
      <div className="px-5 pt-4 pb-3 flex justify-between items-end gap-4 border-b border-line flex-wrap">
        <div>
          <div className="font-serif text-[22px] font-medium tracking-tight">Pipeline de pacientes</div>
          <div className="text-[11.5px] text-ink-soft mt-0.5">{totalLeads} conversaciones activas</div>
        </div>
        <div className="flex gap-1 bg-paper-deep p-0.5 rounded-md" role="tablist">
          {['Todos', 'Estética', 'Dental', 'Nutrición'].map((tab) => (
            <button
              key={tab}
              className={`px-3 py-1 text-[11.5px] rounded font-medium transition-colors ${filter === tab ? 'bg-paper text-ink shadow-sm' : 'text-ink-soft hover:text-ink'}`}
              onClick={() => setFilter(tab)}
              role="tab"
              aria-selected={filter === tab}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5 max-lg:grid-cols-[repeat(5,minmax(220px,1fr))] max-lg:overflow-x-auto gap-3 p-4">
        {pipeline.map((col) => (
          <div key={col.stage} className="bg-paper border border-line rounded-md p-3 min-h-[380px]">
            <div className="flex justify-between items-center pb-2.5 mb-2.5 border-b border-dashed border-line-strong">
              <span className="text-[10.5px] tracking-[0.14em] uppercase font-semibold">
                {STAGE_LABELS[col.stage]}
              </span>
              <span className="font-mono text-[10.5px] text-ink-soft bg-paper-deep px-1.5 py-0.5 rounded">
                {col.count}
              </span>
            </div>

            {col.leads.map((lead) => (
              <button
                key={lead.id}
                className={`w-full text-left bg-paper-warm border border-line rounded p-2.5 mb-2 cursor-pointer transition-all hover:border-ink hover:-translate-y-0.5 hover:shadow-md ${col.stage === 'pagado_agendado' ? 'border-l-[3px] border-l-accent' : ''}`}
              >
                <div className="text-[12.5px] font-semibold mb-1 flex justify-between items-center gap-2">
                  {lead.name || lead.phone}
                  <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${HEAT_STYLES[lead.heat]}`} aria-label={`Lead ${lead.heat}`} />
                </div>
                <div className="text-[11px] text-ink-soft mb-1.5">{lead.service_interest || '—'}</div>
                <div className="flex justify-between items-center text-[10.5px] text-ink-soft font-mono">
                  <span>{SOURCE_MAP[lead.source] || lead.source}</span>
                  <span className="text-ink font-semibold">
                    {lead.potential_amount > 0 ? `$${lead.potential_amount.toLocaleString()}` : '—'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
