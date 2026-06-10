import { NextResponse } from 'next/server';
import { requireAuth, isSuperAdmin } from '@/lib/auth';

export async function GET() {
  const { user, clinicId, role } = await requireAuth();

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: { id: user.id, email: user.email },
    clinic_id: clinicId,
    role,
    is_super_admin: await isSuperAdmin(user.email || ''),
  });
}
