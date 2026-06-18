/**
 * SDK types — self-contained, no external @dooz/sdk dependency.
 *
 * The previous implementation re-exported from `@dooz/sdk`, which was
 * never resolvable. These types describe the shape we *would* consume
 * from a real Dooz SDK; until that SDK exists, the runtime paths in
 * `src/middleware/sdk.ts` are guarded by `DOOZ_SERVICE_TOKEN` and
 * degrade to "no-op + bypass".
 *
 * See: dooz-atlas/09_ECOSYSTEM/sdk-resolution.md
 */

export interface Tenant {
    id: string;
    name: string;
    isTrial: boolean;
    trialDaysRemaining: number;
}

export interface DoozClient {
    hasLicense(appName: string, userId?: string): Promise<boolean>;
    can(permission: string, userId?: string): Promise<boolean>;
    audit(action: string, metadata?: Record<string, unknown>, context?: { userId: string }): Promise<void>;
    getCurrentTenant(): Promise<Tenant>;
    getLicenseInfo(appName: string): Promise<{ hasLicense: boolean; hasSeat: boolean; licenseStatus: string; expiresAt: string | null }>;
    getFeatures(appName?: string): Promise<string[]>;
    hasFeature(feature: string, appName?: string): Promise<boolean>;
    withUserToken(token: string): DoozClient;
    forTenant(tenantId: string): DoozClient;
    isTrial(): Promise<boolean>;
}
