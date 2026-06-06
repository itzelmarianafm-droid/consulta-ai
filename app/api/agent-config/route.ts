import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getClinicId } from '@/lib/clinic';

const CLINIC_ID = getClinicId();

export async function GET(request: NextRequest) {
  const db = createServerClient();
  const stage = request.nextUrl.searchParams.get('stage');

  let query = db
    .from('agent_configs')
    .select('*')
    .eq('clinic_id', CLINIC_ID);

  if (stage) {
    query = query.eq('stage', stage);
    const { data, error } = await query.single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const { data, error } = await query.order('created_at');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { stage, persona_prompt, services, rules } = body;

  if (!stage) return NextResponse.json({ error: 'stage required' }, { status: 400 });

  const db = createServerClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (persona_prompt !== undefined) updates.persona_prompt = persona_prompt;
  if (services !== undefined) updates.services = services;
  if (rules !== undefined) updates.rules = rules;

  const { data, error } = await db
    .from('agent_configs')
    .update(updates)
    .eq('clinic_id', CLINIC_ID)
    .eq('stage', stage)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
