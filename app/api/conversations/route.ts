import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getClinicId } from '@/lib/clinic';

const CLINIC_ID = getClinicId();

export async function GET(request: NextRequest) {
  const db = createServerClient();
  const status = request.nextUrl.searchParams.get('status') || 'active';

  // Get conversations with lead info and last message
  const { data: conversations, error } = await db
    .from('conversations')
    .select(`
      *,
      lead:leads(*),
      messages(content, role, created_at)
    `)
    .eq('clinic_id', CLINIC_ID)
    .eq('status', status)
    .order('updated_at', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flatten: attach the last message to each conversation
  const result = (conversations || []).map((c) => {
    const msgs = c.messages || [];
    const lastMsg = msgs.sort(
      (a: { created_at: string }, b: { created_at: string }) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    return {
      ...c,
      messages: undefined,
      last_message: lastMsg || null,
    };
  });

  return NextResponse.json(result);
}
