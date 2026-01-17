/**
 * Dooz PM Suite - Database Connection
 * 
 * Supports dual environment:
 * - Development: SQLite (bun:sqlite)
 * - Production: PostgreSQL (postgres.js)
 */

const isProd = process.env.NODE_ENV === 'production';

// Dynamic import based on environment
let db: any;

if (isProd) {
    // PostgreSQL for production
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const postgres = await import('postgres');
    const schema = await import('./schema');

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is required in production');
    }

    const client = postgres.default(connectionString, {
        max: 20, // Connection pool size
        idle_timeout: 20,
        connect_timeout: 10,
        ssl: process.env.DATABASE_SSL === 'true' ? 'require' : false,
    });

    db = drizzle(client, { schema });
    console.log('[DB] Connected to PostgreSQL');
} else {
    // SQLite for development
    const { drizzle } = await import('drizzle-orm/bun-sqlite');
    const { Database } = await import('bun:sqlite');
    const schema = await import('./schema');

    const sqlite = new Database('./data/pm-suite.db', { create: true });
    sqlite.exec('PRAGMA journal_mode = WAL');
    sqlite.exec('PRAGMA foreign_keys = ON');

    db = drizzle(sqlite, { schema });
    console.log('[DB] Connected to SQLite (development mode)');
}

export { db };
export type DB = typeof db;
