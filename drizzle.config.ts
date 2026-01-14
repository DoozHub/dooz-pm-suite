import type { Config } from 'drizzle-kit';

const isProd = process.env.NODE_ENV === 'production';

export default {
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    dialect: isProd ? 'postgresql' : 'sqlite',
    dbCredentials: isProd
        ? { url: process.env.DATABASE_URL! }
        : { url: './data/pm-suite.db' },
} satisfies Config;
