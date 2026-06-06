-- =====================================================================
-- Consulta.ai — Seed Data (DEMO ONLY — do not run in production)
-- =====================================================================

-- Demo clinic
INSERT INTO clinics (id, name, slug, plan) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Clínica Vela', 'clinica-vela', 'atelier');

-- Agent configs for each stage
INSERT INTO agent_configs (clinic_id, stage, persona_prompt, services, rules) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'bienvenida',
  'Eres Sofía, asistente de la Dra. Velasco en Clínica Vela. Hablas con calidez profesional, sin tecnicismos médicos. Tuteas siempre. Nunca presionas; resuelves dudas y proyectas confianza. Si detectas duda económica, mencionas plan a meses sin intereses solo si lo preguntan.',
  ARRAY['Botox', 'Ácido hialurónico', 'Hilos tensores', 'Peelings', 'Bichectomía'],
  '{"cobro_anticipo": true, "recordatorios": true, "reagendar": true, "escalar_humano": true}'
),
(
  '00000000-0000-0000-0000-000000000001',
  'calificacion',
  'Eres Sofía, asistente de la Dra. Velasco en Clínica Vela. Hablas con calidez profesional, sin tecnicismos médicos. Tuteas siempre. Nunca presionas; resuelves dudas y proyectas confianza.',
  ARRAY['Botox', 'Ácido hialurónico', 'Hilos tensores', 'Peelings', 'Bichectomía'],
  '{"cobro_anticipo": true, "recordatorios": true, "reagendar": true, "escalar_humano": true}'
),
(
  '00000000-0000-0000-0000-000000000001',
  'educacion',
  'Eres Sofía, asistente de la Dra. Velasco en Clínica Vela. Hablas con calidez profesional, sin tecnicismos médicos. Tuteas siempre. Comparte información relevante y datos concretos de recuperación.',
  ARRAY['Botox', 'Ácido hialurónico', 'Hilos tensores', 'Peelings', 'Bichectomía'],
  '{"cobro_anticipo": true, "recordatorios": true, "reagendar": true, "escalar_humano": true}'
),
(
  '00000000-0000-0000-0000-000000000001',
  'cierre',
  'Eres Sofía, asistente de la Dra. Velasco en Clínica Vela. Tu objetivo es cerrar la cita. Propón fechas concretas y maneja el anticipo con naturalidad.',
  ARRAY['Botox', 'Ácido hialurónico', 'Hilos tensores', 'Peelings', 'Bichectomía'],
  '{"cobro_anticipo": true, "recordatorios": true, "reagendar": true, "escalar_humano": true}'
),
(
  '00000000-0000-0000-0000-000000000001',
  'recuperacion',
  'Eres Sofía, asistente de la Dra. Velasco en Clínica Vela. El paciente dejó de responder. Sé amable y breve, sin presionar. Usa prueba social.',
  ARRAY['Botox', 'Ácido hialurónico', 'Hilos tensores', 'Peelings', 'Bichectomía'],
  '{"cobro_anticipo": true, "recordatorios": true, "reagendar": true, "escalar_humano": true}'
);

-- Sample leads
INSERT INTO leads (clinic_id, name, phone, source, service_interest, stage, heat, potential_amount) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Andrea Solís', '+5218112345001', 'instagram', 'Botox', 'nuevo', 'hot', 1500),
  ('00000000-0000-0000-0000-000000000001', 'Carlos Méndez', '+5218112345002', 'facebook', 'Diseño de sonrisa', 'nuevo', 'warm', 0),
  ('00000000-0000-0000-0000-000000000001', 'Natalia Reyes', '+5218112345003', 'web', 'Plan nutricional', 'nuevo', 'hot', 0),
  ('00000000-0000-0000-0000-000000000001', 'Patricia Ledezma', '+5218112345004', 'whatsapp', 'Bichectomía', 'calificando', 'hot', 8500),
  ('00000000-0000-0000-0000-000000000001', 'Jorge Quintanilla', '+5218112345005', 'whatsapp', 'Implante dental', 'calificando', 'warm', 24000),
  ('00000000-0000-0000-0000-000000000001', 'Diana Salazar', '+5218112345006', 'whatsapp', 'Rinomodelación', 'visto_sin_pagar', 'warm', 6800),
  ('00000000-0000-0000-0000-000000000001', 'Cristina Ortiz', '+5218112345007', 'instagram', 'Hidratación facial', 'pago_enviado', 'hot', 1500),
  ('00000000-0000-0000-0000-000000000001', 'Mariana Cervantes', '+5218112345008', 'instagram', 'Botox', 'pagado_agendado', 'hot', 1500),
  ('00000000-0000-0000-0000-000000000001', 'Lucía Treviño', '+5218112345009', 'facebook', 'Ácido hialurónico', 'pagado_agendado', 'warm', 4800),
  ('00000000-0000-0000-0000-000000000001', 'Daniela Esquivel', '+5218112345010', 'whatsapp', 'Peelings', 'pagado_agendado', 'warm', 2800);

-- Sample appointments for today
INSERT INTO appointments (clinic_id, lead_id, scheduled_at, service, status) VALUES
  ('00000000-0000-0000-0000-000000000001', (SELECT id FROM leads WHERE name = 'Mariana Cervantes'), now()::date + interval '9 hours 30 minutes', 'Botox preventivo', 'confirmed'),
  ('00000000-0000-0000-0000-000000000001', (SELECT id FROM leads WHERE name = 'Lucía Treviño'), now()::date + interval '12 hours 30 minutes', 'Ácido hialurónico · labios', 'rescheduled'),
  ('00000000-0000-0000-0000-000000000001', (SELECT id FROM leads WHERE name = 'Daniela Esquivel'), now()::date + interval '17 hours 30 minutes', 'Peeling químico', 'confirmed');
