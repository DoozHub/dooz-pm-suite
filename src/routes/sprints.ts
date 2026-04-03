// dooz-pm-suite: Sprint Management Routes
// Manages sprint planning, tracking, and retrospectives

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { sprints, intents, decisions } from '../db/schema';
import { eq, and, gte, lte, desc, count } from 'drizzle-orm';

const app = new Hono();

const sprintSchema = z.object({
  name: z.string().min(1).max(100),
  goal: z.string().min(10).max(500),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  capacity_points: z.number().min(1).max(1000).optional(),
});

/**
 * Create a new sprint
 */
app.post('/api/sprints', zValidator('json', sprintSchema), async (c) => {
  const body = c.req.valid('json');
  const tenantId = c.get('tenantId');

  const [sprint] = await db.insert(sprints).values({
    tenant_id: tenantId,
    name: body.name,
    goal: body.goal,
    start_date: new Date(body.start_date),
    end_date: new Date(body.end_date),
    capacity_points: body.capacity_points,
    status: 'planned',
    created_at: new Date(),
    updated_at: new Date(),
  }).returning();

  return c.json({ success: true, sprint }, 201);
});

/**
 * Get all sprints
 */
app.get('/api/sprints', async (c) => {
  const tenantId = c.get('tenantId');
  const status = c.req.query('status');

  const allSprints = await db.query.sprints.findMany({
    where: status
      ? and(eq(sprints.tenant_id, tenantId), eq(sprints.status, status))
      : eq(sprints.tenant_id, tenantId),
    orderBy: [desc(sprints.start_date)],
  });

  return c.json({ success: true, sprints: allSprints });
});

/**
 * Get sprint details with intents
 */
app.get('/api/sprints/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const tenantId = c.get('tenantId');

  const sprint = await db.query.sprints.findFirst({
    where: and(eq(sprints.id, id), eq(sprints.tenant_id, tenantId)),
  });

  if (!sprint) {
    return c.json({ error: 'Sprint not found' }, 404);
  }

  // Get intents in this sprint
  const sprintIntents = await db.query.intents.findMany({
    where: and(eq(intents.sprint_id, id), eq(intents.tenant_id, tenantId)),
    with: {
      decisions: true,
    },
  });

  // Calculate velocity
  const completedPoints = sprintIntents
    .filter(i => i.state === 'completed')
    .reduce((sum, i) => sum + (i.story_points || 0), 0);

  return c.json({
    success: true,
    sprint,
    intents: sprintIntents,
    stats: {
      total_intents: sprintIntents.length,
      completed: sprintIntents.filter(i => i.state === 'completed').length,
      in_progress: sprintIntents.filter(i => i.state === 'active').length,
      blocked: sprintIntents.filter(i => i.state === 'blocked').length,
      completed_points: completedPoints,
      capacity_points: sprint.capacity_points,
      burn_down_rate: sprint.capacity_points
        ? ((completedPoints / sprint.capacity_points) * 100).toFixed(2)
        : 0,
    },
  });
});

/**
 * Update sprint status
 */
app.patch('/api/sprints/:id/status', zValidator('json', z.object({
  status: z.enum(['planned', 'active', 'completed', 'cancelled']),
})), async (c) => {
  const id = parseInt(c.req.param('id'));
  const tenantId = c.get('tenantId');
  const body = c.req.valid('json');

  await db.update(sprints)
    .set({ status: body.status, updated_at: new Date() })
    .where(and(eq(sprints.id, id), eq(sprints.tenant_id, tenantId)));

  return c.json({ success: true });
});

/**
 * Get sprint velocity trend
 */
app.get('/api/sprints/velocity', async (c) => {
  const tenantId = c.get('tenantId');

  const completedSprints = await db.query.sprints.findMany({
    where: and(eq(sprints.tenant_id, tenantId), eq(sprints.status, 'completed')),
    orderBy: [desc(sprints.end_date)],
    limit: 10,
  });

  const velocityData = completedSprints.map(sprint => ({
    sprint_name: sprint.name,
    end_date: sprint.end_date,
    velocity: sprint.velocity_points || 0,
    capacity: sprint.capacity_points || 0,
  }));

  const avgVelocity = velocityData.length > 0
    ? velocityData.reduce((sum, v) => sum + v.velocity, 0) / velocityData.length
    : 0;

  return c.json({
    success: true,
    velocity: velocityData,
    average_velocity: Math.round(avgVelocity),
  });
});

export default app;
