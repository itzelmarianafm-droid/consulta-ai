'use client';

import { useEffect, useState } from 'react';
import type { Appointment } from '@/lib/types';

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-good/15 text-good',
  rescheduled: 'bg-gold/20 text-gold',
  pending: 'bg-ink/10 text-ink-soft',
  cancelled: 'bg-bad/15 text-bad',
  completed: 'bg-good/15 text-good',
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmada',
  rescheduled: 'Reagendada',
  pending: 'Pendiente',
  cancelled: 'Cancelada',
  completed: 'Completada',
};

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    fetch('/api/appointments?date=today')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAppointments(data);
      })
      .catch(console.error);
  }, []);

  const today = new Date();
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayStr = `${dayNames[today.getDay()]} ${today.getDate()}`;
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;

  return (
    <div className="bg-paper-warm border border-line rounded-lg overflow-hidden shadow-sm flex-1">
      <div className="px-5 pt-4 pb-3 border-b border-line">
        <div className="font-serif text-[22px] font-medium tracking-tight">Citas de hoy</div>
        <div className="text-[11.5px] text-ink-soft mt-0.5">
          {dayStr} · {confirmedCount} confirmadas{appointments.length > confirmedCount ? `, ${appointments.length - confirmedCount} pendientes` : ''}
        </div>
      </div>

      <div>
        {appointments.length === 0 ? (
          <div className="p-5 text-center text-ink-soft text-sm">No hay citas para hoy</div>
        ) : (
          appointments.map((appt) => {
            const d = new Date(appt.scheduled_at);
            const h = d.getHours();
            const m = d.getMinutes().toString().padStart(2, '0');
            const ampm = h >= 12 ? 'PM' : 'AM';
            const hour12 = (h % 12 || 12).toString().padStart(2, '0');

            return (
              <div key={appt.id} className="grid grid-cols-[64px_1fr_auto] gap-3.5 px-5 py-3 border-b border-line last:border-b-0 items-center">
                <div className="text-center border-r border-line pr-3.5">
                  <div className="font-serif text-[19px] font-medium leading-none">{hour12}</div>
                  <div className="font-mono text-[10px] text-ink-soft mt-1">:{m} {ampm}</div>
                </div>
                <div>
                  <div className="text-[13px] font-semibold">{appt.lead?.name || 'Paciente'}</div>
                  <div className="text-[11.5px] text-ink-soft mt-0.5">{appt.service || 'Consulta general'}</div>
                </div>
                <span className={`text-[9.5px] px-2 py-0.5 rounded font-semibold tracking-wide uppercase ${STATUS_STYLES[appt.status] || STATUS_STYLES.pending}`}>
                  {STATUS_LABELS[appt.status] || appt.status}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
