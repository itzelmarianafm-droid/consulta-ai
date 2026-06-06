// =====================================================================
// AI Agent — Claude-powered conversational agent for clinics
// =====================================================================

import Anthropic from '@anthropic-ai/sdk';
import type { AgentConfig, AgentResponse, AgentStage, Message } from './types';

const anthropic = new Anthropic();

const STAGE_INSTRUCTIONS: Record<AgentStage, string> = {
  bienvenida: `Estás en la etapa de BIENVENIDA. Tu objetivo:
- Saluda con calidez, preséntate con tu nombre
- Pregunta en qué procedimiento está interesado/a
- Intenta capturar su nombre de forma natural
- Si ya mencionó el servicio, pasa directamente a calificación

Avanza a "calificacion" cuando: sepas qué servicio le interesa.`,

  calificacion: `Estás en la etapa de CALIFICACIÓN. Tu objetivo:
- Pregunta de forma natural (sin sonar a formulario) por:
  1. ¿Es su primera vez con este procedimiento?
  2. ¿Tiene algún evento o fecha límite?
  3. ¿Qué resultado busca?
- Detecta señales de urgencia (evento próximo, dolor, inseguridad)
- NO preguntes directamente por presupuesto

Avanza a "educacion" cuando: tengas al menos 2 de los 3 datos.`,

  educacion: `Estás en la etapa de EDUCACIÓN. Tu objetivo:
- Envía información relevante sobre el procedimiento
- Menciona antes/después, testimoniales, datos de recuperación
- Resuelve dudas de seguridad con datos concretos, no genéricos
- Si detectas que el paciente está listo, no alargues esta etapa

Avanza a "cierre" cuando: el paciente muestre interés claro en agendar o pregunte por disponibilidad/precios finales.`,

  cierre: `Estás en la etapa de CIERRE. Tu objetivo:
- Propón 2 fechas/horarios concretos (no preguntes "¿cuándo te queda?")
- Explica el anticipo y cómo funciona (se descuenta del total)
- Si las reglas incluyen cobro de anticipo, menciona que le enviarás el link de pago
- Máximo 3 mensajes para cerrar

Avanza a "recuperacion" solo si: el paciente deja de responder o pide tiempo.`,

  recuperacion: `Estás en la etapa de RECUPERACIÓN. Tu objetivo:
- El paciente dejó de responder o no completó el pago
- Envía UN solo mensaje de re-engagement
- Usa prueba social (testimonial) o un beneficio concreto (espacio que se abrió)
- NO presiones. Tono: "sin compromiso, aquí estoy si necesitas"
- Espera 48h entre intentos

Si responde con interés, regresa a "cierre".`,
};

export async function generateResponse(
  config: AgentConfig,
  messages: Message[],
  currentStage: AgentStage
): Promise<AgentResponse> {
  const stageInstructions = STAGE_INSTRUCTIONS[currentStage];
  const servicesStr = config.services.length > 0
    ? `Servicios que ofreces: ${config.services.join(', ')}.`
    : '';

  const rulesStr = Object.entries(config.rules || {})
    .filter(([, v]) => v)
    .map(([k]) => {
      const labels: Record<string, string> = {
        cobro_anticipo: 'Puedes ofrecer link de pago de anticipo',
        recordatorios: 'Se envían recordatorios 24h y 2h antes',
        reagendar: 'El paciente puede reagendar hasta 6h antes',
        escalar_humano: 'Si el paciente pide hablar con una persona, ofrécelo',
      };
      return `- ${labels[k] || k}`;
    })
    .join('\n');

  const systemPrompt = `${config.persona_prompt}

${servicesStr}

--- ETAPA ACTUAL: ${currentStage.toUpperCase()} ---
${stageInstructions}

${rulesStr ? `--- REGLAS ACTIVAS ---\n${rulesStr}` : ''}

--- INSTRUCCIONES DE RESPUESTA ---
Responde SOLO con un JSON válido con esta estructura:
{
  "message": "tu respuesta al paciente en texto natural",
  "nextStage": "solo si detectas que debe avanzar a otra etapa, de lo contrario omite este campo",
  "heat": "hot | warm | cold — solo si cambió tu percepción del nivel de interés",
  "serviceDetected": "nombre del servicio si lo detectaste, de lo contrario omite",
  "nameDetected": "nombre del paciente si lo mencionó, de lo contrario omite",
  "shouldEscalate": true // solo si el paciente pide hablar con un humano
}

IMPORTANTE:
- Responde SIEMPRE en español mexicano, tutea
- No uses emojis excesivos (máximo 1 por mensaje)
- Sé concisa pero cálida
- Nunca inventes información médica falsa
- Si no sabes algo, di que lo consultarás con la doctora`;

  const conversationHistory = messages.slice(-20).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6-20250514',
    max_tokens: 500,
    system: systemPrompt,
    messages: conversationHistory,
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    // Try to parse as JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as AgentResponse;
    }
  } catch {
    // If JSON parsing fails, return the text as-is
  }

  return { message: text };
}
