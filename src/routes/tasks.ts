/**
 * Tasks Routes
 * 
 * REST API for task management.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { TaskService } from '../services/task.service';

type Env = {
    Variables: {
        tenantId: string;
        userId: string;
    };
};

export const tasksRoutes = new Hono<Env>();

const CreateTaskSchema = z.object({
    intentId: z.string(),
    decisionId: z.string().optional(),
    title: z.string().min(1),
    description: z.string().optional(),
    owner: z.string().optional(),
    sla: z.string().optional(),
    externalSystemRef: z.string().optional(),
});

const UpdateTaskSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    owner: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'blocked', 'cancelled']).optional(),
    sla: z.string().optional(),
    externalSystemRef: z.string().optional(),
});

// Get tasks for an intent
tasksRoutes.get('/', async (c) => {
    const intentId = c.req.query('intentId');
    const decisionId = c.req.query('decisionId');

    if (decisionId) {
        const tasks = await TaskService.listByDecision(decisionId);
        return c.json({ data: tasks, count: tasks.length });
    }

    if (intentId) {
        const tasks = await TaskService.listByIntent(intentId);
        return c.json({ data: tasks, count: tasks.length });
    }

    return c.json({ error: 'intentId or decisionId query parameter required' }, 400);
});

// Get single task
tasksRoutes.get('/:id', async (c) => {
    const task = await TaskService.getById(c.req.param('id'));
    if (!task) {
        return c.json({ error: 'Task not found' }, 404);
    }
    return c.json({ data: task });
});

// Create task
tasksRoutes.post('/', async (c) => {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();
    const parsed = CreateTaskSchema.safeParse(body);

    if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
    }

    const task = await TaskService.create(tenantId, parsed.data);
    return c.json({ data: task }, 201);
});

// Update task
tasksRoutes.patch('/:id', async (c) => {
    const body = await c.req.json();
    const parsed = UpdateTaskSchema.safeParse(body);

    if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
    }

    const task = await TaskService.update(c.req.param('id'), parsed.data);
    if (!task) {
        return c.json({ error: 'Task not found' }, 404);
    }
    return c.json({ data: task });
});

// Transition task status
tasksRoutes.post('/:id/transition', async (c) => {
    const body = await c.req.json();
    const status = body.status;

    if (!['pending', 'in_progress', 'completed', 'blocked', 'cancelled'].includes(status)) {
        return c.json({ error: 'Invalid status' }, 400);
    }

    const task = await TaskService.transition(c.req.param('id'), status);
    if (!task) {
        return c.json({ error: 'Task not found' }, 404);
    }
    return c.json({ data: task, message: `Task transitioned to ${status}` });
});

// Delete task
tasksRoutes.delete('/:id', async (c) => {
    await TaskService.delete(c.req.param('id'));
    return c.json({ message: 'Deleted' });
});
