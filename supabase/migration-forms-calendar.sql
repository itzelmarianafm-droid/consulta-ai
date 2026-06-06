-- =====================================================================
-- Migration: Form submissions + Calendar slots
-- Run this in Supabase SQL Editor
-- =====================================================================

-- Form submissions from landing pages
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  form_name TEXT NOT NULL DEFAULT 'diagnostico',
  data JSONB NOT NULL DEFAULT '{}',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'contacted', 'booked', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Calendar: available time slots configured by the clinic
CREATE TABLE IF NOT EXISTS calendar_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Calendar config per clinic (external calendar URL or built-in)
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS calendar_mode TEXT DEFAULT 'built_in'
  CHECK (calendar_mode IN ('built_in', 'external'));
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS calendar_external_url TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_form_submissions_clinic ON form_submissions(clinic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_slots_clinic ON calendar_slots(clinic_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_appointments_lead ON appointments(lead_id);
