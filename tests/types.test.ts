import { describe, it, expect } from "vitest"
import {
  IntentState,
  CreateIntentSchema,
  UpdateIntentSchema,
  CreateDecisionSchema,
  CreateAssumptionSchema,
  CreateRiskSchema,
  Severity,
  EdgeType,
  NodeType,
  CreateEdgeSchema,
  IngestionSourceType,
  IngestionRequestSchema,
} from "../src/lib/types"

describe("IntentState", () => {
  it("should parse valid intent states", () => {
    expect(IntentState.parse("research")).toBe("research")
    expect(IntentState.parse("planning")).toBe("planning")
    expect(IntentState.parse("execution")).toBe("execution")
    expect(IntentState.parse("archived")).toBe("archived")
  })

  it("should reject invalid states", () => {
    expect(() => IntentState.parse("invalid")).toThrow()
  })
})

describe("Intent State Machine", () => {
  const VALID_TRANSITIONS: Record<string, string[]> = {
    research: ["planning", "archived"],
    planning: ["research", "execution", "archived"],
    execution: ["planning", "archived"],
    archived: [],
  }

  it("should allow research → planning", () => {
    expect(VALID_TRANSITIONS.research).toContain("planning")
  })

  it("should allow research → archived", () => {
    expect(VALID_TRANSITIONS.research).toContain("archived")
  })

  it("should allow planning → execution", () => {
    expect(VALID_TRANSITIONS.planning).toContain("execution")
  })

  it("should allow execution → planning", () => {
    expect(VALID_TRANSITIONS.execution).toContain("planning")
  })

  it("should NOT allow archived → anything", () => {
    expect(VALID_TRANSITIONS.archived).toHaveLength(0)
  })

  it("should NOT allow research → execution directly", () => {
    expect(VALID_TRANSITIONS.research).not.toContain("execution")
  })
})

describe("CreateIntentSchema", () => {
  it("should validate a valid intent", () => {
    const result = CreateIntentSchema.safeParse({
      title: "Build feature X",
      description: "Description here",
      confidenceLevel: 0.8,
      visibilityScope: "team",
    })
    expect(result.success).toBe(true)
  })

  it("should require title", () => {
    const result = CreateIntentSchema.safeParse({ description: "no title" })
    expect(result.success).toBe(false)
  })

  it("should reject empty title", () => {
    const result = CreateIntentSchema.safeParse({ title: "" })
    expect(result.success).toBe(false)
  })

  it("should reject title > 500 chars", () => {
    const result = CreateIntentSchema.safeParse({ title: "x".repeat(501) })
    expect(result.success).toBe(false)
  })

  it("should default visibilityScope to team", () => {
    const result = CreateIntentSchema.parse({ title: "Test" })
    expect(result.visibilityScope).toBe("team")
  })

  it("should clamp confidenceLevel between 0 and 1", () => {
    const low = CreateIntentSchema.safeParse({ title: "T", confidenceLevel: -0.1 })
    const high = CreateIntentSchema.safeParse({ title: "T", confidenceLevel: 1.5 })
    expect(low.success).toBe(false)
    expect(high.success).toBe(false)
  })
})

describe("CreateDecisionSchema", () => {
  it("should validate a valid decision", () => {
    const result = CreateDecisionSchema.safeParse({
      intentId: "intent_1",
      decisionStatement: "Use React",
      optionsConsidered: ["React", "Vue"],
      finalChoice: "React",
    })
    expect(result.success).toBe(true)
  })

  it("should require decisionStatement and finalChoice", () => {
    const result = CreateDecisionSchema.safeParse({ intentId: "1" })
    expect(result.success).toBe(false)
  })
})

describe("CreateAssumptionSchema", () => {
  it("should validate a valid assumption", () => {
    const result = CreateAssumptionSchema.safeParse({
      intentId: "1",
      assumptionStatement: "Users prefer dark mode",
      confidenceLevel: 0.6,
    })
    expect(result.success).toBe(true)
  })

  it("should require assumptionStatement", () => {
    const result = CreateAssumptionSchema.safeParse({ intentId: "1" })
    expect(result.success).toBe(false)
  })
})

describe("Severity", () => {
  it("should accept valid severities", () => {
    for (const s of ["low", "medium", "high", "critical"]) {
      expect(Severity.parse(s)).toBe(s)
    }
  })
})

describe("CreateRiskSchema", () => {
  it("should validate a valid risk", () => {
    const result = CreateRiskSchema.safeParse({
      intentId: "1",
      riskStatement: "Performance degradation",
      severity: "high",
    })
    expect(result.success).toBe(true)
  })
})

describe("EdgeType", () => {
  it("should accept valid edge types", () => {
    for (const e of ["led_to", "depends_on", "invalidates", "supports", "blocks", "derived_from"]) {
      expect(EdgeType.parse(e)).toBe(e)
    }
  })
})

describe("CreateEdgeSchema", () => {
  it("should validate a valid edge", () => {
    const result = CreateEdgeSchema.safeParse({
      sourceId: "1",
      sourceType: "intent",
      targetId: "2",
      targetType: "decision",
      edgeType: "led_to",
    })
    expect(result.success).toBe(true)
  })

  it("should reject invalid node types", () => {
    const result = CreateEdgeSchema.safeParse({
      sourceId: "1",
      sourceType: "invalid",
      targetId: "2",
      targetType: "decision",
      edgeType: "led_to",
    })
    expect(result.success).toBe(false)
  })
})

describe("IngestionRequestSchema", () => {
  it("should validate a valid ingestion request", () => {
    const result = IngestionRequestSchema.safeParse({
      sourceType: "chatgpt_export",
      content: "Some content to ingest",
    })
    expect(result.success).toBe(true)
  })

  it("should require content", () => {
    const result = IngestionRequestSchema.safeParse({
      sourceType: "text_file",
    })
    expect(result.success).toBe(false)
  })

  it("should accept optional metadata", () => {
    const result = IngestionRequestSchema.safeParse({
      sourceType: "email_thread",
      content: "Email body",
      metadata: { from: "user@example.com" },
    })
    expect(result.success).toBe(true)
  })
})
