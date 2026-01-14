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
