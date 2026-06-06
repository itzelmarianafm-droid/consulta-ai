-- =====================================================================
-- Migration: Add PayPal fields to clinics + payment_method and
-- transfer_proof to payments table
-- Run this in Supabase SQL Editor
-- =====================================================================

-- PayPal config per clinic
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS paypal_client_id TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS paypal_secret TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS paypal_webhook_id TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS paypal_active BOOLEAN DEFAULT false;

-- Bank transfer config per clinic
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS bank_clabe TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS bank_holder TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS bank_active BOOLEAN DEFAULT false;

-- Payment method tracking + transfer proof image
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'stripe'
  CHECK (payment_method IN ('stripe', 'paypal', 'transfer'));
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transfer_proof_url TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS notes TEXT;
