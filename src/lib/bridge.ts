import { BridgeClient, Topics } from "@doozhub/sdk-bridge"
import type { BridgeEvent, BridgeEventHandler } from "@doozhub/sdk-bridge"

const BRIDGE_URL = process.env.BRIDGE_URL || "http://localhost:3001"

let client: BridgeClient | null = null

export function getBridgeClient(): BridgeClient {
  if (!client) {
    client = new BridgeClient({
      bridgeUrl: BRIDGE_URL,
      appId: "dooz-pm-suite",
      // Sign webhook deliveries when the bridge has WEBHOOK_SECRET set;
      // unsigned when unset (dev bridges reject signed-only in production).
      webhookSecret: process.env.WEBHOOK_SECRET,
      logLevel: "info",
    })
  }
  return client
}

export async function emitIntentCreated(intentId: string, scopeId: string, type: string): Promise<void> {
  try {
    await getBridgeClient().publish(Topics.PM_INTENT_CREATED, { intentId, scopeId, type }, intentId)
  } catch {}
}

export async function emitIntentTransitioned(intentId: string, from: string, to: string): Promise<void> {
  try {
    await getBridgeClient().publish(Topics.PM_INTENT_TRANSITIONED, { intentId, from, to }, intentId)
  } catch {}
}

export async function emitDecisionCommitted(decisionId: string, scopeId: string, domain: string): Promise<void> {
  try {
    await getBridgeClient().publish(Topics.PM_DECISION_COMMITTED, { decisionId, scopeId, domain }, decisionId)
  } catch {}
}

export async function emitTaskCompleted(taskId: string, scopeId: string): Promise<void> {
  try {
    await getBridgeClient().publish(Topics.PM_TASK_COMPLETED, { taskId, scopeId }, taskId)
  } catch {}
}

export function onBridgeEvent(topicPattern: string, handler: BridgeEventHandler): () => void {
  return getBridgeClient().on(topicPattern, handler)
}

export { Topics as PmTopics }
