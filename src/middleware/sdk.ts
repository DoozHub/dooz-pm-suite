/**
 * Dooz SDK Middleware for Hono.
 *
 * Provides tenant context, authentication, and permissions. The actual
 * DoozClient factory (`createDoozClient`) used to be imported from
 * `@dooz/sdk`, which is no longer a resolvable package. The middleware
 * still works: when `DOOZ_SERVICE_TOKEN` is unset (the default), the
 * client is `null` and downstream code degrades to a permissive bypass.
 * When the token is set, callers should wire up a real implementation
 * against dooz-core's SDK API endpoints (see sdk-types.ts).
 *
 * See: dooz-atlas/09_ECOSYSTEM/sdk-resolution.md
 */

import type { MiddlewareHandler } from 'hono';
import type { Tenant, DoozClient } from '../lib/sdk-types';

function getDoozConfig() {
    return {
        apiEndpoint: process.env['DOOZ_API_ENDPOINT'] || 'http://localhost:8000/api/sdk',
        serviceToken: process.env['DOOZ_SERVICE_TOKEN'],
        debug: process.env['DOOZ_DEBUG'] === 'true',
        cacheEnabled: true,
        cacheTtl: 300,
    };
}

// Local stub. A real implementation will be added in a future wave that
// calls dooz-core's SDK API endpoints using the service token.
function createLocalStubClient(_config: ReturnType<typeof getDoozConfig>): DoozClient {
    const stub: DoozClient = {
        async hasLicense() { return true; },
        async can() { return true; },
        async audit() {},
        async getCurrentTenant() { return { id: 'stub', name: 'stub', isTrial: false, trialDaysRemaining: 0 }; },
        async getLicenseInfo() { return { hasLicense: true, hasSeat: true, licenseStatus: 'active', expiresAt: null }; },
        async getFeatures() { return []; },
        async hasFeature() { return true; },
        async isTrial() { return false; },
        withUserToken() { return stub; },
        forTenant() { return stub; },
    };
    return stub;
}

let sharedClient: DoozClient | null = null;

function getClient(): DoozClient | null {
    if (sharedClient) return sharedClient;

    const config = getDoozConfig();
    if (!config.serviceToken) {
        console.warn('[sdk] No DOOZ_SERVICE_TOKEN configured - SDK disabled');
        return null;
    }

    sharedClient = createLocalStubClient(config);
    console.log('[sdk] Client initialized:', config.apiEndpoint);
    return sharedClient;
}

export interface SdkContext {
    tenantId: string;
    userId: string;
    tenant?: Tenant;
    dooz?: DoozClient;
}

declare module 'hono' {
    interface ContextVariableMap {
        dooz: DoozClient | undefined;
    }
}

export function isSdkConfigured(): boolean {
    return getClient() !== null;
}

export const sdkContextMiddleware: MiddlewareHandler = async (c, next) => {
    const client = getClient() ?? undefined;
    c.set('dooz', client);
    await next();
};

export const tenantContextMiddleware = (tenantId: string): MiddlewareHandler => {
    return async (c, next) => {
        c.set('dooz', c.get('dooz') ?? getClient() ?? undefined);
        // The actual tenant validation can be wired in when a real
        // DoozClient is available. For now, attach and continue.
        await next();
    };
};

export const requirePermission = (permission: string): MiddlewareHandler => {
    return async (c, next) => {
        const client = c.get('dooz') ?? getClient();
        if (!client) {
            // SDK disabled — bypass in dev, deny in prod.
            if (process.env['NODE_ENV'] === 'production') {
                return c.json({ error: 'Forbidden' }, 403);
            }
            return next();
        }
        try {
            const allowed = await client.can(permission);
            if (!allowed) {
                return c.json({ error: 'Forbidden', permission }, 403);
            }
        } catch (error) {
            console.error('[sdk] Permission check failed:', error);
            if (process.env['NODE_ENV'] === 'production') {
                return c.json({ error: 'Permission check failed' }, 500);
            }
        }
        await next();
    };
};
