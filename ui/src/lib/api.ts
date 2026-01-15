/**
 * API Client - PM Suite Backend
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Proposal {
    id: string;
    intentId: string | null;
    proposalType: 'decision' | 'assumption' | 'risk' | 'question';
    content: string; // JSON
    promptTemplateId: string | null;
    modelUsed: string | null;
    confidence: number | null;
    status: 'pending' | 'accepted' | 'rejected' | 'parked';
    reviewedBy: string | null;
    reviewedAt: string | null;
    createdAt: string | null;
}

export interface Intent {
    id: string;
    tenantId: string;
    title: string;
    description: string | null;
    currentState: 'research' | 'planning' | 'execution' | 'archived';
    createdBy: string;
    createdAt: string | null;
    lastHumanReviewedAt: string | null;
    confidenceLevel: number | null;
    visibilityScope: string | null;
}

interface ApiResponse<T> {
    data?: T;
    error?: string;
    message?: string;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-ID': 'dev-tenant',
                'X-User-ID': 'dev-user',
                ...options?.headers,
            },
            ...options,
        });
        return await response.json();
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export interface Decision {
    id: string;
    intentId: string | null;
    decisionStatement: string;
    optionsConsidered: string | null; // JSON array
    finalChoice: string;
    humanApprover: string;
    aiInputsReferenced: string | null; // JSON array
    decisionTimestamp: string | null;
    revisitCondition: string | null;
    status: 'active' | 'superseded';
}

export interface Assumption {
    id: string;
    intentId: string | null;
    assumptionStatement: string;
    confidenceLevel: number | null;
    createdFrom: 'human' | 'ai' | null;
    createdAt: string | null;
    status: 'active' | 'invalidated';
}

export interface Risk {
    id: string;
    intentId: string | null;
    riskStatement: string;
    severity: 'low' | 'medium' | 'high' | 'critical' | null;
    likelihood: string | null;
    createdFrom: 'human' | 'ai' | null;
    mitigationNotes: string | null;
    status: string;
}

export interface Task {
    id: string;
    intentId: string | null;
    decisionId: string | null;
    title: string;
    description: string | null;
    owner: string | null;
    status: string;
    createdAt: string | null;
}

export interface IntentStats {
    decisions: number;
    assumptions: number;
    risks: number;
    tasks: number;
}

export const api = {
    // Health
    health: () => request<{ status: string; version: string }>('/health'),

    // AI Status
    aiStatus: () => request<{ aiAvailable: boolean; message: string }>('/api/ingestion/status'),

    // Intents
    listIntents: (state?: string) =>
        request<Intent[]>(`/api/intents${state ? `?state=${state}` : ''}`),

    getIntent: (id: string) =>
        request<Intent>(`/api/intents/${id}`),

    createIntent: (data: { title: string; description?: string }) =>
        request<Intent>('/api/intents', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    transitionIntent: (id: string, state: string) =>
        request<Intent>(`/api/intents/${id}/transition`, {
            method: 'POST',
            body: JSON.stringify({ state }),
        }),

    // Decisions
    listDecisions: (intentId: string) =>
        request<Decision[]>(`/api/decisions/intent/${intentId}`),

    getDecisionLedger: (intentId: string) =>
        request<Decision[]>(`/api/decisions/ledger/${intentId}`),

    commitDecision: (data: {
        intentId: string;
        decisionStatement: string;
        finalChoice: string;
        optionsConsidered?: string[];
        revisitCondition?: string;
    }) =>
        request<Decision>('/api/decisions', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    // Assumptions
    listAssumptions: (intentId: string) =>
        request<Assumption[]>(`/api/assumptions/intent/${intentId}`),

    createAssumption: (data: {
        intentId: string;
        assumptionStatement: string;
        confidenceLevel?: number;
    }) =>
        request<Assumption>('/api/assumptions', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    invalidateAssumption: (id: string) =>
        request<Assumption>(`/api/assumptions/${id}/invalidate`, {
            method: 'POST',
        }),

    // Risks
    listRisks: (intentId: string) =>
        request<Risk[]>(`/api/risks/intent/${intentId}`),

    createRisk: (data: {
        intentId: string;
        riskStatement: string;
        severity?: 'low' | 'medium' | 'high' | 'critical';
        likelihood?: string;
        mitigationNotes?: string;
    }) =>
        request<Risk>('/api/risks', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    mitigateRisk: (id: string, notes: string) =>
        request<Risk>(`/api/risks/${id}/mitigate`, {
            method: 'POST',
            body: JSON.stringify({ mitigationNotes: notes }),
        }),

    // Tasks
    listTasks: (intentId: string) =>
        request<Task[]>(`/api/tasks/intent/${intentId}`),

    createTask: (data: {
        intentId: string;
        title: string;
        description?: string;
        owner?: string;
    }) =>
        request<Task>('/api/tasks', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    updateTaskStatus: (id: string, status: string) =>
        request<Task>(`/api/tasks/${id}/status`, {
            method: 'POST',
            body: JSON.stringify({ status }),
        }),

    // Intent Stats (aggregated)
    getIntentStats: async (intentId: string): Promise<ApiResponse<IntentStats>> => {
        const [decisions, assumptions, risks, tasks] = await Promise.all([
            request<Decision[]>(`/api/decisions/intent/${intentId}`),
            request<Assumption[]>(`/api/assumptions/intent/${intentId}`),
            request<Risk[]>(`/api/risks/intent/${intentId}`),
            request<Task[]>(`/api/tasks/intent/${intentId}`),
        ]);
        return {
            data: {
                decisions: decisions.data?.length || 0,
                assumptions: assumptions.data?.length || 0,
                risks: risks.data?.length || 0,
                tasks: tasks.data?.length || 0,
            },
        };
    },

    // Ingestion
    ingestContent: (data: { intentId?: string; sourceType: string; content: string }) =>
        request<{ proposals: Proposal[] }>('/api/ingestion', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    // Proposals
    getProposals: (intentId: string) =>
        request<Proposal[]>(`/api/ingestion/proposals?intentId=${intentId}`),

    acceptProposal: (id: string) =>
        request<{ message: string }>(`/api/ingestion/proposals/${id}/accept`, {
            method: 'POST',
        }),

    rejectProposal: (id: string) =>
        request<{ message: string }>(`/api/ingestion/proposals/${id}/reject`, {
            method: 'POST',
        }),

    parkProposal: (id: string) =>
        request<{ message: string }>(`/api/ingestion/proposals/${id}/park`, {
            method: 'POST',
        }),
};
