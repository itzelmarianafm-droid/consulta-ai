import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServerClient } from '@/lib/supabase/server';
import { getClinicId } from '@/lib/clinic';

// GET — list campaigns
export async function GET() {
  const db = createServerClient();
  const clinicId = getClinicId();

  const { data, error } = await db
    .from('email_campaigns')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — create and optionally send a campaign
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { subject, body_text, cta_text, cta_url, segment, send_now } = body;

  if (!subject || !body_text) {
    return NextResponse.json({ error: 'subject and body_text required' }, { status: 400 });
  }

  const db = createServerClient();
  const clinicId = getClinicId();

  // Save campaign
  const { data: campaign, error: saveError } = await db
    .from('email_campaigns')
    .insert({
      clinic_id: clinicId,
      subject,
      body_text,
      cta_text: cta_text || null,
      cta_url: cta_url || null,
      segment: segment || 'all',
      status: send_now ? 'sent' : 'draft',
    })
    .select()
    .single();

  if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 });

  if (send_now) {
    const result = await sendCampaign(db, clinicId, campaign);
    return NextResponse.json({ success: true, campaign, ...result });
  }

  return NextResponse.json({ success: true, campaign });
}

async function sendCampaign(db: ReturnType<typeof createServerClient>, clinicId: string, campaign: { id: string; subject: string; body_text: string; cta_text: string | null; cta_url: string | null; segment: string }) {
  // Get clinic email config
  const { data: clinic } = await db
    .from('clinics')
    .select('email_from_name, email_from_address, name')
    .eq('id', clinicId)
    .single();

  const fromName = clinic?.email_from_name || clinic?.name || 'Consulta.ai';
  const fromEmail = clinic?.email_from_address || 'noreply@resend.dev';

  // Get leads to send to
  let query = db.from('leads').select('name, phone').eq('clinic_id', clinicId);

  if (campaign.segment !== 'all') {
    query = query.eq('stage', campaign.segment);
  }

  const { data: leads } = await query;
  if (!leads || leads.length === 0) {
    await db.from('email_campaigns').update({ status: 'failed' }).eq('id', campaign.id);
    return { sent: 0, error: 'No hay leads en este segmento' };
  }

  // For now, we need leads with email — check form_submissions for emails
  const { data: submissions } = await db
    .from('form_submissions')
    .select('data')
    .eq('clinic_id', clinicId);

  const emails = (submissions || [])
    .map(s => ({ email: s.data?.email, name: s.data?.nombre }))
    .filter(e => e.email);

  if (emails.length === 0) {
    await db.from('email_campaigns').update({ status: 'failed' }).eq('id', campaign.id);
    return { sent: 0, error: 'No hay emails en la base de datos' };
  }

  // Build HTML email
  const html = buildEmailHtml(campaign, fromName);

  // Send via Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    await db.from('email_campaigns').update({ status: 'failed' }).eq('id', campaign.id);
    return { sent: 0, error: 'RESEND_API_KEY no configurada' };
  }

  const resend = new Resend(resendKey);
  let sentCount = 0;

  for (const contact of emails) {
    try {
      await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: contact.email,
        subject: campaign.subject,
        html,
      });
      sentCount++;
    } catch (err) {
      console.error('[Email] Error sending to', contact.email, err);
    }
  }

  await db.from('email_campaigns').update({
    sent_count: sentCount,
    sent_at: new Date().toISOString(),
    status: sentCount > 0 ? 'sent' : 'failed',
  }).eq('id', campaign.id);

  return { sent: sentCount };
}

function buildEmailHtml(campaign: { subject: string; body_text: string; cta_text: string | null; cta_url: string | null }, fromName: string): string {
  const ctaHtml = campaign.cta_text && campaign.cta_url
    ? `<div style="text-align:center;margin:32px 0;">
        <a href="${campaign.cta_url}" style="display:inline-block;background:#5C3D2E;color:#FAF7F2;padding:14px 36px;border-radius:6px;font-weight:600;font-size:16px;text-decoration:none;">${campaign.cta_text}</a>
      </div>`
    : '';

  const bodyHtml = campaign.body_text.split('\n').map(p => `<p style="margin:0 0 16px;color:#1A1A1A;font-size:16px;line-height:1.6;">${p}</p>`).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F5F3EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="background:#FFFFFF;border-radius:8px;padding:40px 32px;border:1px solid #E8E0D4;">
      ${bodyHtml}
      ${ctaHtml}
    </div>
    <p style="text-align:center;margin-top:24px;font-size:12px;color:#7A7A7A;">
      ${fromName} · Este email fue enviado porque te registraste en nuestro sitio.
    </p>
  </div>
</body></html>`;
}
