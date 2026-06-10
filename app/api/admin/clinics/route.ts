import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, requireAuth, isSuperAdmin } from '@/lib/auth';

// GET — list all clinics (super admin only)
export async function GET() {
  const { user } = await requireAuth();
  if (!user || !(await isSuperAdmin(user.email || ''))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const db = createAuthClient();
  const { data, error } = await db
    .from('clinics')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Add user count per clinic
  const { data: users } = await db.from('clinic_users').select('clinic_id');

  const clinicsWithUsers = (data || []).map(c => ({
    ...c,
    user_count: (users || []).filter(u => u.clinic_id === c.id).length,
    trial_remaining: c.trial_starts_at && c.plan_status === 'trial'
      ? Math.max(0, c.trial_days - Math.floor((Date.now() - new Date(c.trial_starts_at).getTime()) / 86400000))
      : null,
  }));

  return NextResponse.json(clinicsWithUsers);
}

// POST — create a new clinic + owner user (super admin only)
export async function POST(request: NextRequest) {
  const { user } = await requireAuth();
  if (!user || !(await isSuperAdmin(user.email || ''))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await request.json();
  const { name, slug, owner_email, owner_password, trial_days, plan_status, plan_price, plan_currency, plan_payment_method } = body;

  if (!name || !slug || !owner_email || !owner_password) {
    return NextResponse.json({ error: 'name, slug, owner_email, owner_password son requeridos' }, { status: 400 });
  }

  const db = createAuthClient();

  // Create clinic
  const { data: clinic, error: clinicError } = await db
    .from('clinics')
    .insert({
      name,
      slug,
      plan: 'starter',
      plan_status: plan_status || 'trial',
      trial_days: trial_days ?? 14,
      trial_starts_at: plan_status === 'trial' || !plan_status ? new Date().toISOString() : null,
      plan_price: plan_price || 0,
      plan_currency: plan_currency || 'usd',
      plan_payment_method: plan_payment_method || 'stripe',
      owner_email,
    })
    .select()
    .single();

  if (clinicError) return NextResponse.json({ error: clinicError.message }, { status: 500 });

  // Create auth user for the owner
  const { data: authUser, error: authError } = await db.auth.admin.createUser({
    email: owner_email,
    password: owner_password,
    email_confirm: true,
  });

  if (authError) {
    // User might already exist — try to find them
    const { data: existingUsers } = await db.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(u => u.email === owner_email);

    if (existing) {
      // Link existing user to new clinic
      await db.from('clinic_users').insert({
        user_id: existing.id,
        clinic_id: clinic.id,
        role: 'owner',
      });
    } else {
      return NextResponse.json({ error: `Error creando usuario: ${authError.message}` }, { status: 500 });
    }
  } else {
    // Link new user to clinic
    await db.from('clinic_users').insert({
      user_id: authUser.user.id,
      clinic_id: clinic.id,
      role: 'owner',
    });
  }

  // Create default agent configs for the new clinic
  const stages = ['bienvenida', 'calificacion', 'educacion', 'cierre', 'recuperacion'];
  const defaultPrompt = `Eres la asistente de ${name}. Hablas con calidez profesional. Tuteas siempre.`;

  for (const stage of stages) {
    await db.from('agent_configs').insert({
      clinic_id: clinic.id,
      stage,
      persona_prompt: defaultPrompt,
      services: [],
      rules: { cobro_anticipo: true, recordatorios: true, reagendar: true, escalar_humano: true },
    });
  }

  return NextResponse.json({ success: true, clinic });
}

// PATCH — update clinic plan/settings (super admin only)
export async function PATCH(request: NextRequest) {
  const { user } = await requireAuth();
  if (!user || !(await isSuperAdmin(user.email || ''))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = createAuthClient();
  const { error } = await db.from('clinics').update(updates).eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
