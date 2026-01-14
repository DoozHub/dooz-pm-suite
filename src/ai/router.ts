/**
 * AI Router Configuration
 * 
 * Initializes the LLM router from environment variables.
 */

import { createRouter, type LlmRouter, type RouterConfig } from '@dooz/ai-router';

let router: LlmRouter | null = null;

/**
 * Get or create the AI router instance
 */
export function getRouter(): LlmRouter | null {
    if (router) return router;

    // Check for available providers
    const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
    const hasOllama = process.env.OLLAMA_ENABLED === 'true' || !!process.env.OLLAMA_BASE_URL;

    if (!hasOpenRouter && !hasOllama) {
        console.warn('[ai] No AI providers configured. Set OPENROUTER_API_KEY or OLLAMA_ENABLED=true');
        return null;
    }

    const config: RouterConfig = {
        providers: [],
        defaultProvider: hasOpenRouter ? 'openrouter' : 'ollama',
        fallbackChain: [],
        smartRouting: true,
        logging: process.env.AI_ROUTER_LOGGING === 'true',
    };

    // Add OpenRouter if configured
    if (hasOpenRouter) {
        config.providers.push({
            type: 'openrouter',
            apiKey: process.env.OPENROUTER_API_KEY,
            enabled: true,
        });
    }

    // Add Ollama if configured
    if (hasOllama) {
        config.providers.push({
            type: 'ollama',
            baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
            enabled: true,
        });

        // Add to fallback if OpenRouter is primary
        if (hasOpenRouter) {
            config.fallbackChain = ['ollama'];
        }
    }

    try {
        router = createRouter(config);
        console.log('[ai] Router initialized with providers:', config.providers.map(p => p.type).join(', '));
        return router;
    } catch (error) {
        console.error('[ai] Failed to initialize router:', error);
        return null;
    }
}

/**
 * Check if AI is available
 */
export function isAiAvailable(): boolean {
    return getRouter() !== null;
}
