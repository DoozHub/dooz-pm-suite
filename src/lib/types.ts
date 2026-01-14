/**
 * Dooz PM Suite - Domain Types
 */

import { z } from 'zod';

// =============================================================================
// INTENT TYPES
// =============================================================================

export const IntentState = z.enum(['research', 'planning', 'execution', 'archived']);
export type IntentState = z.infer<typeof IntentState>;

export const CreateIntentSchema = z.object({
    title: z.string().min(1).max(500),
    description: z.string().optional(),
    confidenceLevel: z.number().min(0).max(1).optional(),
    visibilityScope: z.enum(['private', 'team', 'organization']).default('team'),
});
export type CreateIntentInput = z.infer<typeof CreateIntentSchema>;

export const UpdateIntentSchema = CreateIntentSchema.partial();
export type UpdateIntentInput = z.infer<typeof UpdateIntentSchema>;

// =============================================================================
// DECISION TYPES
// =============================================================================

export const CreateDecisionSchema = z.object({
    intentId: z.string(),
    decisionStatement: z.string().min(1),
    optionsConsidered: z.array(z.string()).optional(),
    finalChoice: z.string().min(1),
    revisitCondition: z.string().optional(),
    aiInputsReferenced: z.array(z.string()).optional(),
});
export type CreateDecisionInput = z.infer<typeof CreateDecisionSchema>;

// =============================================================================
// ASSUMPTION TYPES
// =============================================================================

export const CreateAssumptionSchema = z.object({
    intentId: z.string(),
    assumptionStatement: z.string().min(1),
    confidenceLevel: z.number().min(0).max(1).optional(),
    expiryHint: z.string().optional(),
});
export type CreateAssumptionInput = z.infer<typeof CreateAssumptionSchema>;

// =============================================================================
// RISK TYPES
// =============================================================================

export const Severity = z.enum(['low', 'medium', 'high', 'critical']);
export type Severity = z.infer<typeof Severity>;

export const CreateRiskSchema = z.object({
    intentId: z.string(),
    riskStatement: z.string().min(1),
    severity: Severity.optional(),
    likelihood: z.string().optional(),
    mitigationNotes: z.string().optional(),
});
export type CreateRiskInput = z.infer<typeof CreateRiskSchema>;

// =============================================================================
// EDGE TYPES (Knowledge Graph)
// =============================================================================

export const EdgeType = z.enum([
    'led_to', 'depends_on', 'invalidates', 'supports', 'blocks', 'derived_from'
]);
export type EdgeType = z.infer<typeof EdgeType>;

export const NodeType = z.enum([
    'intent', 'decision', 'task', 'assumption', 'risk', 'ai_insight', 'evidence'
]);
export type NodeType = z.infer<typeof NodeType>;

export const CreateEdgeSchema = z.object({
    sourceId: z.string(),
    sourceType: NodeType,
    targetId: z.string(),
    targetType: NodeType,
    edgeType: EdgeType,
});
export type CreateEdgeInput = z.infer<typeof CreateEdgeSchema>;

// =============================================================================
// AI PROPOSAL TYPES
// =============================================================================

export const ProposalType = z.enum(['decision', 'assumption', 'risk', 'question']);
export type ProposalType = z.infer<typeof ProposalType>;

export const ProposalStatus = z.enum(['pending', 'accepted', 'rejected', 'parked']);
export type ProposalStatus = z.infer<typeof ProposalStatus>;

export const ReviewProposalSchema = z.object({
    status: z.enum(['accepted', 'rejected', 'parked']),
});
export type ReviewProposalInput = z.infer<typeof ReviewProposalSchema>;

// =============================================================================
// INGESTION TYPES
// =============================================================================

export const IngestionSourceType = z.enum([
    'chatgpt_export', 'claude_export', 'text_file', 'email_thread', 'meeting_notes'
]);
export type IngestionSourceType = z.infer<typeof IngestionSourceType>;

export const IngestionRequestSchema = z.object({
    intentId: z.string().optional(), // If null, create new Intent candidate
    sourceType: IngestionSourceType,
    content: z.string().min(1),
    metadata: z.record(z.string()).optional(),
});
export type IngestionRequest = z.infer<typeof IngestionRequestSchema>;
