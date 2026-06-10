import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 });
  }

  const db = createAuthClient();
  const { data, error } = await db.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }

  // Check if user has a clinic assigned or is super admin
  const { data: clinicUser } = await db
    .from('clinic_users')
    .select('clinic_id, role')
    .eq('user_id', data.user.id)
    .single();

  const SUPER_ADMIN_EMAIL = 'itzelmarianafm@gmail.com';
  const isSuperAdmin = email === SUPER_ADMIN_EMAIL;

  if (!clinicUser && !isSuperAdmin) {
    return NextResponse.json({ error: 'Tu cuenta no tiene una clínica asignada. Contacta al administrador.' }, { status: 403 });
  }

  const response = NextResponse.json({
    success: true,
    user: { id: data.user.id, email: data.user.email },
    role: isSuperAdmin ? 'super_admin' : clinicUser?.role,
    clinic_id: clinicUser?.clinic_id || null,
  });

  response.cookies.set('sb-token', data.session.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
