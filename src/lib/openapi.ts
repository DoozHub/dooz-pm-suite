export function getOpenApiSpec() {
  return {
    openapi: "3.0.3",
    info: {
      title: "Dooz PM Suite API",
      description:
        "AI-Era Project Management Control Plane — Human-in-the-loop intent management, decision tracking, and organizational memory.",
      version: "1.0.0",
    },
    servers: [{ url: "http://localhost:3000", description: "Local development" }],
    security: [{ BearerAuth: [] }],
    paths: {
      "/api/intents": {
        get: {
          summary: "List intents",
          tags: ["Intents"],
          parameters: [
            {
              name: "state",
              in: "query",
              required: false,
              schema: {
                type: "string",
                enum: ["research", "planning", "execution", "archived"],
              },
            },
          ],
          responses: {
            "200": {
              description: "List of intents",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Intent" },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Create intent",
          tags: ["Intents"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateIntent" },
              },
            },
          },
          responses: {
            "201": {
              description: "Created intent",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Intent" },
                },
              },
            },
          },
        },
      },
      "/api/intents/{id}": {
        get: {
          summary: "Get intent",
          tags: ["Intents"],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Intent details",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Intent" },
                },
              },
            },
            "404": { description: "Intent not found" },
          },
        },
        patch: {
          summary: "Update intent",
          tags: ["Intents"],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateIntent" },
              },
            },
          },
          responses: {
            "200": {
              description: "Updated intent",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Intent" },
                },
              },
            },
            "404": { description: "Intent not found" },
          },
        },
      },
      "/api/intents/{id}/transition": {
        post: {
          summary: "Transition intent state",
          tags: ["Intents"],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TransitionIntent" },
              },
            },
          },
          responses: {
            "200": {
              description: "Transitioned intent",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Intent" },
                },
              },
            },
          },
        },
      },
      "/api/intents/{id}/review": {
        post: {
          summary: "Mark intent as reviewed",
          tags: ["Intents"],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Reviewed intent",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Intent" },
                },
              },
            },
          },
        },
      },
      "/api/decisions": {
        get: {
          summary: "List decisions",
          tags: ["Decisions"],
          responses: {
            "200": {
              description: "List of decisions",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Decision" },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Create decision",
          tags: ["Decisions"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateDecision" },
              },
            },
          },
          responses: {
            "201": {
              description: "Created decision",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Decision" },
                },
              },
            },
          },
        },
      },
      "/api/assumptions": {
        get: {
          summary: "List assumptions",
          tags: ["Assumptions"],
          parameters: [
            {
              name: "intentId",
              in: "query",
              required: false,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "List of assumptions",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Assumption" },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Create assumption",
          tags: ["Assumptions"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateAssumption" },
              },
            },
          },
          responses: {
            "201": {
              description: "Created assumption",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Assumption" },
                },
              },
            },
          },
        },
      },
      "/api/risks": {
        get: {
          summary: "List risks",
          tags: ["Risks"],
          parameters: [
            {
              name: "intentId",
              in: "query",
              required: false,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "List of risks",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Risk" },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Create risk",
          tags: ["Risks"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateRisk" },
              },
            },
          },
          responses: {
            "201": {
              description: "Created risk",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Risk" },
                },
              },
            },
          },
        },
      },
      "/api/tasks": {
        get: {
          summary: "List tasks",
          tags: ["Tasks"],
          responses: {
            "200": {
              description: "List of tasks",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Task" },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Create task",
          tags: ["Tasks"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateTask" },
              },
            },
          },
          responses: {
            "201": {
              description: "Created task",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Task" },
                },
              },
            },
          },
        },
      },
      "/api/edges": {
        get: {
          summary: "List edges",
          tags: ["Edges"],
          responses: {
            "200": {
              description: "List of edges",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Edge" },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Create edge",
          tags: ["Edges"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateEdge" },
              },
            },
          },
          responses: {
            "201": {
              description: "Created edge",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Edge" },
                },
              },
            },
          },
        },
      },
      "/api/ingestion": {
        post: {
          summary: "Ingest content",
          tags: ["Ingestion"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/IngestContent" },
              },
            },
          },
          responses: {
            "202": {
              description: "Content accepted for ingestion",
            },
          },
        },
      },
      "/api/graph/{intentId}": {
        get: {
          summary: "Get knowledge graph for intent",
          tags: ["Graph"],
          parameters: [
            {
              name: "intentId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Knowledge graph",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/KnowledgeGraph" },
                },
              },
            },
          },
        },
      },
      "/api/insights/health": {
        get: {
          summary: "Get health scores",
          tags: ["Insights"],
          responses: {
            "200": {
              description: "Health scores",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthScores" },
                },
              },
            },
          },
        },
      },
      "/api/insights/health/{intentId}": {
        get: {
          summary: "Get intent health",
          tags: ["Insights"],
          parameters: [
            {
              name: "intentId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Intent health",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/IntentHealth" },
                },
              },
            },
          },
        },
      },
      "/api/insights/assumptions": {
        get: {
          summary: "Check assumption decay",
          tags: ["Insights"],
          responses: {
            "200": {
              description: "Assumption decay data",
            },
          },
        },
      },
      "/api/insights/assumptions/{intentId}": {
        get: {
          summary: "Check intent assumptions",
          tags: ["Insights"],
          parameters: [
            {
              name: "intentId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Intent assumption checks",
            },
          },
        },
      },
      "/api/insights/assumptions/{id}/invalidate": {
        post: {
          summary: "Invalidate assumption",
          tags: ["Insights"],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Assumption invalidated",
            },
          },
        },
      },
      "/api/insights/generate": {
        post: {
          summary: "Generate AI insights",
          tags: ["Insights"],
          parameters: [
            {
              name: "intentId",
              in: "query",
              required: false,
              schema: { type: "string" },
            },
            {
              name: "tenantId",
              in: "query",
              required: false,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Generated insights",
            },
          },
        },
      },
      "/api/insights/hindsight/start": {
        post: {
          summary: "Start hindsight lifecycle",
          tags: ["Insights"],
          responses: {
            "200": {
              description: "Hindsight lifecycle started",
            },
          },
        },
      },
      "/api/insights/hindsight/stop": {
        post: {
          summary: "Stop hindsight lifecycle",
          tags: ["Insights"],
          responses: {
            "200": {
              description: "Hindsight lifecycle stopped",
            },
          },
        },
      },
      "/api/insights/{intentId}": {
        get: {
          summary: "Get insights for intent",
          tags: ["Insights"],
          parameters: [
            {
              name: "intentId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Insights for intent",
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Intent: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            state: {
              type: "string",
              enum: ["research", "planning", "execution", "archived"],
            },
            confidenceLevel: { type: "number" },
            visibilityScope: {
              type: "string",
              enum: ["private", "team", "organization"],
            },
            tenantId: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateIntent: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            confidenceLevel: { type: "number" },
            visibilityScope: {
              type: "string",
              enum: ["private", "team", "organization"],
            },
          },
        },
        UpdateIntent: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            confidenceLevel: { type: "number" },
            visibilityScope: {
              type: "string",
              enum: ["private", "team", "organization"],
            },
          },
        },
        TransitionIntent: {
          type: "object",
          required: ["state"],
          properties: {
            state: {
              type: "string",
              enum: ["research", "planning", "execution", "archived"],
            },
          },
        },
        Decision: {
          type: "object",
          properties: {
            id: { type: "string" },
            intentId: { type: "string" },
            decisionStatement: { type: "string" },
            optionsConsidered: {
              type: "array",
              items: { type: "string" },
            },
            finalChoice: { type: "string" },
            revisitCondition: { type: "string" },
            tenantId: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateDecision: {
          type: "object",
          required: ["intentId", "decisionStatement", "finalChoice"],
          properties: {
            intentId: { type: "string" },
            decisionStatement: { type: "string" },
            optionsConsidered: {
              type: "array",
              items: { type: "string" },
            },
            finalChoice: { type: "string" },
            revisitCondition: { type: "string" },
          },
        },
        Assumption: {
          type: "object",
          properties: {
            id: { type: "string" },
            intentId: { type: "string" },
            assumptionStatement: { type: "string" },
            confidenceLevel: { type: "number" },
            expiryHint: { type: "string" },
            invalidated: { type: "boolean" },
            tenantId: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateAssumption: {
          type: "object",
          required: ["intentId", "assumptionStatement"],
          properties: {
            intentId: { type: "string" },
            assumptionStatement: { type: "string" },
            confidenceLevel: { type: "number" },
            expiryHint: { type: "string" },
          },
        },
        Risk: {
          type: "object",
          properties: {
            id: { type: "string" },
            intentId: { type: "string" },
            riskStatement: { type: "string" },
            severity: {
              type: "string",
              enum: ["low", "medium", "high", "critical"],
            },
            tenantId: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateRisk: {
          type: "object",
          required: ["intentId", "riskStatement"],
          properties: {
            intentId: { type: "string" },
            riskStatement: { type: "string" },
            severity: {
              type: "string",
              enum: ["low", "medium", "high", "critical"],
            },
          },
        },
        Task: {
          type: "object",
          properties: {
            id: { type: "string" },
            tenantId: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateTask: {
          type: "object",
          properties: {},
        },
        Edge: {
          type: "object",
          properties: {
            id: { type: "string" },
            sourceId: { type: "string" },
            sourceType: { type: "string" },
            targetId: { type: "string" },
            targetType: { type: "string" },
            edgeType: {
              type: "string",
              enum: [
                "led_to",
                "depends_on",
                "invalidates",
                "supports",
                "blocks",
                "derived_from",
              ],
            },
            tenantId: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        CreateEdge: {
          type: "object",
          required: ["sourceId", "sourceType", "targetId", "targetType", "edgeType"],
          properties: {
            sourceId: { type: "string" },
            sourceType: { type: "string" },
            targetId: { type: "string" },
            targetType: { type: "string" },
            edgeType: {
              type: "string",
              enum: [
                "led_to",
                "depends_on",
                "invalidates",
                "supports",
                "blocks",
                "derived_from",
              ],
            },
          },
        },
        IngestContent: {
          type: "object",
          required: ["sourceType", "content"],
          properties: {
            intentId: { type: "string" },
            sourceType: {
              type: "string",
              enum: [
                "chatgpt_export",
                "claude_export",
                "text_file",
                "email_thread",
                "meeting_notes",
              ],
            },
            content: { type: "string" },
          },
        },
        KnowledgeGraph: {
          type: "object",
          properties: {
            nodes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  type: { type: "string" },
                  label: { type: "string" },
                },
              },
            },
            edges: {
              type: "array",
              items: { $ref: "#/components/schemas/Edge" },
            },
          },
        },
        HealthScores: {
          type: "object",
          properties: {
            overall: { type: "number" },
            intents: {
              type: "array",
              items: { $ref: "#/components/schemas/IntentHealth" },
            },
          },
        },
        IntentHealth: {
          type: "object",
          properties: {
            intentId: { type: "string" },
            score: { type: "number" },
            factors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "number" },
                },
              },
            },
          },
        },
      },
    },
  };
}
