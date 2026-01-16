/**
 * Standalone AI Provider
 * 
 * Direct LLM calls via @dooz/ai-router.
 * Self-contained, no external dependencies beyond LLM API.
 */

import type {
    AiProvider,
    CompletionRequest,
    CompletionResponse,
    ContextRequest,
    ContextResponse
} from './provider';
import { getRouter } from './router';

export class StandaloneProvider implements AiProvider {
    readonly name = 'standalone';
    readonly mode = 'standalone' as const;

    async isAvailable(): Promise<boolean> {
        return getRouter() !== null;
    }

    async complete(request: CompletionRequest): Promise<CompletionResponse> {
        const router = getRouter();
        if (!router) {
            throw new Error('No AI router available. Configure OPENROUTER_API_KEY or OLLAMA_ENABLED.');
        }

        let userContent = request.prompt;
        if (request.context) {
            userContent = `Context:\n${request.context}\n\n---\n\n${request.prompt}`;
        }

        const messages = [
            ...(request.systemPrompt ? [{ role: 'system' as const, content: request.systemPrompt }] : []),
            { role: 'user' as const, content: userContent },
        ];

        const result = await router.complete({
            messages,
            maxTokens: request.maxTokens,
            temperature: request.temperature,
        });

        return {
            content: result.content,
            provider: 'standalone',
            model: result.model,
            tokensUsed: result.usage?.totalTokens,
        };
    }

    async getContext(_request: ContextRequest): Promise<ContextResponse> {
        // Standalone mode has no organizational memory
        // Return empty context - caller should use local intent data
        return {
            context: '',
            memoryIds: [],
            memoryCount: 0,
        };
    }

    async storeMemory(_data: {
        scopeId: string;
        title: string;
        content: string;
        bucketId?: string;
    }): Promise<string | null> {
        // Standalone mode doesn't sync to Brain
        // No-op, return null
        return null;
    }
}
