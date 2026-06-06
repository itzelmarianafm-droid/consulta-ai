// =====================================================================
// Consulta.ai — Core Types
// =====================================================================

export type LeadStage =
  | 'nuevo'
  | 'calificando'
  | 'visto_sin_pagar'
  | 'pago_enviado'
  | 'pagado_agendado';

export type LeadHeat = 'hot' | 'warm' | 'cold';

export type AgentStage =
  | 'bienvenida'
  | 'calificacion'
  | 'educacion'
  | 'cierre'
  | 'recuperacion';

export type ConversationStatus = 'active' | 'closed' | 'escalated';
export type MessageRole = 'user' | 'assistant' | 'system';
export type AppointmentStatus = 'pending' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  plan: string;
  whatsapp_phone_id: string | null;
  whatsapp_token: string | null;
  stripe_secret_key: string | null;
  stripe_webhook_secret: string | null;
  stripe_active: boolean;
  paypal_client_id: string | null;
  paypal_secret: string | null;
  paypal_webhook_id: string | null;
  paypal_active: boolean;
  bank_name: string | null;
  bank_clabe: string | null;
  bank_holder: string | null;
  bank_active: boolean;
  created_at: string;
}

export interface AgentConfig {
  id: string;
  clinic_id: string;
  stage: AgentStage;
  persona_prompt: string;
  services: string[];
  rules: {
    cobro_anticipo?: boolean;
    recordatorios?: boolean;
    reagendar?: boolean;
    escalar_humano?: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  clinic_id: string;
  name: string | null;
  phone: string;
  source: string;
  service_interest: string | null;
  stage: LeadStage;
  heat: LeadHeat;
  potential_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  lead_id: string;
  clinic_id: string;
  status: ConversationStatus;
  current_stage: AgentStage;
  created_at: string;
  updated_at: string;
  // Joined fields
  lead?: Lead;
  last_message?: Message;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  wa_message_id: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  lead_id: string;
  clinic_id: string;
  scheduled_at: string;
  service: string | null;
  status: AppointmentStatus;
  reminder_24h_sent: boolean;
  reminder_2h_sent: boolean;
  payment_id: string | null;
  created_at: string;
  // Joined
  lead?: Lead;
}

export type PaymentMethod = 'stripe' | 'paypal' | 'transfer';

export interface Payment {
  id: string;
  lead_id: string;
  clinic_id: string;
  stripe_session_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  transfer_proof_url: string | null;
  notes: string | null;
  created_at: string;
  lead?: Lead;
}

// KPI metrics returned by /api/metrics
export interface Metrics {
  leads_count: number;
  leads_prev: number;
  close_rate: number;
  close_rate_prev: number;
  revenue: number;
  revenue_prev: number;
  avg_response_time_seconds: number;
  avg_response_time_prev: number;
  paid_count: number;
  avg_payment: number;
  funnel: {
    stage: LeadStage;
    count: number;
    pct: number;
  }[];
}

// AI agent response structure
export interface AgentResponse {
  message: string;
  nextStage?: AgentStage;
  heat?: LeadHeat;
  serviceDetected?: string;
  nameDetected?: string;
  shouldEscalate?: boolean;
}
