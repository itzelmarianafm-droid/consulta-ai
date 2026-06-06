-- =====================================================================
-- Consulta.ai — Database Schema
-- Run this in Supabase SQL Editor (https://supabase.com → tu proyecto → SQL Editor)
-- =====================================================================

-- 1. Clínicas (multi-tenant ready)
CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'starter',
  whatsapp_phone_id TEXT,
  whatsapp_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Configuración del agente por clínica y etapa
CREATE TABLE agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('bienvenida','calificacion','educacion','cierre','recuperacion')),
  persona_prompt TEXT NOT NULL,
  services TEXT[] DEFAULT '{}',
  rules JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (clinic_id, stage)
);

-- 3. Leads / pacientes potenciales
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT NOT NULL,
  source TEXT DEFAULT 'whatsapp',
  service_interest TEXT,
  stage TEXT DEFAULT 'nuevo' CHECK (stage IN ('nuevo','calificando','visto_sin_pagar','pago_enviado','pagado_agendado')),
  heat TEXT DEFAULT 'warm' CHECK (heat IN ('hot','warm','cold')),
  potential_amount INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (clinic_id, phone)
);

-- 4. Conversaciones
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','closed','escalated')),
  current_stage TEXT DEFAULT 'bienvenida',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Mensajes individuales
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  wa_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Citas
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  service TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rescheduled','cancelled','completed')),
  reminder_24h_sent BOOLEAN DEFAULT false,
  reminder_2h_sent BOOLEAN DEFAULT false,
  payment_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Pagos
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  stripe_session_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'mxn',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- ÍNDICES
-- =====================================================================
CREATE INDEX idx_leads_clinic_stage ON leads(clinic_id, stage);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_messages_convo ON messages(conversation_id, created_at);
CREATE INDEX idx_conversations_lead ON conversations(lead_id);
CREATE INDEX idx_appointments_clinic_date ON appointments(clinic_id, scheduled_at);

-- =====================================================================
-- ENABLE REALTIME for live dashboard updates
-- =====================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- =====================================================================
-- SEED DATA — See supabase/seed.sql for demo data
-- In production, create your clinic and agent configs via the app or
-- by running seed.sql with your own values.
-- =====================================================================
