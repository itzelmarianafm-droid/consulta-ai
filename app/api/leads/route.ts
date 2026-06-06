import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getClinicId } from '@/lib/clinic';

const CLINIC_ID = getClinicId();

export async function GET(request: NextRequest) {
  const db = createServerClient();
  const grouped = request.nextUrl.searchParams.get('grouped');

  let query = db
    .from('leads')
    .select('*')
    .eq('clinic_id', CLINIC_ID)
    .order('updated_at', { ascending: false });

  if (grouped === 'stage') {
    // Return all leads, client groups by stage
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Group by stage
    const stages = ['nuevo', 'calificando', 'visto_sin_pagar', 'pago_enviado', 'pagado_agendado'];
    const pipeline = stages.map((stage) => ({
      stage,
      leads: (data || []).filter((l) => l.stage === stage),
      count: (data || []).filter((l) => l.stage === stage).length,
    }));

    return NextResponse.json(pipeline);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = createServerClient();
  const { data, error } = await db
    .from('leads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
