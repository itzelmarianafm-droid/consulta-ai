import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getClinicId } from '@/lib/clinic';

// GET — leads who submitted the form but didn't click "book"
export async function GET() {
  const db = createServerClient();
  const clinicId = getClinicId();

  // Get form submissions that are still "new" (never clicked calendar)
  // and were created more than 30 minutes ago
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const { data, error } = await db
    .from('form_submissions')
    .select('*, lead:leads(name, phone, stage, heat)')
    .eq('clinic_id', clinicId)
    .eq('status', 'new')
    .lt('created_at', thirtyMinAgo)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
