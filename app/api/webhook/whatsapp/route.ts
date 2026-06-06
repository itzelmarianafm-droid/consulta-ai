import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendMessage, markAsRead, verifyWebhook, parseWebhookPayload } from '@/lib/whatsapp';
import { generateResponse } from '@/lib/ai-agent';
import type { AgentConfig, Conversation, Lead, Message } from '@/lib/types';

import { getClinicId } from '@/lib/clinic';

const CLINIC_ID = getClinicId();

// GET — Meta webhook verification
export async function GET(request: NextRequest) {
  const challenge = verifyWebhook(request.nextUrl.searchParams);

  if (challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// POST — Incoming WhatsApp messages
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Parse the incoming message
  const incoming = parseWebhookPayload(body);
  if (!incoming) {
    // Not a text message or invalid payload — acknowledge receipt
    return NextResponse.json({ status: 'ok' });
  }

  const { from, text, messageId } = incoming;
  const db = createServerClient();

  try {
    // 1. Mark as read immediately
    markAsRead(messageId).catch(() => {});

    // 2. Find or create lead
    let { data: lead } = await db
      .from('leads')
      .select('*')
      .eq('clinic_id', CLINIC_ID)
      .eq('phone', from)
      .single();

    if (!lead) {
      const { data: newLead } = await db
        .from('leads')
        .insert({
          clinic_id: CLINIC_ID,
          phone: from,
          source: 'whatsapp',
          stage: 'nuevo',
          heat: 'warm',
        })
        .select()
        .single();
      lead = newLead as Lead;
    }

    if (!lead) {
      console.error('[Webhook] Failed to create/find lead for', from);
      return NextResponse.json({ status: 'error' }, { status: 500 });
    }

    // 3. Find or create active conversation
    let { data: conversation } = await db
      .from('conversations')
      .select('*')
      .eq('lead_id', lead.id)
      .eq('status', 'active')
      .single();

    if (!conversation) {
      const { data: newConvo } = await db
        .from('conversations')
        .insert({
          lead_id: lead.id,
          clinic_id: CLINIC_ID,
          status: 'active',
          current_stage: 'bienvenida',
        })
        .select()
        .single();
      conversation = newConvo as Conversation;
    }

    if (!conversation) {
      console.error('[Webhook] Failed to create/find conversation');
      return NextResponse.json({ status: 'error' }, { status: 500 });
    }

    // 4. Save user message
    await db.from('messages').insert({
      conversation_id: conversation.id,
      role: 'user',
      content: text,
      wa_message_id: messageId,
    });

    // 5. Load conversation history (last 20 messages)
    const { data: messages } = await db
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(20);

    // 6. Load agent config for current stage
    const { data: config } = await db
      .from('agent_configs')
      .select('*')
      .eq('clinic_id', CLINIC_ID)
      .eq('stage', conversation.current_stage)
      .single();

    if (!config) {
      console.error('[Webhook] No agent config for stage:', conversation.current_stage);
      return NextResponse.json({ status: 'error' }, { status: 500 });
    }

    // 7. Generate AI response
    const aiResponse = await generateResponse(
      config as AgentConfig,
      (messages || []) as Message[],
      conversation.current_stage as AgentConfig['stage']
    );

    // 8. Save AI response
    await db.from('messages').insert({
      conversation_id: conversation.id,
      role: 'assistant',
      content: aiResponse.message,
    });

    // 9. Send via WhatsApp
    await sendMessage(from, aiResponse.message);

    // 10. Update lead and conversation if needed
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (aiResponse.nameDetected && !lead.name) {
      updates.name = aiResponse.nameDetected;
    }
    if (aiResponse.serviceDetected) {
      updates.service_interest = aiResponse.serviceDetected;
    }
    if (aiResponse.heat) {
      updates.heat = aiResponse.heat;
    }
    if (aiResponse.nextStage) {
      // Map agent stage to lead stage
      const stageMap: Record<string, string> = {
        calificacion: 'calificando',
        educacion: 'calificando',
        cierre: 'visto_sin_pagar',
        recuperacion: 'visto_sin_pagar',
      };
      if (stageMap[aiResponse.nextStage]) {
        updates.stage = stageMap[aiResponse.nextStage];
      }
    }

    await db.from('leads').update(updates).eq('id', lead.id);

    if (aiResponse.nextStage) {
      await db
        .from('conversations')
        .update({
          current_stage: aiResponse.nextStage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversation.id);
    }

    if (aiResponse.shouldEscalate) {
      await db
        .from('conversations')
        .update({ status: 'escalated', updated_at: new Date().toISOString() })
        .eq('id', conversation.id);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('[Webhook] Error processing message:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
