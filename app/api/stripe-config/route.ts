import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getClinicId } from '@/lib/clinic';

// GET — retrieve Stripe config for current clinic (keys masked)
export async function GET() {
  const db = createServerClient();
  const clinicId = getClinicId();

  const { data, error } = await db
    .from('clinics')
    .select('stripe_secret_key, stripe_webhook_secret, stripe_active')
    .eq('id', clinicId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    stripe_secret_key: data.stripe_secret_key ? maskKey(data.stripe_secret_key) : null,
    stripe_webhook_secret: data.stripe_webhook_secret ? maskKey(data.stripe_webhook_secret) : null,
    stripe_active: data.stripe_active ?? false,
    has_secret_key: !!data.stripe_secret_key,
    has_webhook_secret: !!data.stripe_webhook_secret,
  });
}

// PUT — update Stripe config
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { stripe_secret_key, stripe_webhook_secret, stripe_active } = body;

  const db = createServerClient();
  const clinicId = getClinicId();

  const updates: Record<string, unknown> = {};

  if (stripe_secret_key !== undefined) updates.stripe_secret_key = stripe_secret_key || null;
  if (stripe_webhook_secret !== undefined) updates.stripe_webhook_secret = stripe_webhook_secret || null;
  if (stripe_active !== undefined) updates.stripe_active = stripe_active;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { error } = await db
    .from('clinics')
    .update(updates)
    .eq('id', clinicId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

function maskKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return key.slice(0, 7) + '••••' + key.slice(-4);
}
