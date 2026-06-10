-- =====================================================================
-- Migration: Multi-tenancy + Auth + Plans
-- Run this in Supabase SQL Editor
-- =====================================================================

-- Users linked to clinics (roles: super_admin, owner, staff)
CREATE TABLE IF NOT EXISTS clinic_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('super_admin', 'owner', 'staff')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, clinic_id)
);

-- Plan and trial fields on clinics
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'trial'
  CHECK (plan_status IN ('trial', 'active', 'expired', 'suspended'));
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 14;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS trial_starts_at TIMESTAMPTZ;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS plan_price NUMERIC(10,2) DEFAULT 0;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS plan_currency TEXT DEFAULT 'usd';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS plan_payment_method TEXT DEFAULT 'stripe'
  CHECK (plan_payment_method IN ('stripe', 'paypal', 'hotmart', 'transfer', 'free'));
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS owner_email TEXT;

-- Index
CREATE INDEX IF NOT EXISTS idx_clinic_users_user ON clinic_users(user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_users_clinic ON clinic_users(clinic_id);
