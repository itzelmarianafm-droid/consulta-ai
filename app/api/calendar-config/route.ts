import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getClinicId } from '@/lib/clinic';

export async function GET() {
  const db = createServerClient();
  const clinicId = getClinicId();

  const { data, error } = await db
    .from('clinics')
    .select('calendar_mode, calendar_external_url')
    .eq('id', clinicId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { calendar_mode, calendar_external_url } = body;

  const db = createServerClient();
  const clinicId = getClinicId();

  const updates: Record<string, unknown> = {};
  if (calendar_mode !== undefined) updates.calendar_mode = calendar_mode;
  if (calendar_external_url !== undefined) updates.calendar_external_url = calendar_external_url || null;

  const { error } = await db.from('clinics').update(updates).eq('id', clinicId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
