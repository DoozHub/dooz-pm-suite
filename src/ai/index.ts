/**
 * AI Module Exports
 */

// Legacy exports (keep for backward compatibility)
export { getRouter } from './router';

// New provider abstraction
export { getProvider, getProviderConfig, getProviderMode, isAiAvailable } from './factory';
export type { AiProvider, AiProviderConfig, CompletionRequest, CompletionResponse, ContextRequest, ContextResponse } from './provider';
export { BrainProvider } from './brain-provider';
export { StandaloneProvider } from './standalone-provider';

// Prompts
export { PROMPTS, type PromptId } from './prompts/extraction';

