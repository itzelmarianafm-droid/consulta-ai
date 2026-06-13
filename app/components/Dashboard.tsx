'use client';

import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import KPIRow from './KPIRow';
import Funnel from './Funnel';
import InsightCard from './InsightCard';
import Appointments from './Appointments';
import Pipeline from './Pipeline';
import Conversations from './Conversations';
import AgentConfig from './AgentConfig';
import StripeConfig from './StripeConfig';
import PaypalConfig from './PaypalConfig';
import TransferConfig from './TransferConfig';
import FormSubmissions from './FormSubmissions';
import CalendarConfig from './CalendarConfig';
import KnowledgeBase from './KnowledgeBase';
import AdminPanel from './AdminPanel';

interface AuthState {
  authenticated: boolean;
  user: { id: string; email: string } | null;
  role: string | null;
  is_super_admin: boolean;
}

export default function Dashboard() {
  const [view, setView] = useState('Panorama');
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (!data.authenticated) {
          window.location.href = '/login';
          return;
        }
        setAuth(data);
        setLoading(false);
      })
      .catch(() => {
        window.location.href = '/login';
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-ink-soft text-sm">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[240px_1fr] max-md:grid-cols-1 min-h-screen">
      <Sidebar activeView={view} onNavigate={setView} isSuperAdmin={auth?.is_super_admin || false} onLogout={handleLogout} />

      <main className="py-7 px-9 max-md:px-5 max-md:pt-[70px] max-w-[1500px]">
        <Topbar />

        {view === 'Panorama' && (
          <>
            <KPIRow />
            <section className="grid grid-cols-2 max-lg:grid-cols-1 gap-7 mb-9">
              <Funnel />
              <div className="flex flex-col gap-6">
                <InsightCard />
                <Appointments />
              </div>
            </section>
            <Pipeline />
            <section className="grid grid-cols-2 max-lg:grid-cols-1 gap-7">
              <Conversations />
              <AgentConfig />
            </section>
          </>
        )}

        {view === 'Pipeline' && <Pipeline />}
        {view === 'Conversaciones' && <Conversations />}
        {view === 'Agenda' && <Appointments />}
        {view === 'Agente IA' && <AgentConfig />}

        {view === 'Métricas' && (
          <>
            <KPIRow />
            <section className="grid grid-cols-2 max-lg:grid-cols-1 gap-7">
              <Funnel />
              <InsightCard />
            </section>
          </>
        )}

        {view === 'Pagos & Stripe' && <StripeConfig />}
        {view === 'PayPal' && <PaypalConfig />}
        {view === 'Transferencias' && <TransferConfig />}
        {view === 'Formularios' && <FormSubmissions />}
        {view === 'Calendario' && <CalendarConfig />}
        {view === 'Base de conocimiento' && <KnowledgeBase />}
        {view === 'Admin' && auth?.is_super_admin && <AdminPanel />}
      </main>
    </div>
  );
}
