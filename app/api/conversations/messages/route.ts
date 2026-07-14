import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const conversationId = request.nextUrl.searchParams.get('conversation_id');
  if (!conversationId) return NextResponse.json({ error: 'conversation_id required' }, { status: 400 });

  const db = createServerClient();

  const { data, error } = await db
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data || []);
}
