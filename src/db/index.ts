/**
 * Dooz PM Suite - Database Connection
 * 
 * Development: Bun's native SQLite
 * Production: Switch to PostgreSQL (see drizzle.config.ts)
 * 
 * NOTE: For the skeleton, we use SQLite only to avoid TypeScript union issues.
 * Production migration will require schema adaptation via Drizzle migrations.
 */

import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from './schema';

// SQLite for development
const sqlite = new Database('./data/pm-suite.db', { create: true });
export const db = drizzle(sqlite, { schema });

export type DB = typeof db;
