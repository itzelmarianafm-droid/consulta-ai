'use client';

import { useEffect, useState, useCallback } from 'react';

interface Slot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function CalendarConfig() {
  const [mode, setMode] = useState<'built_in' | 'external'>('built_in');
  const [externalUrl, setExternalUrl] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // New slot form
  const [newDay, setNewDay] = useState(1);
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('13:00');

  useEffect(() => {
    fetch('/api/calendar-config').then(r => r.json()).then(data => {
      setMode(data.calendar_mode || 'built_in');
      setExternalUrl(data.calendar_external_url || '');
    }).catch(console.error);

    fetch('/api/calendar-slots').then(r => r.json()).then(data => {
      setSlots(data.slots || []);
    }).catch(console.error);
  }, []);

  const saveMode = useCallback(async (newMode: 'built_in' | 'external') => {
    setMode(newMode);
    await fetch('/api/calendar-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calendar_mode: newMode }),
    });
  }, []);

  const saveExternalUrl = useCallback(async () => {
    setSaving(true);
    await fetch('/api/calendar-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calendar_external_url: externalUrl }),
    });
    setMessage('URL guardada');
    setTimeout(() => setMessage(''), 3000);
    setSaving(false);
  }, [externalUrl]);

  const addSlot = useCallback(async () => {
    setSaving(true);
    const res = await fetch('/api/calendar-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day_of_week: newDay, start_time: newStart, end_time: newEnd }),
    });
    if (res.ok) {
      const data = await res.json();
      setSlots(prev => [...prev, data]);
      setMessage('Horario agregado');
      setTimeout(() => setMessage(''), 3000);
    }
    setSaving(false);
  }, [newDay, newStart, newEnd]);

  const removeSlot = useCallback(async (id: string) => {
    await fetch('/api/calendar-slots', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setSlots(prev => prev.filter(s => s.id !== id));
  }, []);

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <div className="bg-paper-warm border border-line rounded-lg overflow-hidden shadow-sm">
        <div className="px-5 pt-4 pb-3 border-b border-line">
          <div className="font-serif text-[22px] font-medium tracking-tight">Calendario de citas</div>
          <div className="text-[11.5px] text-ink-soft mt-0.5">Configura los horarios disponibles para agendar llamadas</div>
        </div>

        <div className="p-5 space-y-5">
          {/* Mode toggle */}
          <div>
            <div className="text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-3">Modo de calendario</div>
            <div className="flex gap-3">
              <button
                className={`flex-1 p-4 border rounded-md text-left transition-colors ${mode === 'built_in' ? 'border-accent bg-accent/5' : 'border-line hover:border-line-strong'}`}
                onClick={() => saveMode('built_in')}
              >
                <div className="text-[13px] font-semibold">Calendario propio</div>
                <div className="text-[11px] text-ink-soft mt-1">Configura horarios aquí. El prospecto elige día y hora desde la landing.</div>
              </button>
              <button
                className={`flex-1 p-4 border rounded-md text-left transition-colors ${mode === 'external' ? 'border-accent bg-accent/5' : 'border-line hover:border-line-strong'}`}
                onClick={() => saveMode('external')}
              >
                <div className="text-[13px] font-semibold">Calendly / Cal.com / Google</div>
                <div className="text-[11px] text-ink-soft mt-1">Pega tu URL y el prospecto agenda directamente en tu herramienta.</div>
              </button>
            </div>
          </div>

          {/* External URL */}
          {mode === 'external' && (
            <div>
              <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-2">URL del calendario externo</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  className="flex-1 p-3 bg-paper border border-line-strong rounded-md text-[13px] text-ink focus:outline-2 focus:outline-accent"
                  placeholder="https://calendly.com/tu-cuenta/llamada"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                />
                <button
                  className="px-4 py-2 bg-ink text-paper text-[12px] font-semibold rounded-md hover:bg-accent transition-colors disabled:opacity-50"
                  onClick={saveExternalUrl}
                  disabled={saving}
                >
                  Guardar
                </button>
              </div>
              <p className="text-[11px] text-ink-soft mt-1.5">Funciona con Calendly, Cal.com, Google Calendar citas, o cualquier URL de booking</p>
            </div>
          )}

          {/* Built-in slots */}
          {mode === 'built_in' && (
            <>
              {/* Current slots */}
              <div>
                <div className="text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-3">Horarios configurados</div>
                {slots.length === 0 ? (
                  <p className="text-ink-soft text-sm">No hay horarios configurados. Agrega uno abajo.</p>
                ) : (
                  <div className="space-y-2">
                    {slots.sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)).map(slot => (
                      <div key={slot.id} className="flex items-center justify-between gap-3 p-3 bg-paper border border-line rounded-md">
                        <div className="text-[13px]">
                          <strong>{DAYS[slot.day_of_week]}</strong>
                          <span className="text-ink-soft ml-2">{slot.start_time} — {slot.end_time}</span>
                        </div>
                        <button
                          className="text-[11px] text-red-500 hover:text-red-700 font-medium"
                          onClick={() => removeSlot(slot.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add slot */}
              <div className="bg-paper border border-line rounded-md p-4">
                <div className="text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-3">Agregar horario</div>
                <div className="flex gap-3 flex-wrap items-end">
                  <div>
                    <label className="block text-[11px] text-ink-soft mb-1">Día</label>
                    <select className="p-2.5 bg-paper border border-line-strong rounded-md text-[13px]" value={newDay} onChange={e => setNewDay(Number(e.target.value))}>
                      {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-ink-soft mb-1">Desde</label>
                    <input type="time" className="p-2.5 bg-paper border border-line-strong rounded-md text-[13px]" value={newStart} onChange={e => setNewStart(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[11px] text-ink-soft mb-1">Hasta</label>
                    <input type="time" className="p-2.5 bg-paper border border-line-strong rounded-md text-[13px]" value={newEnd} onChange={e => setNewEnd(e.target.value)} />
                  </div>
                  <button
                    className="px-4 py-2.5 bg-ink text-paper text-[12px] font-semibold rounded-md hover:bg-accent transition-colors disabled:opacity-50"
                    onClick={addSlot}
                    disabled={saving}
                  >
                    Agregar
                  </button>
                </div>
                <p className="text-[11px] text-ink-soft mt-2">Se generan bloques de 45 minutos dentro de este rango para los próximos 14 días</p>
              </div>
            </>
          )}

          {message && (
            <div className="text-[12px] font-medium px-3 py-2 rounded-md bg-green-50 text-green-700">{message}</div>
          )}
        </div>
      </div>
    </div>
  );
}
