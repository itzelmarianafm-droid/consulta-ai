import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getClinicId } from '@/lib/clinic';

// GET — get all knowledge base entries for clinic
export async function GET() {
  const db = createServerClient();
  const clinicId = getClinicId();

  const { data, error } = await db
    .from('knowledge_base')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('category')
    .order('sort_order');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — add a knowledge base entry
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { category, title, content } = body;

  if (!category || !title || !content) {
    return NextResponse.json({ error: 'category, title, content required' }, { status: 400 });
  }

  const db = createServerClient();
  const clinicId = getClinicId();

  const { data, error } = await db
    .from('knowledge_base')
    .insert({ clinic_id: clinicId, category, title, content })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH — update an entry
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = createServerClient();
  updates.updated_at = new Date().toISOString();

  const { error } = await db.from('knowledge_base').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE — remove an entry
export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = createServerClient();
  const { error } = await db.from('knowledge_base').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
