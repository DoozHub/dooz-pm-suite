declare module "@doozhub/ai-router" {
  export interface LlmRequest {
    messages: Array<{ role: string; content: string }>;
    model?: string;
    taskType?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }

  export interface LlmResponse {
    content: string;
    provider: string;
    model: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    latencyMs: number;
  }

  export interface ProviderConfig {
    type: string;
    apiKey?: string;
    baseUrl?: string;
    enabled: boolean;
  }

  export interface RouterConfig {
    providers: ProviderConfig[];
    defaultProvider: string;
    fallbackChain: string[];
    smartRouting: boolean;
    logging: boolean;
  }

  export class LlmRouter {
    complete(request: LlmRequest): Promise<LlmResponse>;
  }

  export function createRouter(config: RouterConfig): LlmRouter;
}
