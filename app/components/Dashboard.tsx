'use client';

import { useState } from 'react';
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

export default function Dashboard() {
  const [view, setView] = useState('Panorama');

  return (
    <div className="grid grid-cols-[240px_1fr] max-md:grid-cols-1 min-h-screen">
      <Sidebar activeView={view} onNavigate={setView} />

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
      </main>
    </div>
  );
}
