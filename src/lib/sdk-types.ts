/**
 * SDK Types Fallback
 * 
 * Local type definitions for @dooz/sdk when the actual package
 * types are not available. This ensures PM Suite compiles standalone.
 */

// Re-export from SDK if available
export type { Tenant, DoozClient } from '@dooz/sdk';
export { createDoozClient } from '@dooz/sdk';
