'use client';

import { useEffect, useState } from 'react';
import type { Metrics } from '@/lib/types';

const BAR_CLASSES = ['bg-gradient-to-r from-ink to-ink-soft', 'bg-gradient-to-r from-ink-soft to-moss', 'bg-gradient-to-r from-moss to-gold', 'bg-gradient-to-r from-gold to-accent', 'bg-gradient-to-r from-accent to-accent-deep'];
const STAGE_LABELS = ['Contactaron por WhatsApp', 'Respondieron al agente', 'Precalificados', 'Recibieron link de pago', 'Pagaron y agendaron'];

export default function Funnel() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetch('/api/metrics')
      .then((r) => r.json())
      .then(setMetrics)
      .catch(console.error);
  }, []);

  const funnel = metrics?.funnel || [
    { stage: 'nuevo', count: 284, pct: 100 },
    { stage: 'calificando', count: 238, pct: 83.8 },
    { stage: 'visto_sin_pagar', count: 194, pct: 68.3 },
    { stage: 'pago_enviado', count: 147, pct: 51.8 },
    { stage: 'pagado_agendado', count: 108, pct: 38.0 },
  ];

  const maxCount = funnel[0]?.count || 1;

  return (
    <div className="bg-paper-warm border border-line rounded-lg overflow-hidden shadow-sm" style={{ animation: 'fadeUp .5s ease-out backwards .3s' }}>
      <div className="px-5 pt-4 pb-3 flex justify-between items-end gap-4 border-b border-line flex-wrap">
        <div>
          <div className="font-serif text-[22px] font-medium tracking-tight">Embudo de conversión</div>
          <div className="text-[11.5px] text-ink-soft mt-0.5">Cómo se mueven tus leads de WhatsApp hasta el sillón</div>
        </div>
        <div className="flex gap-1 bg-paper-deep p-0.5 rounded-md" role="tablist">
          {['7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              className={`px-3 py-1 text-[11.5px] rounded font-medium transition-colors ${period === p ? 'bg-paper text-ink shadow-sm' : 'text-ink-soft hover:text-ink'}`}
              onClick={() => setPeriod(p)}
              role="tab"
              aria-selected={period === p}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        <ol className="flex flex-col gap-1">
          {funnel.map((stage, i) => {
            const widthPct = Math.max(20, (stage.count / maxCount) * 100);
            return (
              <li key={stage.stage} className="grid grid-cols-[28px_1fr_100px] items-center gap-3.5 py-2">
                <div className="font-mono text-[10px] text-ink-soft border border-line-strong w-6 h-6 rounded-full grid place-items-center font-medium">
                  {i + 1}
                </div>
                <div>
                  <div
                    className={`h-[38px] rounded flex items-center px-3.5 text-paper text-[13px] font-medium ${BAR_CLASSES[i]}`}
                    style={{
                      width: `${widthPct}%`,
                      animation: `drawBar 0.8s cubic-bezier(0.4,0,0.2,1) backwards ${0.35 + i * 0.1}s`,
                    }}
                  >
                    {STAGE_LABELS[i]}
                  </div>
                </div>
                <div className="text-right min-w-[90px]">
                  <div className="font-serif text-[22px] font-medium leading-none">{stage.count}</div>
                  <div className="font-mono text-[10.5px] text-ink-soft mt-1">{stage.pct}%</div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
