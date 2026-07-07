-- =====================================================================
-- Migration: Modules system + Email campaigns
-- Run this in Supabase SQL Editor
-- =====================================================================

-- Modules per clinic (which features are enabled)
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '{"email": false, "whatsapp": false}';

-- Email campaigns
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  cta_text TEXT,
  cta_url TEXT,
  segment TEXT DEFAULT 'all' CHECK (segment IN ('all', 'nuevo', 'calificando', 'visto_sin_pagar', 'pago_enviado', 'pagado_agendado')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'failed')),
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Email config per clinic (built-in Resend or external)
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS email_mode TEXT DEFAULT 'built_in'
  CHECK (email_mode IN ('built_in', 'external'));
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS email_from_name TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS email_from_address TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS email_external_api_key TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS email_external_provider TEXT
  CHECK (email_external_provider IN ('brevo', 'mailchimp', 'sendgrid'));

CREATE INDEX IF NOT EXISTS idx_email_campaigns_clinic ON email_campaigns(clinic_id, created_at DESC);
