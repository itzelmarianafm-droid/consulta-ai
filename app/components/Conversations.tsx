'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
interface ConvoWithDetails {
  id: string;
  lead_id: string;
  clinic_id: string;
  status: string;
  current_stage: string;
  created_at: string;
  updated_at: string;
  lead?: { name: string | null; phone: string; heat: string; stage: string };
  last_message?: { role: string; content: string; created_at: string };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

const STATUS_DOT: Record<string, string> = {
  active: 'bg-moss',
  escalated: 'bg-gold',
  closed: 'bg-ink-soft',
};

function getTag(convo: ConvoWithDetails) {
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
  const [convos, setConvos] = useState<ConvoWithDetails[]>([]);
  const [filter, setFilter] = useState('active');
  const [selected, setSelected] = useState<ConvoWithDetails | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadConvos = useCallback(() => {
    fetch(`/api/conversations?status=${filter}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setConvos(data);
      })
      .catch(console.error);
  }, [filter]);

  useEffect(() => {
    loadConvos();
    const interval = setInterval(loadConvos, 15000);
    return () => clearInterval(interval);
  }, [loadConvos]);

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/conversations/messages?conversation_id=${conversationId}`);
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    } catch (e) {
      console.error(e);
    }
    setLoadingMessages(false);
  }, []);

  const selectConvo = useCallback((convo: ConvoWithDetails) => {
    setSelected(convo);
    loadMessages(convo.id);

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadMessages(convo.id), 8000);
  }, [loadMessages]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="bg-paper-warm border border-line rounded-lg overflow-hidden shadow-sm">
      <div className="px-5 pt-4 pb-3 flex justify-between items-end gap-4 border-b border-line flex-wrap">
        <div>
          <div className="font-serif text-[22px] font-medium tracking-tight">Conversaciones</div>
          <div className="text-[11.5px] text-ink-soft mt-0.5" role="status">
            {convos.length} conversación{convos.length !== 1 ? 'es' : ''} {filter === 'active' ? 'activas' : filter === 'escalated' ? 'escaladas' : 'cerradas'}
          </div>
        </div>
        <div className="flex gap-1 bg-paper-deep p-0.5 rounded-md" role="tablist">
          {[
            { key: 'active', label: 'Activas' },
            { key: 'escalated', label: 'Escaladas' },
            { key: 'closed', label: 'Cerradas' },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`px-3 py-1 text-[11.5px] rounded font-medium transition-colors ${filter === tab.key ? 'bg-paper text-ink shadow-sm' : 'text-ink-soft hover:text-ink'}`}
              onClick={() => { setFilter(tab.key); setSelected(null); setMessages([]); }}
              role="tab"
              aria-selected={filter === tab.key}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[320px_1fr] max-md:grid-cols-1 min-h-[500px]">
        {/* Conversation list */}
        <div className="border-r border-line max-h-[600px] overflow-y-auto">
          {convos.length === 0 ? (
            <div className="p-5 text-center text-ink-soft text-sm">No hay conversaciones</div>
          ) : (
            convos.map((convo) => {
              const tag = getTag(convo);
              return (
                <button
                  key={convo.id}
                  className={`w-full grid grid-cols-[38px_1fr_auto] gap-3 px-4 py-3 border-b border-line last:border-b-0 cursor-pointer transition-colors items-center text-left ${
                    selected?.id === convo.id ? 'bg-paper-deep' : 'hover:bg-paper-deep/50'
                  }`}
                  onClick={() => selectConvo(convo)}
                >
                  <div className="w-[38px] h-[38px] rounded-full bg-paper-deep grid place-items-center font-serif font-medium text-ink-soft text-[13px] border border-line relative">
                    {getInitials(convo.lead?.name || null)}
                    <span className={`absolute -bottom-0.5 -right-0.5 w-[11px] h-[11px] rounded-full border-2 border-paper-warm ${STATUS_DOT[convo.status] || STATUS_DOT.active}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold truncate">{convo.lead?.name || convo.lead?.phone || 'Desconocido'}</div>
                    <div className="text-[11px] text-ink-soft overflow-hidden text-ellipsis whitespace-nowrap mt-0.5">
                      {convo.last_message?.content || 'Sin mensajes'}
                    </div>
                    <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded mt-1 tracking-wide uppercase font-semibold ${tag.className}`}>
                      {tag.label}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-ink-soft text-right leading-snug">
                    {convo.last_message?.created_at ? timeAgo(convo.last_message.created_at) : ''}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Chat view */}
        <div className="flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-ink-soft text-sm">
              <div className="text-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="mx-auto mb-3 opacity-30">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                Selecciona una conversación para ver los mensajes
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-paper">
                <div className="flex items-center gap-3">
                  <div className="w-[34px] h-[34px] rounded-full bg-green-100 grid place-items-center font-serif font-medium text-green-700 text-[12px]">
                    {getInitials(selected.lead?.name || null)}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold">{selected.lead?.name || selected.lead?.phone || 'Desconocido'}</div>
                    <div className="text-[10px] text-ink-soft">
                      {selected.lead?.phone} · Etapa: {selected.current_stage}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selected.lead?.phone && (
                    <a
                      href={`https://wa.me/${selected.lead.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-green-600 text-white text-[10px] font-semibold rounded-md hover:bg-green-700 transition-colors"
                    >
                      Abrir WhatsApp
                    </a>
                  )}
                  <button
                    className="text-ink-soft hover:text-ink text-lg px-1 max-md:block hidden"
                    onClick={() => { setSelected(null); setMessages([]); if (pollRef.current) clearInterval(pollRef.current); }}
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[450px] bg-[#f0ede8]">
                {loadingMessages && messages.length === 0 ? (
                  <div className="text-center text-ink-soft text-sm py-8">Cargando mensajes...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-ink-soft text-sm py-8">No hay mensajes aún</div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-lg shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-white text-ink rounded-bl-none'
                            : 'bg-[#d9fdd3] text-ink rounded-br-none'
                        }`}
                      >
                        <div className="text-[12.5px] leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                        <div className={`text-[9.5px] mt-1 text-right ${msg.role === 'user' ? 'text-ink-soft' : 'text-green-700/60'}`}>
                          {msg.role === 'assistant' && (
                            <span className="mr-1 text-[9px] bg-purple-100 text-purple-600 px-1 py-0.5 rounded font-semibold">IA</span>
                          )}
                          {new Date(msg.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Info footer */}
              <div className="px-4 py-2.5 border-t border-line bg-paper text-[10.5px] text-ink-soft flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                Las respuestas son generadas automáticamente por el agente IA usando la base de conocimiento
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
