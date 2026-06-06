import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getClinicId } from '@/lib/clinic';

export async function GET() {
  const db = createServerClient();
  const clinicId = getClinicId();

  const { data, error } = await db
    .from('clinics')
    .select('paypal_client_id, paypal_secret, paypal_webhook_id, paypal_active')
    .eq('id', clinicId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    paypal_client_id: data.paypal_client_id ? maskKey(data.paypal_client_id) : null,
    paypal_secret: data.paypal_secret ? maskKey(data.paypal_secret) : null,
    paypal_webhook_id: data.paypal_webhook_id || null,
    paypal_active: data.paypal_active ?? false,
    has_client_id: !!data.paypal_client_id,
    has_secret: !!data.paypal_secret,
    has_webhook_id: !!data.paypal_webhook_id,
  });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { paypal_client_id, paypal_secret, paypal_webhook_id, paypal_active } = body;

  const db = createServerClient();
  const clinicId = getClinicId();

  const updates: Record<string, unknown> = {};
  if (paypal_client_id !== undefined) updates.paypal_client_id = paypal_client_id || null;
  if (paypal_secret !== undefined) updates.paypal_secret = paypal_secret || null;
  if (paypal_webhook_id !== undefined) updates.paypal_webhook_id = paypal_webhook_id || null;
  if (paypal_active !== undefined) updates.paypal_active = paypal_active;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { error } = await db.from('clinics').update(updates).eq('id', clinicId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

function maskKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return key.slice(0, 7) + '••••' + key.slice(-4);
}
