import { cookies } from 'next/headers';
import { createAuthClient } from './auth';

// Resolves the clinic ID from:
// 1. X-Clinic-Id header (for admin switching between clinics)
// 2. User session (normal doctor login)
// 3. CLINIC_ID env var (fallback for webhooks and external calls)
export async function getClinicIdFromSession(): Promise<string | null> {
  const db = createAuthClient();

  const cookieStore = await cookies();
  const token = cookieStore.get('sb-token')?.value;
  if (!token) return process.env.CLINIC_ID || null;

  const { data: { user } } = await db.auth.getUser(token);
  if (!user) return process.env.CLINIC_ID || null;

  // Check for admin clinic override
  const overrideClinic = cookieStore.get('admin-clinic-id')?.value;
  if (overrideClinic) return overrideClinic;

  // Look up user's clinic
  const { data } = await db
    .from('clinic_users')
    .select('clinic_id')
    .eq('user_id', user.id)
    .single();

  return data?.clinic_id || process.env.CLINIC_ID || null;
}

// Sync version for backward compatibility (webhooks, external API calls)
export function getClinicId(): string {
  const id = process.env.CLINIC_ID;
  if (!id) throw new Error('CLINIC_ID environment variable is not set');
  return id;
}
