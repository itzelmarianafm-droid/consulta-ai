'use client';

import { useEffect, useState } from 'react';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function Topbar() {
  const [time, setTime] = useState('');
  const [clinicName, setClinicName] = useState('');

  useEffect(() => {
    function update() {
      const d = new Date();
      const h = d.getHours() % 12 || 12;
      const m = d.getMinutes().toString().padStart(2, '0');
      const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
      setTime(`${h}:${m} ${ampm}`);
    }
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch('/api/clinic').then(r => r.json()).then(c => setClinicName(c.name || '')).catch(() => {});
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
  const currentMonth = MONTH_NAMES[now.getMonth()];

  return (
    <header className="flex items-end justify-between gap-6 mb-8 pb-6 border-b border-line flex-wrap">
      <div>
        <div className="text-[11px] tracking-[0.18em] uppercase text-ink-soft mb-2.5 flex items-center gap-2 font-medium">
          <span className="w-[5px] h-[5px] rounded-full bg-accent" />
          Panorama · {currentMonth}
        </div>
        <h1 className="font-serif text-[44px] font-normal tracking-tight leading-none">
          {greeting}{clinicName ? <>, <em className="italic text-accent font-light">{clinicName}</em></> : ''}
        </h1>
        <p className="mt-2 text-[13.5px] text-ink-soft max-w-[540px]">
          Aquí está el resumen del día.
        </p>
      </div>

      <div className="flex gap-2.5 items-center flex-wrap">
        <div className="font-mono text-[11.5px] px-3.5 py-2 bg-paper-warm border border-line rounded-full text-ink-soft flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-good rounded-full shadow-[0_0_0_3px_rgba(79,107,63,0.22)] animate-[pulse-dot_2s_ease-in-out_infinite]" />
          Agente activo · {time}
        </div>
        <button className="px-4 py-2 rounded-md border border-ink bg-transparent text-ink text-[13px] font-medium transition-colors hover:bg-ink hover:text-paper">
          Exportar
        </button>
        <button className="px-4 py-2 rounded-md border border-ink bg-ink text-paper text-[13px] font-medium transition-colors hover:bg-accent hover:border-accent">
          Nueva campaña
        </button>
      </div>
    </header>
  );
}
