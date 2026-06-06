import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getClinicId } from '@/lib/clinic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// GET — list form submissions for dashboard
export async function GET(request: NextRequest) {
  const db = createServerClient();
  const clinicId = getClinicId();
  const status = request.nextUrl.searchParams.get('status');

  let query = db
    .from('form_submissions')
    .select('*, lead:leads(name, phone, stage, heat)')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });

  return NextResponse.json(data, { headers: CORS_HEADERS });
}

// POST — receive form submission from landing page
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { nombre, email, whatsapp, ciudad, notas, form_name, utm_source, utm_medium, utm_campaign, utm_content, ...rest } = body;

  const db = createServerClient();
  const clinicId = getClinicId();

  // Create or find lead by phone
  let leadId = null;
  if (whatsapp) {
    const phone = whatsapp.startsWith('+') ? whatsapp : `+${whatsapp}`;

    const { data: existing } = await db
      .from('leads')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('phone', phone)
      .single();

    if (existing) {
      leadId = existing.id;
      await db.from('leads').update({
        name: nombre || undefined,
        updated_at: new Date().toISOString(),
      }).eq('id', leadId);
    } else {
      const { data: newLead } = await db
        .from('leads')
        .insert({
          clinic_id: clinicId,
          name: nombre || null,
          phone,
          source: utm_source || 'landing',
          stage: 'nuevo',
          heat: 'hot',
        })
        .select('id')
        .single();
      leadId = newLead?.id || null;
    }
  }

  // Save form submission
  const { data, error } = await db
    .from('form_submissions')
    .insert({
      clinic_id: clinicId,
      lead_id: leadId,
      form_name: form_name || 'diagnostico',
      data: { nombre, email, whatsapp, ciudad, notas, ...rest },
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      utm_content: utm_content || null,
      status: 'new',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });

  return NextResponse.json({ success: true, id: data.id, lead_id: leadId }, { headers: CORS_HEADERS });
}

// PATCH — update status of a submission
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, status } = body;

  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400, headers: CORS_HEADERS });

  const db = createServerClient();
  const { error } = await db
    .from('form_submissions')
    .update({ status })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });

  return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
}
