import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db';
import { intents, decisions, assumptions, risks } from '../db/schema';
import { eq, and, desc, gt, isNull } from 'drizzle-orm';
import { aiPropose } from '../ai/proposer';

const app = new Hono();

const proposeSchema = z.object({
  intent_id: z.string().uuid(),
  context: z.string().optional(),
  model: z.string().optional(),
});

/**
 * AI Proposal Engine Enhancement
 * 
 * Generates structured proposals for intents with:
 * - Impact analysis
 * - Risk assessment
 * - Resource estimation
 * - Alternative approaches
 * - Confidence scoring
 */
app.post('/api/intents/:id/ai-propose', async (c) => {
  const intentId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));

  const intent = await db.query.intents.findFirst({
    where: eq(intents.id, intentId),
    with: {
      decisions: true,
      assumptions: true,
      risks: true,
    },
  });

  if (!intent) {
    return c.json({ error: 'Intent not found' }, 404);
  }

  // Gather context from related entities
  const contextParts = [
    `Intent: ${intent.title}`,
    `Description: ${intent.description || 'N/A'}`,
    `Current State: ${intent.state}`,
    intent.context ? `Context: ${intent.context}` : null,
    body.context ? `Additional Context: ${body.context}` : null,
  ].filter(Boolean).join('\n');

  // Add prior decisions as context
  if (intent.decisions.length > 0) {
    const decisionContext = intent.decisions
      .filter((d: any) => !d.superseded)
      .slice(-5)
      .map((d: any) => `- Decision: ${d.decision} (${d.rationale})`)
      .join('\n');
    contextParts.push(`\nPrior Decisions:\n${decisionContext}`);
  }

  // Add risks as context
  if (intent.risks.length > 0) {
    const riskContext = intent.risks
      .filter((r: any) => r.status === 'active')
      .map((r: any) => `- Risk: ${r.description} (severity: ${r.severity})`)
      .join('\n');
    contextParts.push(`\nActive Risks:\n${riskContext}`);
  }

  // Generate proposal
  const proposal = await aiPropose(contextParts.join('\n'), {
    model: body.model,
    includeAlternatives: true,
    includeRiskAssessment: true,
    includeResourceEstimation: true,
  });

  // Store proposal as a decision record
  await db.insert(decisions).values({
    intent_id: intentId,
    decision: 'ai_proposal',
    rationale: proposal.summary,
    data: proposal,
    made_by: 'ai',
    made_at: new Date(),
  });

  return c.json({
    success: true,
    proposal,
    generated_at: new Date().toISOString(),
  });
});

/**
 * Batch AI analysis for multiple intents
 */
app.post('/api/intents/ai-analyze-batch', async (c) => {
  const { intent_ids, focus } = await c.req.json();

  if (!intent_ids || intent_ids.length === 0) {
    return c.json({ error: 'No intent IDs provided' }, 400);
  }

  const intents_data = await db.query.intents.findMany({
    where: (intents: any) => inArray(intents.id, intent_ids),
  });

  const analyses = await Promise.all(
    intents_data.map(async (intent: any) => {
      const analysis = await aiPropose(
        `Analyze this intent for ${focus || 'completeness'}:\n${intent.title}\n${intent.description || ''}`,
        { model: 'fast' }
      );

      return {
        intent_id: intent.id,
        title: intent.title,
        analysis,
      };
    })
  );

  return c.json({ success: true, analyses });
});

/**
 * AI-assisted risk scoring for an intent
 */
app.post('/api/intents/:id/ai-risk-score', async (c) => {
  const intentId = c.req.param('id');

  const intent = await db.query.intents.findFirst({
    where: eq(intents.id, intentId),
    with: { assumptions: true, risks: true },
  });

  if (!intent) {
    return c.json({ error: 'Intent not found' }, 404);
  }

  const riskScore = await aiPropose(
    `Score the risks for this intent:\n${intent.title}\n${intent.description || ''}`,
    { focus: 'risk_assessment' }
  );

  return c.json({
    success: true,
    risk_score: riskScore,
    intent_id: intentId,
  });
});

export default app;
