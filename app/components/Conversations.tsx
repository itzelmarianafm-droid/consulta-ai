'use client';

import { useEffect, useState } from 'react';
import type { Conversation } from '@/lib/types';

const STATUS_DOT: Record<string, string> = {
  active: 'bg-moss',
  escalated: 'bg-gold',
  closed: 'bg-ink-soft',
};

function getTag(convo: Conversation & { last_message?: { role: string; content: string } }) {
  if (convo.status === 'escalated') return { label: 'Escalada', className: 'bg-accent/15 text-accent-deep' };
  if (convo.last_message?.role === 'assistant') return { label: 'IA respondiendo', className: 'bg-moss/[0.18] text-moss' };
  if (convo.current_stage === 'cierre') return { label: 'Cerrar venta', className: 'bg-accent/15 text-accent-deep' };
  return { label: 'En espera', className: 'bg-gold/20 text-gold' };
}

function getInitials(name: string | null) {
  if (!name) return '??';
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function Conversations() {
  const [convos, setConvos] = useState<(Conversation & { lead?: { name: string; phone: string }; last_message?: { role: string; content: string; created_at: string } })[]>([]);
  const [filter, setFilter] = useState('Activas');

  useEffect(() => {
    fetch('/api/conversations?status=active')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setConvos(data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="bg-paper-warm border border-line rounded-lg overflow-hidden shadow-sm">
      <div className="px-5 pt-4 pb-3 flex justify-between items-end gap-4 border-b border-line flex-wrap">
        <div>
          <div className="font-serif text-[22px] font-medium tracking-tight">Conversaciones en vivo</div>
          <div className="text-[11.5px] text-ink-soft mt-0.5" role="status">
            Tu agente está hablando con {convos.length} personas ahora
          </div>
        </div>
        <div className="flex gap-1 bg-paper-deep p-0.5 rounded-md" role="tablist">
          {['Activas', 'Toman acción'].map((tab) => (
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

      <div className="flex flex-col">
        {convos.length === 0 ? (
          <div className="p-5 text-center text-ink-soft text-sm">No hay conversaciones activas</div>
        ) : (
          convos.map((convo) => {
            const tag = getTag(convo);
            const lastTime = convo.last_message?.created_at
              ? new Date(convo.last_message.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <button
                key={convo.id}
                className="grid grid-cols-[38px_1fr_auto] gap-3 px-5 py-3 border-b border-line last:border-b-0 cursor-pointer transition-colors hover:bg-paper-deep items-center text-left w-full"
              >
                <div className="w-[38px] h-[38px] rounded-full bg-paper-deep grid place-items-center font-serif font-medium text-ink-soft text-[13px] border border-line relative">
                  {getInitials(convo.lead?.name || null)}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-[11px] h-[11px] rounded-full border-2 border-paper-warm ${STATUS_DOT[convo.status] || STATUS_DOT.active}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold">{convo.lead?.name || convo.lead?.phone || 'Desconocido'}</div>
                  <div className="text-[11.5px] text-ink-soft overflow-hidden text-ellipsis whitespace-nowrap mt-0.5">
                    {convo.last_message?.content || 'Sin mensajes'}
                  </div>
                  <span className={`inline-block text-[9.5px] px-1.5 py-0.5 rounded mt-1 tracking-wide uppercase font-semibold ${tag.className}`}>
                    {tag.label}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-ink-soft text-right leading-snug">
                  {convo.last_message?.created_at ? timeAgo(convo.last_message.created_at) : ''}
                  <br />
                  {lastTime}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
