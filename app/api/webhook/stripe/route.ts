import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase/server';

// Stripe sends raw body — disable Next.js body parsing
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  const db = createServerClient();

  // Get all clinics with Stripe configured
  const { data: clinics } = await db
    .from('clinics')
    .select('id, stripe_secret_key, stripe_webhook_secret')
    .eq('stripe_active', true)
    .not('stripe_webhook_secret', 'is', null);

  if (!clinics || clinics.length === 0) {
    return NextResponse.json({ error: 'No clinics with Stripe configured' }, { status: 400 });
  }

  // Try to verify the webhook against each clinic's secret
  let event: Stripe.Event | null = null;
  let matchedClinicId: string | null = null;
  let stripe: Stripe | null = null;

  for (const clinic of clinics) {
    try {
      stripe = new Stripe(clinic.stripe_secret_key, { apiVersion: '2026-05-27.dahlia' });
      event = stripe.webhooks.constructEvent(body, signature, clinic.stripe_webhook_secret);
      matchedClinicId = clinic.id;
      break;
    } catch {
      continue;
    }
  }

  if (!event || !matchedClinicId || !stripe) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      // Update payment status
      if (session.id) {
        await db
          .from('payments')
          .update({ status: 'completed' })
          .eq('stripe_session_id', session.id)
          .eq('clinic_id', matchedClinicId);

        // If there's a lead associated, update their stage
        const { data: payment } = await db
          .from('payments')
          .select('lead_id')
          .eq('stripe_session_id', session.id)
          .eq('clinic_id', matchedClinicId)
          .single();

        if (payment?.lead_id) {
          await db
            .from('leads')
            .update({ stage: 'pagado_agendado', updated_at: new Date().toISOString() })
            .eq('id', payment.lead_id);
        }
      }
      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.id) {
        await db
          .from('payments')
          .update({ status: 'failed' })
          .eq('stripe_session_id', session.id)
          .eq('clinic_id', matchedClinicId);
      }
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      if (charge.payment_intent) {
        await db
          .from('payments')
          .update({ status: 'refunded' })
          .eq('stripe_session_id', charge.payment_intent as string)
          .eq('clinic_id', matchedClinicId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
