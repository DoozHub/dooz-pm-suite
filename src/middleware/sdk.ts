/**
 * Dooz SDK Middleware for Hono
 * 
 * Provides tenant context, authentication, and permissions.
 */

import type { MiddlewareHandler } from 'hono';
import { createDoozClient, type DoozClient, type Tenant } from '@dooz/sdk';

// SDK configuration from environment
function getDoozConfig() {
    return {
        apiEndpoint: process.env.DOOZ_API_ENDPOINT || 'http://localhost:8000/api/sdk',
        serviceToken: process.env.DOOZ_SERVICE_TOKEN,
        debug: process.env.DOOZ_DEBUG === 'true',
        cacheEnabled: true,
        cacheTtl: 300,
    };
}

// Shared client instance
let sharedClient: DoozClient | null = null;

function getClient(): DoozClient | null {
    if (sharedClient) return sharedClient;

    const config = getDoozConfig();
    if (!config.serviceToken) {
        console.warn('[sdk] No DOOZ_SERVICE_TOKEN configured - SDK disabled');
        return null;
    }

    sharedClient = createDoozClient(config);
    console.log('[sdk] Client initialized:', config.apiEndpoint);
    return sharedClient;
}

/**
 * Extended context variables for SDK middleware
 */
export interface SdkContext {
    tenantId: string;
    userId: string;
    tenant?: Tenant;
    dooz?: DoozClient;
}

/**
 * SDK Context Middleware
 * 
 * Resolves tenant and user from headers or token.
 * Falls back to dev values if SDK is not configured.
 */
export function sdkContext(): MiddlewareHandler {
    return async (c, next) => {
        const client = getClient();

        // Read headers
        const authHeader = c.req.header('Authorization');
        const tenantHeader = c.req.header('X-Tenant-ID');
        const userHeader = c.req.header('X-User-ID');

        // Development fallback
        if (!client) {
            c.set('tenantId', tenantHeader || 'dev-tenant');
            c.set('userId', userHeader || 'dev-user');
            await next();
            return;
        }

        // Extract token from Bearer header
        const token = authHeader?.replace('Bearer ', '');

        // Scope client to tenant if provided
        let scopedClient = client;
        if (tenantHeader) {
            scopedClient = client.forTenant(tenantHeader);
        }
        if (token) {
            scopedClient = scopedClient.withUserToken(token);
        }

        // Try to resolve tenant
        try {
            const tenant = await scopedClient.getCurrentTenant();
            c.set('tenantId', tenant.id);
            c.set('tenant', tenant);
            c.set('dooz', scopedClient);
        } catch (e) {
            // Fall back to header values
            c.set('tenantId', tenantHeader || 'dev-tenant');
        }

        // Set user from header (token-based user resolution would go here)
        c.set('userId', userHeader || 'dev-user');

        await next();
    };
}

/**
 * License Check Middleware
 * 
 * Requires a valid pm-suite license.
 */
export function requireLicense(appName: string = 'pm-suite'): MiddlewareHandler {
    return async (c, next) => {
        const client = c.get('dooz') as DoozClient | undefined;

        if (!client) {
            // SDK not configured - allow in development
            if (process.env.NODE_ENV !== 'production') {
                await next();
                return;
            }
            return c.json({ error: 'License check unavailable' }, 503);
        }

        const userId = c.get('userId') as string;
        const hasLicense = await client.hasLicense(appName, userId);

        if (!hasLicense) {
            return c.json({ error: 'License required', app: appName }, 403);
        }

        await next();
    };
}

/**
 * Permission Check Middleware
 * 
 * Requires specific permission(s).
 */
export function requirePermission(...permissions: string[]): MiddlewareHandler {
    return async (c, next) => {
        const client = c.get('dooz') as DoozClient | undefined;
        const userId = c.get('userId') as string;

        if (!client) {
            // SDK not configured - allow in development
            if (process.env.NODE_ENV !== 'production') {
                await next();
                return;
            }
            return c.json({ error: 'Permission check unavailable' }, 503);
        }

        for (const permission of permissions) {
            const granted = await client.can(permission, userId);
            if (!granted) {
                return c.json({
                    error: 'Insufficient permissions',
                    required: permission
                }, 403);
            }
        }

        await next();
    };
}

/**
 * Audit logging helper
 */
export async function audit(
    c: { get: (key: string) => unknown },
    action: string,
    metadata?: Record<string, unknown>
): Promise<void> {
    const client = c.get('dooz') as DoozClient | undefined;
    const userId = c.get('userId') as string;

    if (!client) {
        console.log('[audit]', action, { userId, ...metadata });
        return;
    }

    await client.audit(action, metadata, { userId });
}

/**
 * Check if SDK is configured
 */
export function isSdkConfigured(): boolean {
    return !!process.env.DOOZ_SERVICE_TOKEN;
}
