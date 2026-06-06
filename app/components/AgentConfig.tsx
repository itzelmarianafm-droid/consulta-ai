'use client';

import { useEffect, useState, useCallback } from 'react';
import type { AgentConfig as AgentConfigType, AgentStage } from '@/lib/types';

const STAGES: { key: AgentStage; label: string; desc: string; num: string }[] = [
  { key: 'bienvenida', label: 'Bienvenida', desc: 'Primer contacto · captura motivo', num: 'i.' },
  { key: 'calificacion', label: 'Calificación', desc: 'Detecta urgencia, presupuesto, fit', num: 'ii.' },
  { key: 'educacion', label: 'Educación', desc: 'Envía videos, antes/después', num: 'iii.' },
  { key: 'cierre', label: 'Cierre', desc: 'Propone fecha + link de pago', num: 'iv.' },
  { key: 'recuperacion', label: 'Recuperación', desc: 'Re-engagement automatizado', num: 'v.' },
];

const CHAT_PREVIEWS: Record<AgentStage, { who: 'user' | 'bot'; text: string; time: string }[]> = {
  bienvenida: [
    { who: 'user', text: 'Hola, vi un reel suyo de botox preventivo, ¿cuánto cuesta?', time: '14:31' },
    { who: 'bot', text: '¡Hola! Soy Sofía de Clínica Vela. Qué gusto que te interesara el reel. El botox preventivo va desde $1,500 dependiendo de las zonas. ¿Es tu primera vez aplicándolo?', time: '14:31' },
    { who: 'user', text: 'Sí, primera vez, me da un poquito de miedo', time: '14:32' },
    { who: 'bot', text: 'Es totalmente normal. La Dra. Velasco trabaja con dosis muy conservadoras — el efecto es sutil, natural. Te paso un video corto de cómo es la sesión 👇', time: '14:32' },
  ],
  calificacion: [
    { who: 'user', text: '¿La bichectomía duele?', time: '15:02' },
    { who: 'bot', text: 'Hola Patricia. Se hace con anestesia local, no duele durante; lo que sí hay es inflamación 4–5 días. ¿Tienes algún evento próximo que te preocupe?', time: '15:02' },
    { who: 'user', text: 'Sí, una boda en 6 semanas', time: '15:03' },
    { who: 'bot', text: '6 semanas es ventana segura. ¿Es tu primera vez con cirugía estética facial?', time: '15:03' },
  ],
  educacion: [
    { who: 'bot', text: 'Te mando tres antes/después de pacientes con tu mismo tipo de rostro 👇', time: '11:15' },
    { who: 'user', text: 'Wow se ve súper natural', time: '11:18' },
    { who: 'bot', text: 'Te dejo un video de Marisol contando su experiencia — fue paciente hace 4 meses 👇', time: '11:18' },
    { who: 'user', text: '¿Y la recuperación cómo es?', time: '11:22' },
    { who: 'bot', text: '5 días inflamación moderada, resultado final a las 6 semanas. La Dra. te ve a los 7 días sin costo.', time: '11:22' },
  ],
  cierre: [
    { who: 'user', text: 'Perfecto, sí me interesa', time: '16:40' },
    { who: 'bot', text: '¡Excelente! Tengo dos opciones: viernes 11:00 AM o sábado 9:30 AM. ¿Cuál te queda?', time: '16:40' },
    { who: 'user', text: 'Viernes 11', time: '16:41' },
    { who: 'bot', text: 'Listo, viernes 11 AM. Te mando el link de anticipo de $500 — se descuenta del total 👇', time: '16:41' },
    { who: 'bot', text: 'https://pay.consulta.ai/x9Kp2', time: '16:41' },
  ],
  recuperacion: [
    { who: 'bot', text: 'Hola Diana 👋 vi que viste el link pero no lo abriste. Sin presión — sé que estas decisiones se piensan.', time: '09:00' },
    { who: 'bot', text: 'Te mando un video de María contando su recuperación día por día 👇', time: '09:00' },
    { who: 'user', text: 'Ah gracias, sí lo voy a ver', time: '09:47' },
    { who: 'bot', text: 'Se me abrió un espacio el martes 10 AM si te servía — sin compromiso 🌿', time: '09:48' },
  ],
};

const TOGGLE_RULES = [
  { key: 'cobro_anticipo', label: 'Cobro de anticipo', desc: 'Envía link Stripe al confirmar interés' },
  { key: 'recordatorios', label: 'Recordatorios automáticos', desc: '24h y 2h antes de la cita' },
  { key: 'reagendar', label: 'Reagendar sin fricción', desc: 'Permite cambiar fecha hasta 6h antes' },
  { key: 'escalar_humano', label: 'Escalar a humano', desc: 'Si el lead pide hablar con persona' },
];

