import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getClinicId } from '@/lib/clinic';
import type { Metrics, LeadStage } from '@/lib/types';

const CLINIC_ID = getClinicId();

export async function GET() {
  const db = createServerClient();

  // Current month range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

  // Current month leads
  const { data: currentLeads } = await db
    .from('leads')
    .select('*')
    .eq('clinic_id', CLINIC_ID)
    .gte('created_at', startOfMonth);

  // Previous month leads
  const { data: prevLeads } = await db
    .from('leads')
    .select('*')
    .eq('clinic_id', CLINIC_ID)
    .gte('created_at', startOfPrevMonth)
    .lt('created_at', endOfPrevMonth);

  // Current month payments
  const { data: currentPayments } = await db
    .from('payments')
    .select('*')
    .eq('clinic_id', CLINIC_ID)
    .eq('status', 'completed')
    .gte('created_at', startOfMonth);

  const { data: prevPayments } = await db
    .from('payments')
    .select('*')
    .eq('clinic_id', CLINIC_ID)
    .eq('status', 'completed')
    .gte('created_at', startOfPrevMonth)
    .lt('created_at', endOfPrevMonth);

  // All leads for funnel (current month)
  const { data: allLeads } = await db
    .from('leads')
    .select('stage')
    .eq('clinic_id', CLINIC_ID);

  const leads = currentLeads || [];
  const prev = prevLeads || [];
  const payments = currentPayments || [];
  const prevPay = prevPayments || [];
  const all = allLeads || [];

  const leadsCount = leads.length;
  const leadsPrev = prev.length;

  const paidCount = leads.filter((l) => l.stage === 'pagado_agendado').length;
  const paidPrev = prev.filter((l) => l.stage === 'pagado_agendado').length;
  const closeRate = leadsCount > 0 ? (paidCount / leadsCount) * 100 : 0;
  const closeRatePrev = leadsPrev > 0 ? (paidPrev / leadsPrev) * 100 : 0;

  const revenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const revenuePrev = prevPay.reduce((sum, p) => sum + (p.amount || 0), 0);
  const avgPayment = payments.length > 0 ? revenue / payments.length : 0;

  // Funnel counts from all leads
  const stages: LeadStage[] = ['nuevo', 'calificando', 'visto_sin_pagar', 'pago_enviado', 'pagado_agendado'];
  const totalAll = all.length || 1;

  // Funnel is cumulative: each stage includes all leads that reached it or beyond
  const stageOrder = stages.reduce((acc, s, i) => ({ ...acc, [s]: i }), {} as Record<string, number>);

  const funnel = stages.map((stage, idx) => {
    const count = all.filter((l) => stageOrder[l.stage] >= idx).length;
    return {
      stage,
      count,
      pct: Math.round((count / totalAll) * 1000) / 10,
    };
  });

  const metrics: Metrics = {
    leads_count: leadsCount,
    leads_prev: leadsPrev,
    close_rate: Math.round(closeRate * 10) / 10,
    close_rate_prev: Math.round(closeRatePrev * 10) / 10,
    revenue,
    revenue_prev: revenuePrev,
    avg_response_time_seconds: 0,
    avg_response_time_prev: 0,
    paid_count: paidCount,
    avg_payment: Math.round(avgPayment),
    funnel,
  };

  return NextResponse.json(metrics);
}
