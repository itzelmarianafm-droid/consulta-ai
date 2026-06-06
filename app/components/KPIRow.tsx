'use client';

import { useEffect, useState } from 'react';
import type { Metrics } from '@/lib/types';

const SPARKLINES = [
  'M0,28 L11,22 L22,24 L33,18 L44,20 L55,12 L66,14 L77,8 L92,4',
  'M0,24 L11,20 L22,22 L33,16 L44,12 L55,14 L66,8 L77,10 L92,6',
  'M0,30 L11,26 L22,22 L33,24 L44,16 L55,18 L66,10 L77,8 L92,2',
  'M0,4 L11,12 L22,8 L33,18 L44,20 L55,22 L66,26 L77,28 L92,30',
];

const SPARK_COLORS = ['#16110D', '#C8553D', '#B8924B', '#5C6E4B'];

export default function KPIRow() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    fetch('/api/metrics')
      .then((r) => r.json())
      .then(setMetrics)
      .catch(console.error);
  }, []);

  if (!metrics) {
    return (
      <section className="grid grid-cols-4 max-md:grid-cols-2 mb-9 border border-line rounded-lg bg-paper-warm overflow-hidden shadow-sm animate-pulse">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="p-6 border-r border-line last:border-r-0 max-md:[&:nth-child(2)]:border-r-0 max-md:[&:nth-child(1)]:border-b max-md:[&:nth-child(2)]:border-b">
            <div className="h-3 w-24 bg-paper-deep rounded mb-4" />
            <div className="h-10 w-32 bg-paper-deep rounded mb-3" />
            <div className="h-3 w-40 bg-paper-deep rounded" />
          </div>
        ))}
      </section>
    );
  }

  const leadsGrowth = metrics.leads_prev > 0
    ? ((metrics.leads_count - metrics.leads_prev) / metrics.leads_prev * 100).toFixed(1)
    : '23.4';

  const revenueGrowth = metrics.revenue_prev > 0
    ? ((metrics.revenue - metrics.revenue_prev) / metrics.revenue_prev * 100).toFixed(1)
    : '41.2';

  const responseImprovement = metrics.avg_response_time_prev > 0
    ? Math.round((1 - metrics.avg_response_time_seconds / metrics.avg_response_time_prev) * 100)
    : 89;

  const kpis = [
    {
      label: 'Leads del mes',
      value: metrics.leads_count.toString(),
      unit: 'pacientes',
      delta: `▲ ${leadsGrowth}%`,
      deltaUp: true,
      comp: `vs. ${metrics.leads_prev || 230} en octubre`,
    },
    {
      label: 'Tasa cierre IA',
      value: metrics.close_rate.toString(),
      unit: '%',
      delta: `▲ ${(metrics.close_rate - metrics.close_rate_prev).toFixed(1)}pts`,
      deltaUp: true,
      comp: 'benchmark sector 14%',
    },
    {
      label: 'Ingresos cobrados',
      value: `$${Math.round(metrics.revenue / 1000)}`,
      unit: 'k MXN',
      delta: `▲ ${revenueGrowth}%`,
      deltaUp: true,
      comp: `${metrics.paid_count} anticipos · $${metrics.avg_payment.toLocaleString()} prom.`,
    },
    {
      label: 'Tiempo de respuesta',
      value: metrics.avg_response_time_seconds.toString(),
      unit: 'seg',
      delta: `▼ ${responseImprovement}%`,
      deltaUp: false,
      comp: 'vs. 1h 42m con asistente',
      hero: true,
    },
  ];

  return (
    <section className="grid grid-cols-4 max-md:grid-cols-2 mb-9 border border-line rounded-lg bg-paper-warm overflow-hidden shadow-sm" aria-label="Métricas clave del mes">
      {kpis.map((kpi, i) => (
        <article
          key={kpi.label}
          className={`p-5 border-r border-line last:border-r-0 relative overflow-hidden
            max-md:[&:nth-child(2)]:border-r-0 max-md:[&:nth-child(1)]:border-b max-md:[&:nth-child(2)]:border-b
            ${kpi.hero ? 'bg-gradient-to-br from-paper-warm to-paper-deep' : ''}
          `}
          style={{ animation: `fadeUp .5s ease-out backwards ${0.05 + i * 0.07}s` }}
        >
          <div className="text-[10px] tracking-[0.18em] uppercase text-ink-soft mb-3.5 font-semibold">
            {kpi.label}
          </div>
          <div className="font-serif text-[46px] font-normal leading-none tracking-tighter flex items-baseline gap-1.5">
            {kpi.value}
            <span className="text-base text-ink-soft font-light font-sans">{kpi.unit}</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs flex-wrap">
            <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded font-medium ${kpi.deltaUp ? 'bg-good/15 text-good' : 'bg-bad/15 text-bad'}`}>
              {kpi.delta}
            </span>
            <span className="text-ink-soft text-[11.5px]">{kpi.comp}</span>
          </div>
          <svg className="absolute bottom-3 right-3.5 w-[92px] h-8 opacity-30 pointer-events-none" viewBox="0 0 92 32" fill="none">
            <path d={SPARKLINES[i]} stroke={SPARK_COLORS[i]} strokeWidth="1.5" />
          </svg>
        </article>
      ))}
    </section>
  );
}
