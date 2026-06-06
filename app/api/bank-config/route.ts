import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getClinicId } from '@/lib/clinic';

export async function GET() {
  const db = createServerClient();
  const clinicId = getClinicId();

  const { data, error } = await db
    .from('clinics')
    .select('bank_name, bank_clabe, bank_holder, bank_active')
    .eq('id', clinicId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { bank_name, bank_clabe, bank_holder, bank_active } = body;

  const db = createServerClient();
  const clinicId = getClinicId();

  const updates: Record<string, unknown> = {};
  if (bank_name !== undefined) updates.bank_name = bank_name || null;
  if (bank_clabe !== undefined) updates.bank_clabe = bank_clabe || null;
  if (bank_holder !== undefined) updates.bank_holder = bank_holder || null;
  if (bank_active !== undefined) updates.bank_active = bank_active;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { error } = await db.from('clinics').update(updates).eq('id', clinicId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
