import { NextRequest, NextResponse } from 'next/server';
import { createInstance, getQrCode, getConnectionState, logoutInstance } from '@/lib/evolution-api';
import { createServerClient } from '@/lib/supabase/server';
import { getClinicIdFromSession } from '@/lib/clinic';

export async function GET() {
  const clinicId = await getClinicIdFromSession();
  if (!clinicId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const db = createServerClient();
  const { data: clinic } = await db
    .from('clinics')
    .select('slug')
    .eq('id', clinicId)
    .single();

  if (!clinic) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

  const instanceName = `clinic-${clinic.slug}`;
  const state = await getConnectionState(instanceName);

  if (state === 'open') {
    return NextResponse.json({ status: 'connected', instanceName });
  }

  const qr = await getQrCode(instanceName);
  if (qr) {
    return NextResponse.json({ status: 'qr', qr: qr.base64, code: qr.code, instanceName });
  }

  return NextResponse.json({ status: 'disconnected', instanceName });
}

export async function POST(request: NextRequest) {
  const clinicId = await getClinicIdFromSession();
  if (!clinicId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const db = createServerClient();
  const { data: clinic } = await db
    .from('clinics')
    .select('slug')
    .eq('id', clinicId)
    .single();

  if (!clinic) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });

  const body = await request.json();
  const action = body.action;
  const instanceName = `clinic-${clinic.slug}`;

  if (action === 'create') {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://consulta-ai-qv3f.vercel.app';
    const webhookUrl = `${appUrl}/api/webhook/evolution`;

    try {
      const result = await createInstance(instanceName, webhookUrl);
      return NextResponse.json({ ok: true, result });
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }

  if (action === 'qr') {
    const qr = await getQrCode(instanceName);
    if (qr) {
      return NextResponse.json({ status: 'qr', qr: qr.base64, code: qr.code });
    }
    const state = await getConnectionState(instanceName);
    if (state === 'open') {
      return NextResponse.json({ status: 'connected' });
    }
    return NextResponse.json({ status: 'waiting' });
  }

  if (action === 'logout') {
    await logoutInstance(instanceName);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
