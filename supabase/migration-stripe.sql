-- =====================================================================
-- Migration: Add Stripe fields to clinics table
-- Run this in Supabase SQL Editor
-- =====================================================================

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS stripe_webhook_secret TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS stripe_active BOOLEAN DEFAULT false;
