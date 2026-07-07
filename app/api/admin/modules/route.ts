import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, requireAuth, isSuperAdmin } from '@/lib/auth';

// PATCH — toggle modules for a clinic (super admin only)
export async function PATCH(request: NextRequest) {
  const { user } = await requireAuth();
  if (!user || !(await isSuperAdmin(user.email || ''))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { clinic_id, modules } = await request.json();
  if (!clinic_id || !modules) {
    return NextResponse.json({ error: 'clinic_id and modules required' }, { status: 400 });
  }

  const db = createAuthClient();
  const { error } = await db.from('clinics').update({ modules }).eq('id', clinic_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
