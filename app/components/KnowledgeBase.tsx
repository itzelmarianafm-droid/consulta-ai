'use client';

import { useEffect, useState, useCallback } from 'react';

interface KBEntry {
  id: string;
  category: string;
  title: string;
  content: string;
  updated_at: string;
}

const CATEGORIES = [
  { key: 'negocio', label: 'Sobre el negocio', placeholder: 'Ej: Historia de la clínica, misión, ubicación, horarios de atención...' },
  { key: 'doctor', label: 'Sobre el doctor/a', placeholder: 'Ej: Especialidad, años de experiencia, certificaciones, universidades...' },
  { key: 'servicios', label: 'Servicios y precios', placeholder: 'Ej: Botox — $1,500 a $3,500 según zonas. Duración: 20 min. Recuperación: inmediata...' },
  { key: 'politicas', label: 'Políticas', placeholder: 'Ej: Anticipo del 30% para agendar. Cancelación 24h antes sin cargo. No se hacen devoluciones...' },
  { key: 'faqs', label: 'Preguntas frecuentes', placeholder: 'Ej: ¿Duele el procedimiento? — No, se aplica anestesia local...' },
  { key: 'promociones', label: 'Promociones actuales', placeholder: 'Ej: 20% de descuento en primera consulta durante junio 2026...' },
  { key: 'otro', label: 'Otro', placeholder: 'Cualquier información adicional que el agente deba saber...' },
];

export default function KnowledgeBase() {
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [message, setMessage] = useState('');

  // Add form
  const [newCategory, setNewCategory] = useState('negocio');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetch('/api/knowledge-base').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setEntries(data);
    }).catch(console.error);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addEntry = useCallback(async () => {
    if (!newTitle || !newContent) return;
    setSaving(true);
    const res = await fetch('/api/knowledge-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: newCategory, title: newTitle, content: newContent }),
    });
    if (res.ok) {
      setNewTitle(''); setNewContent(''); setShowAdd(false);
      setMessage('Entrada agregada');
      load();
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  }, [newCategory, newTitle, newContent, load]);

  const updateEntry = useCallback(async (id: string) => {
    await fetch('/api/knowledge-base', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, content: editContent }),
    });
    setEditing(null);
    setMessage('Actualizado');
    load();
    setTimeout(() => setMessage(''), 3000);
  }, [editContent, load]);

  const deleteEntry = useCallback(async (id: string) => {
    if (!confirm('¿Eliminar esta entrada?')) return;
    await fetch('/api/knowledge-base', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setMessage('Eliminado');
    load();
    setTimeout(() => setMessage(''), 3000);
  }, [load]);

  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    entries: entries.filter(e => e.category === cat.key),
  })).filter(cat => cat.entries.length > 0);

  return (
    <div className="space-y-6">
      <div className="bg-paper-warm border border-line rounded-lg overflow-hidden shadow-sm">
        <div className="px-5 pt-4 pb-3 flex justify-between items-center border-b border-line flex-wrap gap-3">
          <div>
            <div className="font-serif text-[22px] font-medium tracking-tight">Base de conocimiento</div>
            <div className="text-[11.5px] text-ink-soft mt-0.5">
              Toda la información que el agente de WhatsApp usa para contestar. Entre más detallada, mejor responde.
            </div>
          </div>
          <button
            className="px-4 py-2 bg-ink text-paper text-[12px] font-semibold rounded-md hover:bg-accent transition-colors"
            onClick={() => setShowAdd(!showAdd)}
          >
            {showAdd ? 'Cancelar' : '+ Agregar información'}
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="p-5 border-b border-line bg-paper space-y-4">
            <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
              <div>
                <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-1">Categoría</label>
                <select className="w-full p-3 bg-paper-warm border border-line-strong rounded-md text-[13px]" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-1">Título</label>
                <input className="w-full p-3 bg-paper-warm border border-line-strong rounded-md text-[13px]" placeholder="Ej: Precios de Botox" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-1">Contenido</label>
              <textarea
                className="w-full p-3 bg-paper-warm border border-line-strong rounded-md text-[13px] min-h-[120px] resize-y leading-relaxed"
                placeholder={CATEGORIES.find(c => c.key === newCategory)?.placeholder}
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
              />
              <p className="text-[11px] text-ink-soft mt-1">Escribe como si le explicaras a tu asistente todo lo que necesita saber para responder preguntas sobre esto.</p>
            </div>
            <button
              className="px-6 py-3 bg-ink text-paper text-[13px] font-semibold rounded-md hover:bg-accent transition-colors disabled:opacity-50"
              onClick={addEntry}
              disabled={saving || !newTitle || !newContent}
            >
              Guardar
            </button>
          </div>
        )}

        {/* Entries by category */}
        {entries.length === 0 && !showAdd ? (
          <div className="p-8 text-center">
            <p className="text-ink-soft text-sm mb-4">No hay información cargada todavía.</p>
            <p className="text-ink-soft text-xs max-w-md mx-auto">
              El agente de WhatsApp usa esta información para contestar preguntas de los prospectos.
              Agrega datos sobre tu negocio, servicios, precios, políticas y preguntas frecuentes.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {grouped.map(group => (
              <div key={group.key} className="px-5 py-4">
                <div className="text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-3">
                  {group.label}
                </div>
                <div className="space-y-3">
                  {group.entries.map(entry => (
                    <div key={entry.id} className="bg-paper border border-line rounded-md p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="text-[13px] font-semibold">{entry.title}</h4>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            className="text-[11px] text-ink-soft hover:text-ink font-medium"
                            onClick={() => { setEditing(editing === entry.id ? null : entry.id); setEditContent(entry.content); }}
                          >
                            {editing === entry.id ? 'Cancelar' : 'Editar'}
                          </button>
                          <button
                            className="text-[11px] text-red-400 hover:text-red-600 font-medium"
                            onClick={() => deleteEntry(entry.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                      {editing === entry.id ? (
                        <div className="space-y-2">
                          <textarea
                            className="w-full p-3 bg-paper-warm border border-line-strong rounded-md text-[13px] min-h-[100px] resize-y leading-relaxed"
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                          />
                          <button
                            className="px-4 py-2 bg-ink text-paper text-[12px] font-semibold rounded-md hover:bg-accent transition-colors"
                            onClick={() => updateEntry(entry.id)}
                          >
                            Guardar cambios
                          </button>
                        </div>
                      ) : (
                        <p className="text-[12.5px] text-ink-soft leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {message && (
        <div className="text-[12px] font-medium px-3 py-2 rounded-md bg-green-50 text-green-700">{message}</div>
      )}
    </div>
  );
}
