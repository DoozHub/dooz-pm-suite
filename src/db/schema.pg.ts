/**
 * Dooz PM Suite - PostgreSQL Schema
 * 
 * Production schema using PostgreSQL with Drizzle ORM.
 */

import { pgTable, text, real, timestamp, boolean } from 'drizzle-orm/pg-core';

// =============================================================================
// INTENTS - The primary artifact capturing human purpose
// =============================================================================

export const intents = pgTable('intents', {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    currentState: text('current_state').default('research'),
    createdBy: text('created_by').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    lastHumanReviewedAt: timestamp('last_human_reviewed_at'),
    confidenceLevel: real('confidence_level'),
    visibilityScope: text('visibility_scope').default('team'),
});

// =============================================================================
// DECISIONS - Append-only ledger of human judgments
// =============================================================================

export const decisions = pgTable('decisions', {
    id: text('id').primaryKey(),
    intentId: text('intent_id').references(() => intents.id),
    decisionStatement: text('decision_statement').notNull(),
    optionsConsidered: text('options_considered'),
    finalChoice: text('final_choice').notNull(),
    humanApprover: text('human_approver').notNull(),
    aiInputsReferenced: text('ai_inputs_referenced'),
    decisionTimestamp: timestamp('decision_timestamp').defaultNow(),
    revisitCondition: text('revisit_condition'),
    status: text('status').default('active'),
});

// =============================================================================
// ASSUMPTIONS
// =============================================================================

export const assumptions = pgTable('assumptions', {
    id: text('id').primaryKey(),
    intentId: text('intent_id').references(() => intents.id),
    assumptionStatement: text('assumption_statement').notNull(),
    confidenceLevel: real('confidence_level'),
    createdFrom: text('created_from'),
    createdAt: timestamp('created_at').defaultNow(),
    expiryHint: text('expiry_hint'),
    status: text('status').default('active'),
});

// =============================================================================
// RISKS
// =============================================================================

export const risks = pgTable('risks', {
    id: text('id').primaryKey(),
    intentId: text('intent_id').references(() => intents.id),
    riskStatement: text('risk_statement').notNull(),
    severity: text('severity'),
    likelihood: text('likelihood'),
    createdFrom: text('created_from'),
    mitigationNotes: text('mitigation_notes'),
    status: text('status').default('active'),
});

// =============================================================================
// TASKS
// =============================================================================

export const tasks = pgTable('tasks', {
    id: text('id').primaryKey(),
    intentId: text('intent_id').references(() => intents.id),
    decisionId: text('decision_id').references(() => decisions.id),
    title: text('title').notNull(),
    description: text('description'),
    owner: text('owner'),
    status: text('status').default('pending'),
    sla: text('sla'),
    externalSystemRef: text('external_system_ref'),
    createdAt: timestamp('created_at').defaultNow(),
});

// =============================================================================
// EDGES (Knowledge Graph)
// =============================================================================

export const edges = pgTable('edges', {
    id: text('id').primaryKey(),
    sourceId: text('source_id').notNull(),
    sourceType: text('source_type').notNull(),
    targetId: text('target_id').notNull(),
    targetType: text('target_type').notNull(),
    edgeType: text('edge_type'),
    createdAt: timestamp('created_at').defaultNow(),
    createdBy: text('created_by').notNull(),
});

// =============================================================================
// AI PROPOSALS
// =============================================================================

export const aiProposals = pgTable('ai_proposals', {
    id: text('id').primaryKey(),
    intentId: text('intent_id').references(() => intents.id),
    proposalType: text('proposal_type'),
    content: text('content').notNull(),
    promptTemplateId: text('prompt_template_id'),
    modelUsed: text('model_used'),
    confidence: real('confidence'),
    status: text('status').default('pending'),
    reviewedBy: text('reviewed_by'),
    reviewedAt: timestamp('reviewed_at'),
    createdAt: timestamp('created_at').defaultNow(),
});

// =============================================================================
// PROMPT TEMPLATES
// =============================================================================

export const promptTemplates = pgTable('prompt_templates', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    version: real('version').default(1),
    template: text('template').notNull(),
    variables: text('variables'),
    taskType: text('task_type'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
});

// Type exports
export type Intent = typeof intents.$inferSelect;
export type NewIntent = typeof intents.$inferInsert;
export type Decision = typeof decisions.$inferSelect;
export type NewDecision = typeof decisions.$inferInsert;
export type Assumption = typeof assumptions.$inferSelect;
export type Risk = typeof risks.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Edge = typeof edges.$inferSelect;
export type AiProposal = typeof aiProposals.$inferSelect;
export type PromptTemplate = typeof promptTemplates.$inferSelect;
