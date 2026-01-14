/**
 * Dooz PM Suite - Database Schema
 * 
 * SQLite schema using Drizzle ORM.
 * For PostgreSQL production, adapt this schema using Drizzle migrations.
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// =============================================================================
// INTENTS - The primary artifact capturing human purpose
// =============================================================================

export const intents = sqliteTable('intents', {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    currentState: text('current_state').default('research'), // research | planning | execution | archived
    createdBy: text('created_by').notNull(),
    createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
    lastHumanReviewedAt: text('last_human_reviewed_at'),
    confidenceLevel: real('confidence_level'),
    visibilityScope: text('visibility_scope').default('team'),
});

// =============================================================================
// DECISIONS - Append-only ledger of human judgments
// =============================================================================

export const decisions = sqliteTable('decisions', {
    id: text('id').primaryKey(),
    intentId: text('intent_id').references(() => intents.id),
    decisionStatement: text('decision_statement').notNull(),
    optionsConsidered: text('options_considered'), // JSON array
    finalChoice: text('final_choice').notNull(),
    humanApprover: text('human_approver').notNull(),
    aiInputsReferenced: text('ai_inputs_referenced'), // JSON array
    decisionTimestamp: text('decision_timestamp').default('CURRENT_TIMESTAMP'),
    revisitCondition: text('revisit_condition'),
    status: text('status').default('active'), // active | superseded
});

// =============================================================================
// ASSUMPTIONS - Unverified beliefs underlying Intents/Decisions
// =============================================================================

export const assumptions = sqliteTable('assumptions', {
    id: text('id').primaryKey(),
    intentId: text('intent_id').references(() => intents.id),
    assumptionStatement: text('assumption_statement').notNull(),
    confidenceLevel: real('confidence_level'),
    createdFrom: text('created_from'), // human | ai
    createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
    expiryHint: text('expiry_hint'),
    status: text('status').default('active'), // active | invalidated
});

// =============================================================================
// RISKS - Potential negative outcomes linked to uncertainty
// =============================================================================

export const risks = sqliteTable('risks', {
    id: text('id').primaryKey(),
    intentId: text('intent_id').references(() => intents.id),
    riskStatement: text('risk_statement').notNull(),
    severity: text('severity'), // low | medium | high | critical
    likelihood: text('likelihood'),
    createdFrom: text('created_from'), // human | ai
    mitigationNotes: text('mitigation_notes'),
    status: text('status').default('active'),
});

// =============================================================================
// TASKS - Secondary objects derived from Decisions
// =============================================================================

export const tasks = sqliteTable('tasks', {
    id: text('id').primaryKey(),
    intentId: text('intent_id').references(() => intents.id),
    decisionId: text('decision_id').references(() => decisions.id),
    title: text('title').notNull(),
    description: text('description'),
    owner: text('owner'),
    status: text('status').default('pending'),
    sla: text('sla'),
    externalSystemRef: text('external_system_ref'), // e.g., Redmine ID
    createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// =============================================================================
// KNOWLEDGE GRAPH EDGES - Relationships between objects
// =============================================================================

export const edges = sqliteTable('edges', {
    id: text('id').primaryKey(),
    sourceId: text('source_id').notNull(),
    sourceType: text('source_type').notNull(), // intent | decision | task | assumption | risk
    targetId: text('target_id').notNull(),
    targetType: text('target_type').notNull(),
    edgeType: text('edge_type'), // led_to | depends_on | invalidates | supports | blocks | derived_from
    createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
    createdBy: text('created_by').notNull(),
});

// =============================================================================
// AI PROPOSALS - Pending human confirmation queue
// =============================================================================

export const aiProposals = sqliteTable('ai_proposals', {
    id: text('id').primaryKey(),
    intentId: text('intent_id').references(() => intents.id),
    proposalType: text('proposal_type'), // decision | assumption | risk | question
    content: text('content').notNull(), // JSON
    promptTemplateId: text('prompt_template_id'),
    modelUsed: text('model_used'),
    confidence: real('confidence'),
    status: text('status').default('pending'), // pending | accepted | rejected | parked
    reviewedBy: text('reviewed_by'),
    reviewedAt: text('reviewed_at'),
    createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// =============================================================================
// PROMPT TEMPLATES - Versioned AI prompts
// =============================================================================

export const promptTemplates = sqliteTable('prompt_templates', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    version: integer('version').default(1),
    template: text('template').notNull(),
    variables: text('variables'), // JSON array
    taskType: text('task_type'), // extraction | summarization | risk_analysis
    isActive: integer('is_active').default(1),
    createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// =============================================================================
// Type exports for use in services
// =============================================================================

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
