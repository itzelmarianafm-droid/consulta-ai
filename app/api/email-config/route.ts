import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getClinicId } from '@/lib/clinic';

export async function GET() {
  const db = createServerClient();
  const clinicId = getClinicId();

  const { data, error } = await db
    .from('clinics')
    .select('email_mode, email_from_name, email_from_address, email_external_provider, email_external_api_key, modules')
    .eq('id', clinicId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ...data,
    email_external_api_key: data.email_external_api_key ? '••••' + data.email_external_api_key.slice(-4) : null,
    has_external_key: !!data.email_external_api_key,
    email_enabled: data.modules?.email ?? false,
  });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const db = createServerClient();
  const clinicId = getClinicId();

  const allowed = ['email_mode', 'email_from_name', 'email_from_address', 'email_external_provider', 'email_external_api_key'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key] || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { error } = await db.from('clinics').update(updates).eq('id', clinicId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
