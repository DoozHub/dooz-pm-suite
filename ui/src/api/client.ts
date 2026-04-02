import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-ID': import.meta.env.VITE_TENANT_ID || 'dev-tenant',
    'X-User-ID': import.meta.env.VITE_USER_ID || 'dev-user',
  },
})

export interface Intent {
  id: string
  tenantId: string
  title: string
  description: string | null
  currentState: 'research' | 'planning' | 'execution' | 'archived'
  createdBy: string
  createdAt: string | null
  lastHumanReviewedAt: string | null
  confidenceLevel: number | null
  visibilityScope: string | null
}

export interface Decision {
  id: string
  intentId: string | null
  decisionStatement: string
  optionsConsidered: string | null
  finalChoice: string
  humanApprover: string
  aiInputsReferenced: string | null
  decisionTimestamp: string | null
  revisitCondition: string | null
  status: 'active' | 'superseded'
}

export interface Assumption {
  id: string
  intentId: string | null
  assumptionStatement: string
  confidenceLevel: number | null
  createdFrom: 'human' | 'ai' | null
  createdAt: string | null
  status: 'active' | 'invalidated'
  expiryHint: string | null
}

export interface Risk {
  id: string
  intentId: string | null
  riskStatement: string
  severity: 'low' | 'medium' | 'high' | 'critical' | null
  likelihood: 'low' | 'medium' | 'high' | null
  createdFrom: 'human' | 'ai' | null
  mitigationNotes: string | null
  status: 'active' | 'mitigated' | 'accepted'
}

export interface Task {
  id: string
  intentId: string | null
  decisionId: string | null
  title: string
  description: string | null
  owner: string | null
  status: string
  createdAt: string | null
}

export interface Proposal {
  id: string
  intentId: string | null
  proposalType: 'decision' | 'assumption' | 'risk' | 'question'
  content: string
  promptTemplateId: string | null
  modelUsed: string | null
  confidence: number | null
  status: 'pending' | 'accepted' | 'rejected' | 'parked'
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string | null
}

export interface GraphNode {
  id: string
  type: 'intent' | 'decision' | 'assumption' | 'risk' | 'task'
  label: string
  data?: Record<string, unknown>
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: string
  label?: string
}

