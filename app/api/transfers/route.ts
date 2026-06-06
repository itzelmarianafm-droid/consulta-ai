import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getClinicId } from '@/lib/clinic';

// GET — list transfer payments for this clinic
export async function GET() {
  const db = createServerClient();
  const clinicId = getClinicId();

  const { data, error } = await db
    .from('payments')
    .select('*, lead:leads(name, phone)')
    .eq('clinic_id', clinicId)
    .eq('payment_method', 'transfer')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — register a new transfer payment with proof image
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { lead_id, amount, notes, transfer_proof_url } = body;

  if (!lead_id || !amount) {
    return NextResponse.json({ error: 'lead_id and amount are required' }, { status: 400 });
  }

  const db = createServerClient();
  const clinicId = getClinicId();

  const { data, error } = await db
    .from('payments')
    .insert({
      lead_id,
      clinic_id: clinicId,
      amount: Math.round(Number(amount)),
      currency: 'mxn',
      status: 'completed',
      payment_method: 'transfer',
      transfer_proof_url: transfer_proof_url || null,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update lead stage to pagado_agendado
  await db
    .from('leads')
    .update({ stage: 'pagado_agendado', updated_at: new Date().toISOString() })
    .eq('id', lead_id);

  return NextResponse.json(data);
}
