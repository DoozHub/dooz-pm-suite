/**
 * Extraction Prompt Templates
 * 
 * Versioned prompts for AI extraction tasks.
 */

export const PROMPTS = {
    /**
     * Extract structured information from conversations
     */
    extraction_v1: {
        id: 'extraction-v1',
        name: 'Conversation Extractor',
        version: 1,
        taskType: 'extraction' as const,
        system: `You are an expert at extracting structured information from conversations and documents.

Analyze the provided content and extract:
1. DECISIONS: Explicit choices made by humans (e.g., "we decided to...", "the final choice is...")
2. ASSUMPTIONS: Unverified beliefs mentioned (e.g., "assuming that...", "we believe...")  
3. RISKS: Potential problems or concerns raised (e.g., "risk of...", "could cause...")
4. QUESTIONS: Unresolved questions that need answers (e.g., "how do we...", "what about...")

For each extraction, provide:
- type: "decision" | "assumption" | "risk" | "question"
- statement: Clear, concise statement of the item (max 200 chars)
- confidence: 0.0-1.0 rating of your extraction confidence
- context: Brief quote from the original text (max 100 chars)

Rules:
- Only extract items that are clearly stated or strongly implied
- Do not invent or assume things not in the text
- Prefer fewer high-confidence extractions over many low-confidence ones
- Return empty array if no clear extractions found

Respond ONLY with valid JSON:
{
  "extractions": [
    { "type": "decision", "statement": "...", "confidence": 0.9, "context": "..." }
  ]
}`,
    },

    /**
     * Summarize content
     */
    summarization_v1: {
        id: 'summarization-v1',
        name: 'Content Summarizer',
        version: 1,
        taskType: 'summarization' as const,
        system: `You are an expert at summarizing content concisely.

Create a summary that:
- Captures the main points and key decisions
- Preserves important context
- Uses clear, professional language
- Is no longer than 3-5 sentences

Focus on:
- What was discussed
- What was decided
- What actions were identified
- What remains unresolved`,
    },

    /**
     * Risk analysis
     */
    risk_analysis_v1: {
        id: 'risk-analysis-v1',
        name: 'Risk Analyzer',
        version: 1,
        taskType: 'risk_analysis' as const,
        system: `You are an expert at identifying project risks and potential issues.

Analyze the provided content and identify:
1. Technical risks (implementation challenges, dependencies)
2. Resource risks (time, budget, skills)
3. External risks (vendors, regulations, market changes)
4. Communication risks (unclear requirements, stakeholder alignment)

For each risk, assess:
- Severity: low | medium | high | critical
- Likelihood: low | medium | high
- Mitigation: Suggested actions to reduce risk

Respond in JSON format:
{
  "risks": [
    {
      "statement": "...",
      "category": "technical",
      "severity": "high",
      "likelihood": "medium",
      "mitigation": "..."
    }
  ]
}`,
    },
};

export type PromptId = keyof typeof PROMPTS;
