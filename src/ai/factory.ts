/**
 * AI Provider Factory
 * 
 * Creates the appropriate AI provider based on configuration.
 */

import type { AiProvider, AiProviderConfig } from './provider';
import { BrainProvider } from './brain-provider';
import { StandaloneProvider } from './standalone-provider';

let currentProvider: AiProvider | null = null;
let currentConfig: AiProviderConfig | null = null;

/**
 * Get AI provider configuration from environment
 */
export function getProviderConfig(): AiProviderConfig {
    const mode = (process.env.AI_PROVIDER_MODE || 'standalone') as 'brain' | 'standalone';

    return {
        mode,
        brainUrl: process.env.BRAIN_URL || 'http://localhost:3333',
        brainApiKey: process.env.BRAIN_API_KEY,
    };
}

/**
 * Get or create the AI provider
 */
export function getProvider(config?: AiProviderConfig): AiProvider {
    const cfg = config || getProviderConfig();

    // Return cached if config unchanged
    if (currentProvider && currentConfig?.mode === cfg.mode) {
        return currentProvider;
    }

    currentConfig = cfg;

    if (cfg.mode === 'brain') {
        if (!cfg.brainUrl) {
            console.warn('[ai] Brain mode requested but BRAIN_URL not set. Falling back to standalone.');
            currentProvider = new StandaloneProvider();
        } else {
            console.log(`[ai] Using Brain provider at ${cfg.brainUrl}`);
            currentProvider = new BrainProvider({
                brainUrl: cfg.brainUrl,
                apiKey: cfg.brainApiKey,
            });
        }
    } else {
        console.log('[ai] Using Standalone provider');
        currentProvider = new StandaloneProvider();
    }

    return currentProvider;
}

/**
 * Check if AI is available (either mode)
 */
export async function isAiAvailable(): Promise<boolean> {
    try {
        const provider = getProvider();
        return await provider.isAvailable();
    } catch {
        return false;
    }
}

/**
 * Get the current provider mode
 */
export function getProviderMode(): 'brain' | 'standalone' {
    return getProviderConfig().mode;
}
