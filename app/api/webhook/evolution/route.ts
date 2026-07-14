import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { parseEvolutionMessage, sendText } from '@/lib/evolution-api';
import { generateResponse } from '@/lib/ai-agent';
import type { AgentConfig, Conversation, Lead, Message } from '@/lib/types';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const incoming = parseEvolutionMessage(body);
  if (!incoming) {
    return NextResponse.json({ status: 'ok' });
  }

  const { from, text, messageId, pushName, instanceName } = incoming;
  const db = createServerClient();

  try {
    const slug = instanceName.replace('clinic-', '');
    const { data: clinic } = await db
      .from('clinics')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!clinic) {
      console.error('[Evolution] No clinic found for instance:', instanceName);
      return NextResponse.json({ status: 'ok' });
    }

    const clinicId = clinic.id;

    let { data: lead } = await db
      .from('leads')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('phone', from)
      .single();

    if (!lead) {
      const { data: newLead } = await db
        .from('leads')
        .insert({
          clinic_id: clinicId,
          phone: from,
          name: pushName || null,
          source: 'whatsapp',
          stage: 'nuevo',
          heat: 'warm',
        })
        .select()
        .single();
      lead = newLead as Lead;
    } else if (pushName && !lead.name) {
      await db.from('leads').update({ name: pushName }).eq('id', lead.id);
      lead.name = pushName;
    }

    if (!lead) {
      console.error('[Evolution] Failed to create/find lead for', from);
      return NextResponse.json({ status: 'error' }, { status: 500 });
    }

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
          clinic_id: clinicId,
          status: 'active',
          current_stage: 'bienvenida',
        })
        .select()
        .single();
      conversation = newConvo as Conversation;
    }

    if (!conversation) {
      console.error('[Evolution] Failed to create/find conversation');
      return NextResponse.json({ status: 'error' }, { status: 500 });
    }

    await db.from('messages').insert({
      conversation_id: conversation.id,
      role: 'user',
      content: text,
      wa_message_id: messageId,
    });

    const { data: messages } = await db
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(20);

    const { data: config } = await db
      .from('agent_configs')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('stage', conversation.current_stage)
      .single();

    if (!config) {
      console.error('[Evolution] No agent config for stage:', conversation.current_stage);
      return NextResponse.json({ status: 'ok' });
    }

    const aiResponse = await generateResponse(
      config as AgentConfig,
      (messages || []) as Message[],
      conversation.current_stage as AgentConfig['stage']
    );

    await db.from('messages').insert({
      conversation_id: conversation.id,
      role: 'assistant',
      content: aiResponse.message,
    });

    await sendText(instanceName, from, aiResponse.message);

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
    console.error('[Evolution] Error processing message:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
