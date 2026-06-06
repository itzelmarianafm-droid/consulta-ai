import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getClinicId } from '@/lib/clinic';

const CLINIC_ID = getClinicId();

export async function GET(request: NextRequest) {
  const db = createServerClient();
  const dateParam = request.nextUrl.searchParams.get('date');

  let query = db
    .from('appointments')
    .select('*, lead:leads(name, phone)')
    .eq('clinic_id', CLINIC_ID)
    .order('scheduled_at', { ascending: true });

  if (dateParam === 'today') {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
    query = query.gte('scheduled_at', start).lt('scheduled_at', end);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
