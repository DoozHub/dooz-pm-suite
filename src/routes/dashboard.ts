import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { intents } from '../db/schema';
import { eq, and, desc, isNull, gt, count, sql } from 'drizzle-orm';

const app = new Hono();

/**
 * Dashboard statistics endpoint
 */
app.get('/api/dashboard/stats', async (c) => {
  const tenantId = c.get('tenantId');

  const [
    totalIntents,
    activeIntents,
    completedIntents,
    stuckIntents,
    recentActivity,
    stateDistribution,
  ] = await Promise.all([
    db.select({ count: count() }).from(intents).then(r => r[0]?.count ?? 0),
    db.select({ count: count() }).from(intents).where(eq(intents.state, 'active')).then(r => r[0]?.count ?? 0),
    db.select({ count: count() }).from(intents).where(eq(intents.state, 'completed')).then(r => r[0]?.count ?? 0),
    db.select({ count: count() }).from(intents).where(eq(intents.state, 'blocked')).then(r => r[0]?.count ?? 0),
    db.select().from(intents).orderBy(desc(intents.updated_at)).limit(10),
    db.select({ state: intents.state, count: count() }).from(intents).groupBy(intents.state),
  ]);

  return c.json({
    success: true,
    data: {
      total_intents: totalIntents,
      active_intents: activeIntents,
      completed_intents: completedIntents,
      stuck_intents: stuckIntents,
      recent_activity: recentActivity,
      state_distribution: stateDistribution,
    },
  });
});

/**
 * Intent trends (last 30 days)
 */
app.get('/api/dashboard/trends', async (c) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const trends = await db
    .select({
      date: sql`DATE(created_at)`,
      count: count(),
    })
    .from(intents)
    .where(gt(intents.created_at, thirtyDaysAgo))
    .groupBy(sql`DATE(created_at)`)
    .orderBy(sql`DATE(created_at)`);

  return c.json({ success: true, data: trends });
});

export default app;
