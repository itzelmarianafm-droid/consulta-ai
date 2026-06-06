import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getClinicId } from '@/lib/clinic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// POST — book an appointment from landing page
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { lead_id, datetime, service } = body;

  if (!lead_id || !datetime) {
    return NextResponse.json({ error: 'lead_id and datetime required' }, { status: 400, headers: CORS_HEADERS });
  }

  const db = createServerClient();
  const clinicId = getClinicId();

  // Check if slot is still available
  const { data: existing } = await db
    .from('appointments')
    .select('id')
    .eq('clinic_id', clinicId)
    .eq('scheduled_at', datetime)
    .in('status', ['pending', 'confirmed'])
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Este horario ya fue reservado. Elige otro.' }, { status: 409, headers: CORS_HEADERS });
  }

  // Create appointment
  const { data, error } = await db
    .from('appointments')
    .insert({
      clinic_id: clinicId,
      lead_id,
      scheduled_at: datetime,
      service: service || 'Llamada estratégica',
      status: 'confirmed',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });

  // Update lead stage
  await db
    .from('leads')
    .update({ stage: 'pagado_agendado', updated_at: new Date().toISOString() })
    .eq('id', lead_id);

  // Update form submission status to booked
  await db
    .from('form_submissions')
    .update({ status: 'booked' })
    .eq('lead_id', lead_id)
    .eq('status', 'new');

  return NextResponse.json({ success: true, appointment: data }, { headers: CORS_HEADERS });
}
