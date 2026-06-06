'use client';

import { useEffect, useState } from 'react';

const NAV_GROUPS = [
  {
    label: 'Operación',
    items: [
      { name: 'Panorama', active: true, icon: 'grid' },
      { name: 'Pipeline', badge: '47', icon: 'list' },
      { name: 'Conversaciones', badge: '12', icon: 'chat' },
      { name: 'Agenda', icon: 'calendar' },
    ],
  },
  {
    label: 'Inteligencia',
    items: [
      { name: 'Agente IA', icon: 'clock' },
      { name: 'Métricas', icon: 'chart' },
      { name: 'Plantillas', icon: 'doc' },
      { name: 'Formularios', icon: 'list' },
      { name: 'Calendario', icon: 'calendar' },
    ],
  },
  {
    label: 'Cuenta',
    items: [
      { name: 'Pacientes', icon: 'user' },
      { name: 'Pagos & Stripe', icon: 'check' },
      { name: 'PayPal', icon: 'check' },
      { name: 'Transferencias', icon: 'doc' },
    ],
  },
];

function NavIcon({ name }: { name: string }) {
  const props = { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 };
  switch (name) {
    case 'grid':
      return <svg {...props}><rect x="2" y="2" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" /><rect x="2" y="9" width="5" height="5" rx="1" /><rect x="9" y="9" width="5" height="5" rx="1" /></svg>;
    case 'list':
      return <svg {...props}><path d="M2 4h12M2 8h12M2 12h8" /></svg>;
    case 'chat':
      return <svg {...props}><path d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6l-3 2v-2a2 2 0 0 1-2-2V4z" /></svg>;
    case 'calendar':
      return <svg {...props}><rect x="2" y="3" width="12" height="11" rx="1" /><path d="M2 6h12M5 1v3M11 1v3" /></svg>;
    case 'clock':
      return <svg {...props}><circle cx="8" cy="8" r="6" /><path d="M8 5v3l2 2" /></svg>;
    case 'chart':
      return <svg {...props}><path d="M2 14V2h12v12M2 10l3-3 3 3 5-5" /></svg>;
    case 'doc':
      return <svg {...props}><rect x="2" y="2" width="12" height="12" rx="1" /><path d="M5 6h6M5 9h4" /></svg>;
    case 'user':
      return <svg {...props}><circle cx="8" cy="6" r="3" /><path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" /></svg>;
    case 'check':
      return <svg {...props}><circle cx="8" cy="8" r="6" /><path d="M6 8l1.5 1.5L11 6" /></svg>;
    default:
      return null;
  }
}

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

export default function Sidebar({ activeView, onNavigate }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clinic, setClinic] = useState<{ name: string; plan: string } | null>(null);

  useEffect(() => {
    fetch('/api/clinic').then(r => r.json()).then(setClinic).catch(() => {});
  }, []);

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="fixed top-3.5 left-3.5 z-[1000] w-10 h-10 bg-ink text-paper rounded-md grid place-items-center md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Abrir menú"
        aria-expanded={mobileOpen}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 5h12M3 9h12M3 13h12" />
        </svg>
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-ink/50 z-[998] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`bg-ink text-paper p-5 sticky top-0 h-screen flex flex-col border-r border-paper/[0.06] overflow-y-auto
          max-md:fixed max-md:z-[999] max-md:w-[260px] max-md:transition-transform max-md:duration-250
          ${mobileOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-9 pb-5 border-b border-paper/[0.08]">
          <div className="w-[30px] h-[30px] bg-accent rounded-full relative shrink-0">
            <div className="absolute w-[9px] h-[9px] bg-paper rounded-full top-[5px] right-[5px]" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-serif text-xl font-medium tracking-tight">
              Consulta<em className="text-accent font-normal">.ai</em>
            </span>
            <span className="text-[9px] tracking-[0.22em] uppercase text-paper/50 mt-1">
              Salud Estética
            </span>
          </div>
        </div>

        {/* Nav groups */}
        {NAV_GROUPS.map((group) => (
          <nav key={group.label} className="mb-4" aria-label={group.label}>
            <div className="text-[9.5px] tracking-[0.2em] uppercase text-paper/[0.42] px-3 mb-1.5 font-medium">
              {group.label}
            </div>
            {group.items.map((item) => (
              <button
                key={item.name}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] text-left relative transition-colors
                  ${activeView === item.name
                    ? 'bg-paper/[0.08] text-paper font-medium'
                    : 'text-paper/70 hover:bg-paper/[0.05] hover:text-paper'}
                `}
                onClick={() => { onNavigate(item.name); setMobileOpen(false); }}
                aria-current={activeView === item.name ? 'page' : undefined}
              >
                {activeView === item.name && (
                  <span className="absolute left-[-20px] top-2 bottom-2 w-0.5 bg-accent rounded-r" />
                )}
                <span className="opacity-75 shrink-0"><NavIcon name={item.icon} /></span>
                {item.name}
                {item.badge && (
                  <span className="ml-auto bg-accent text-paper text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold leading-tight">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        ))}

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-paper/[0.08] flex items-center gap-3">
          <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-gold to-accent grid place-items-center font-serif font-medium text-paper text-[13px] shrink-0">
            {clinic?.name ? clinic.name.slice(0, 2).toUpperCase() : '..'}
          </div>
          <div>
            <div className="text-[12.5px] font-medium text-paper">{clinic?.name || 'Cargando...'}</div>
            <div className="text-[10.5px] text-paper/50 mt-0.5">Plan {clinic?.plan || '...'} · MX</div>
          </div>
        </div>
      </aside>
    </>
  );
}