export interface KnowledgeGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface IntentStats {
  decisions: number
  assumptions: number
  risks: number
  tasks: number
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

async function request<T>(endpoint: string, options?: { method?: string; body?: unknown }): Promise<ApiResponse<T>> {
  try {
    const { method = 'GET', body } = options || {}
    const response = await apiClient.request<T>({
      url: endpoint,
      method,
      data: body,
    })
    return { data: response.data as T }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return { error: error.response.data?.error || error.message }
    }
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export const api = {
  health: () => request<{ status: string; version: string }>('/health'),

  aiStatus: () => request<{ aiAvailable: boolean; message: string }>('/api/ingestion/status'),

  listIntents: (state?: string) =>
    request<Intent[]>(`/api/intents${state ? `?state=${state}` : ''}`),

  getIntent: (id: string) =>
    request<Intent>(`/api/intents/${id}`),

  createIntent: (data: { title: string; description?: string }) =>
    request<Intent>('/api/intents', {
      method: 'POST',
      body: data,
    }),

  transitionIntent: (id: string, state: string) =>
    request<Intent>(`/api/intents/${id}/transition`, {
      method: 'POST',
      body: { state },
    }),

  listDecisions: (intentId: string, all = false) =>
    request<Decision[]>(`/api/decisions/intent/${intentId}${all ? '?all=true' : ''}`),

  getDecisionLedger: (intentId: string) =>
    request<Decision[]>(`/api/decisions/ledger/${intentId}`),

  commitDecision: (data: {
    intentId: string
    decisionStatement: string
    finalChoice: string
    optionsConsidered?: string[]
    revisitCondition?: string
  }) =>
    request<Decision>('/api/decisions', {
      method: 'POST',
      body: data,
    }),

  listAssumptions: (intentId: string) =>
    request<Assumption[]>(`/api/assumptions?intentId=${intentId}`),

  createAssumption: (data: {
    intentId: string
    assumptionStatement: string
    confidenceLevel?: number
    createdFrom?: 'human' | 'ai'
    expiryHint?: string
  }) =>
    request<Assumption>('/api/assumptions', {
      method: 'POST',
      body: data,
    }),

  invalidateAssumption: (id: string) =>
    request<Assumption>(`/api/assumptions/${id}/invalidate`, {
      method: 'POST',
    }),

  listRisks: (intentId: string) =>
    request<Risk[]>(`/api/risks?intentId=${intentId}`),

  createRisk: (data: {
    intentId: string
    riskStatement: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
    likelihood?: 'low' | 'medium' | 'high'
    mitigationNotes?: string
  }) =>
    request<Risk>('/api/risks', {
      method: 'POST',
      body: data,
    }),

  mitigateRisk: (id: string, notes: string) =>
    request<Risk>(`/api/risks/${id}/mitigate`, {
      method: 'POST',
      body: { mitigationNotes: notes },
    }),

  listTasks: (intentId: string) =>
    request<Task[]>(`/api/tasks/intent/${intentId}`),

  createTask: (data: {
    intentId: string
    title: string
    description?: string
    owner?: string
  }) =>
    request<Task>('/api/tasks', {
      method: 'POST',
      body: data,
    }),

  updateTaskStatus: (id: string, status: string) =>
    request<Task>(`/api/tasks/${id}/status`, {
      method: 'POST',
      body: { status },
    }),

  getIntentStats: async (intentId: string): Promise<ApiResponse<IntentStats>> => {
    const [decisions, assumptions, risks, tasks] = await Promise.all([
      request<Decision[]>(`/api/decisions/intent/${intentId}`),
      request<Assumption[]>(`/api/assumptions?intentId=${intentId}`),
      request<Risk[]>(`/api/risks?intentId=${intentId}`),
      request<Task[]>(`/api/tasks/intent/${intentId}`),
    ])
    return {
      data: {
        decisions: decisions.data?.length || 0,
        assumptions: assumptions.data?.length || 0,
        risks: risks.data?.length || 0,
        tasks: tasks.data?.length || 0,
      },
    }
  },

  getProposals: (intentId: string) =>
    request<Proposal[]>(`/api/ingestion/proposals?intentId=${intentId}`),

  acceptProposal: (id: string) =>
    request<{ message: string }>(`/api/ingestion/proposals/${id}/accept`, {
      method: 'POST',
    }),

  rejectProposal: (id: string) =>
    request<{ message: string }>(`/api/ingestion/proposals/${id}/reject`, {
      method: 'POST',
    }),

  parkProposal: (id: string) =>
    request<{ message: string }>(`/api/ingestion/proposals/${id}/park`, {
      method: 'POST',
    }),

  ingestContent: (data: { intentId?: string; sourceType: string; content: string }) =>
    request<{ proposals: Proposal[] }>('/api/ingestion', {
      method: 'POST',
      body: data,
    }),

  getKnowledgeGraph: () =>
    request<KnowledgeGraph>('/api/graph'),

  getGraphEdges: (nodeId: string, direction?: 'incoming' | 'outgoing' | 'both') =>
    request<GraphEdge[]>(`/api/graph/node/${nodeId}/edges${direction ? `?direction=${direction}` : ''}`),

  traverseGraph: (startId: string, depth = 2, edgeTypes?: string[]) =>
    request<{ nodes: GraphNode[]; edges: GraphEdge[] }>(
      `/api/graph/traverse/${startId}?depth=${depth}${edgeTypes ? `&edgeTypes=${edgeTypes.join(',')}` : ''}`
    ),

  getGraphStats: (intentId: string) =>
    request<{ intentId: string; nodeCount: number; edgeCount: number; decisionCount: number; assumptionCount: number; riskCount: number }>(
      `/api/graph/stats/${intentId}`
    ),
}