export default function AgentConfig() {
  const [configs, setConfigs] = useState<AgentConfigType[]>([]);
  const [activeStage, setActiveStage] = useState<AgentStage>('bienvenida');
  const [persona, setPersona] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [rules, setRules] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/agent-config')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setConfigs(data);
          const initial = data.find((c: AgentConfigType) => c.stage === 'bienvenida');
          if (initial) {
            setPersona(initial.persona_prompt);
            setServices(initial.services || []);
            setRules(initial.rules || {});
          }
        }
      })
      .catch(console.error);
  }, []);

  const selectStage = useCallback((stage: AgentStage) => {
    setActiveStage(stage);
    const cfg = configs.find((c) => c.stage === stage);
    if (cfg) {
      setPersona(cfg.persona_prompt);
      setServices(cfg.services || []);
      setRules(cfg.rules || {});
    }
  }, [configs]);

  const save = useCallback(async (updates: Partial<{ persona_prompt: string; services: string[]; rules: Record<string, boolean> }>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/agent-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: activeStage, ...updates }),
      });
      const updated = await res.json();
      setConfigs((prev) => prev.map((c) => (c.stage === activeStage ? { ...c, ...updated } : c)));
    } catch (err) {
      console.error('Failed to save config:', err);
    }
    setSaving(false);
  }, [activeStage]);

  const removeService = (svc: string) => {
    const next = services.filter((s) => s !== svc);
    setServices(next);
    save({ services: next });
  };

  const addService = () => {
    const name = window.prompt('Nombre del servicio nuevo');
    if (name?.trim()) {
      const next = [...services, name.trim()];
      setServices(next);
      save({ services: next });
    }
  };

  const toggleRule = (key: string) => {
    const next = { ...rules, [key]: !rules[key] };
    setRules(next);
    save({ rules: next });
  };

  const chatPreview = CHAT_PREVIEWS[activeStage] || [];

  return (
    <div className="bg-paper-warm border border-line rounded-lg overflow-hidden shadow-sm">
      <div className="px-5 pt-4 pb-3 flex justify-between items-end gap-4 border-b border-line flex-wrap">
        <div>
          <div className="font-serif text-[22px] font-medium tracking-tight">
            Agente IA · configuración
            {saving && <span className="text-xs text-ink-soft font-sans font-normal ml-2">guardando...</span>}
          </div>
          <div className="text-[11.5px] text-ink-soft mt-0.5">Personalidad, flujos y plantillas que usa tu agente</div>
        </div>
      </div>

      <div className="grid grid-cols-[260px_1fr] max-md:grid-cols-1 border-t border-line">
        {/* Stage rail */}
        <div className="border-r max-md:border-r-0 max-md:border-b border-line p-4 bg-paper">
          {STAGES.map((s) => (
            <button
              key={s.key}
              className={`w-full text-left p-3 rounded-md mb-1 border transition-colors ${activeStage === s.key ? 'bg-paper-warm border-line-strong' : 'border-transparent hover:bg-paper-warm'}`}
              onClick={() => selectStage(s.key)}
              role="tab"
              aria-selected={activeStage === s.key}
            >
              <div className="text-[12.5px] font-semibold flex justify-between items-center">
                {s.label}
                <span className="font-serif italic text-accent text-sm">{s.num}</span>
              </div>
              <div className="text-[11px] text-ink-soft mt-0.5">{s.desc}</div>
            </button>
          ))}
        </div>

        {/* Edit panel */}
        <div className="p-5">
          {/* Persona */}
          <div className="mb-5">
            <label htmlFor="persona" className="block text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-2">
              Tono y personalidad
            </label>
            <textarea
              id="persona"
              className="w-full p-3 bg-paper border border-line-strong rounded-md text-[13px] text-ink resize-y min-h-[96px] leading-relaxed transition-colors focus:outline-2 focus:outline-accent focus:-outline-offset-1 focus:border-accent"
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              onBlur={() => save({ persona_prompt: persona })}
              spellCheck={false}
            />
          </div>

          {/* Services */}
          <div className="mb-5">
            <div className="text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-2">
              Servicios que ofreces
            </div>
            <div className="flex flex-wrap gap-1.5">
              {services.map((svc) => (
                <span key={svc} className="inline-flex items-center gap-1.5 px-3 py-1 bg-ink text-paper border border-ink rounded-full text-[11.5px]">
                  {svc}
                  <button className="text-xs opacity-65 hover:opacity-100" onClick={() => removeService(svc)} aria-label={`Quitar ${svc}`}>×</button>
                </span>
              ))}
              <button className="px-3 py-1 border border-dashed border-line-strong rounded-full text-[11.5px] text-ink-soft hover:text-ink hover:border-ink transition-colors" onClick={addService}>
                + agregar
              </button>
            </div>
          </div>

          {/* Rules */}
          <div className="mb-5">
            <div className="text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-2">
              Reglas activas
            </div>
            {TOGGLE_RULES.map((rule) => (
              <div key={rule.key} className="flex justify-between items-center py-3 border-b border-line last:border-b-0 gap-4">
                <div>
                  <div className="text-[12.5px] font-medium">{rule.label}</div>
                  <div className="text-[11px] text-ink-soft mt-0.5">{rule.desc}</div>
                </div>
                <button
                  className={`w-[38px] h-[22px] rounded-full relative transition-colors shrink-0 ${rules[rule.key] ? 'bg-accent' : 'bg-paper-deep'}`}
                  onClick={() => toggleRule(rule.key)}
                  role="switch"
                  aria-checked={!!rules[rule.key]}
                  aria-label={rule.label}
                >
                  <span className={`absolute w-4 h-4 bg-paper rounded-full top-[3px] transition-[left] shadow ${rules[rule.key] ? 'left-[19px]' : 'left-[3px]'}`} />
                </button>
              </div>
            ))}
          </div>

          {/* WhatsApp preview */}
          <div>
            <div className="text-[10.5px] tracking-[0.16em] uppercase text-ink-soft font-semibold mb-2">
              Vista previa · WhatsApp
            </div>
            <div className="bg-[#0d1418] p-3.5 rounded-md max-h-[320px] overflow-y-auto">
              {chatPreview.map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-[82%] p-2 pb-5 rounded-lg mb-1.5 text-[12.5px] leading-snug relative ${msg.who === 'user' ? 'bg-[#1f2c33] text-[#e9edef] mr-auto rounded-bl-sm' : 'bg-[#005c4b] text-[#e9edef] ml-auto rounded-br-sm'}`}
                >
                  {msg.text}
                  <span className="absolute bottom-1 right-2 text-[9.5px] opacity-60">{msg.time} ✓✓</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
