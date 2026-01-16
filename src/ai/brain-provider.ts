/**
 * Brain AI Provider
 * 
 * Delegates AI operations to dooz-brain server.
 * Provides rich context from organizational memory.
 */

import type {
    AiProvider,
    CompletionRequest,
    CompletionResponse,
    ContextRequest,
    ContextResponse
} from './provider';

export interface BrainProviderConfig {
    brainUrl: string;
    apiKey?: string;
}

export class BrainProvider implements AiProvider {
    readonly name = 'brain';
    readonly mode = 'brain' as const;

    private baseUrl: string;
    private apiKey?: string;

    constructor(config: BrainProviderConfig) {
        this.baseUrl = config.brainUrl.replace(/\/$/, '');
        this.apiKey = config.apiKey;
    }

    private headers(): Record<string, string> {
        const h: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (this.apiKey) {
            h['X-API-Key'] = this.apiKey;
        }
        return h;
    }

    async isAvailable(): Promise<boolean> {
        try {
            const res = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000),
            });
            return res.ok;
        } catch {
            return false;
        }
    }

    async complete(request: CompletionRequest): Promise<CompletionResponse> {
        // First get context if query provided
        let enrichedPrompt = request.prompt;

        if (request.context) {
            enrichedPrompt = `Context:\n${request.context}\n\n---\n\n${request.prompt}`;
        }

        // Use Brain's AI endpoint
        const res = await fetch(`${this.baseUrl}/ai/complete`, {
            method: 'POST',
            headers: this.headers(),
            body: JSON.stringify({
                prompt: enrichedPrompt,
                system_prompt: request.systemPrompt,
                max_tokens: request.maxTokens,
                temperature: request.temperature,
            }),
        });

        if (!res.ok) {
            throw new Error(`Brain completion failed: ${res.status}`);
        }

        const data = await res.json();
        return {
            content: data.content || data.response || '',
            provider: 'brain',
            model: data.model,
            tokensUsed: data.tokens_used,
        };
    }

    async getContext(request: ContextRequest): Promise<ContextResponse> {
        const res = await fetch(`${this.baseUrl}/api/v1/context`, {
            method: 'POST',
            headers: this.headers(),
            body: JSON.stringify({
                scope_id: request.scopeId,
                query: request.query,
                max_chars: request.maxChars || 8000,
                max_memories: request.maxMemories || 10,
            }),
        });

        if (!res.ok) {
            console.warn('[BrainProvider] Context fetch failed, returning empty');
            return { context: '', memoryIds: [], memoryCount: 0 };
        }

        const data = await res.json();
        const result = data.data || data;

        return {
            context: result.context || '',
            memoryIds: result.memory_ids || [],
            memoryCount: result.memory_count || 0,
        };
    }

    async storeMemory(data: {
        scopeId: string;
        title: string;
        content: string;
        bucketId?: string;
    }): Promise<string | null> {
        try {
            const res = await fetch(`${this.baseUrl}/api/v1/memories`, {
                method: 'POST',
                headers: this.headers(),
                body: JSON.stringify({
                    scope_id: data.scopeId,
                    title: data.title,
                    content: data.content,
                    bucket_id: data.bucketId,
                }),
            });

            if (!res.ok) {
                console.warn('[BrainProvider] Memory store failed');
                return null;
            }

            const result = await res.json();
            return result.data?.id || null;
        } catch (e) {
            console.error('[BrainProvider] Store memory error:', e);
            return null;
        }
    }
}
