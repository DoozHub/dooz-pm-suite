/**
 * AI Provider Abstraction
 * 
 * Defines interface for AI providers. PM Suite can use either:
 * - Brain Mode: Delegates AI to dooz-brain (rich context, organizational memory)
 * - Standalone Mode: Direct LLM calls via @dooz/ai-router (self-contained)
 */

export interface AiProviderConfig {
    mode: 'brain' | 'standalone';
    brainUrl?: string;
    brainApiKey?: string;
}

export interface CompletionRequest {
    prompt: string;
    systemPrompt?: string;
    context?: string;
    maxTokens?: number;
    temperature?: number;
}

export interface CompletionResponse {
    content: string;
    provider: string;
    model?: string;
    tokensUsed?: number;
}

export interface ContextRequest {
    query: string;
    scopeId: string;
    maxChars?: number;
    maxMemories?: number;
}

export interface ContextResponse {
    context: string;
    memoryIds: string[];
    memoryCount: number;
}

/**
 * AI Provider Interface
 * 
 * All AI providers must implement this interface.
 */
export interface AiProvider {
    readonly name: string;
    readonly mode: 'brain' | 'standalone';

    /**
     * Check if provider is available
     */
    isAvailable(): Promise<boolean>;

    /**
     * Complete a prompt
     */
    complete(request: CompletionRequest): Promise<CompletionResponse>;

    /**
     * Get relevant context (Brain mode only, returns empty in standalone)
     */
    getContext(request: ContextRequest): Promise<ContextResponse>;

    /**
     * Store a memory (Brain mode only, no-op in standalone)
     */
    storeMemory(data: {
        scopeId: string;
        title: string;
        content: string;
        bucketId?: string;
    }): Promise<string | null>;
}
