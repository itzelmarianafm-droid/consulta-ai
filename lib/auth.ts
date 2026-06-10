import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const SUPER_ADMIN_EMAIL = 'itzelmarianafm@gmail.com';

export function createAuthClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-token')?.value;
  if (!token) return null;

  const db = createAuthClient();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return null;

  return user;
}

export async function getClinicForUser(userId: string) {
  const db = createAuthClient();

  const { data } = await db
    .from('clinic_users')
    .select('clinic_id, role')
    .eq('user_id', userId)
    .single();

  return data;
}

export async function isSuperAdmin(email: string): Promise<boolean> {
  return email === SUPER_ADMIN_EMAIL;
}

export async function requireAuth() {
  const user = await getSession();
  if (!user) return { user: null, clinicId: null, role: null };

  const isAdmin = await isSuperAdmin(user.email || '');

  if (isAdmin) {
    // Super admin: check if CLINIC_ID env var is set for a specific clinic context
    const envClinicId = process.env.CLINIC_ID;
    return { user, clinicId: envClinicId || null, role: 'super_admin' as const };
  }

  const clinicUser = await getClinicForUser(user.id);
  if (!clinicUser) return { user, clinicId: null, role: null };

  return { user, clinicId: clinicUser.clinic_id, role: clinicUser.role };
}

export { SUPER_ADMIN_EMAIL };
