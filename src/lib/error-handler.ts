/**
 * Dooz PM Suite - Error Handling Middleware
 * 
 * Provides graceful error handling with:
 * - Structured error responses
 * - Error logging with correlation IDs
 * - Non-sensitive error messages for production
 */

import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createLogger } from './logger';

const logger = createLogger('dooz-pm-suite');

export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
    correlationId?: string;
}

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public code: string,
        message: string,
        public details?: unknown
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export function errorHandler() {
    return async (c: Context, next: Next) => {
        const correlationId = c.req.header('X-Correlation-Id') || crypto.randomUUID().slice(0, 8);
        const childLogger = logger.withCorrelationId(correlationId);

        try {
            // Add correlation ID to context
            c.set('correlationId', correlationId);
            c.set('logger', childLogger);

            await next();
        } catch (error) {
            const isProd = process.env.NODE_ENV === 'production';

            if (error instanceof AppError) {
                childLogger.warn(`AppError: ${error.message}`, {
                    code: error.code,
                    statusCode: error.statusCode,
                });

                const response: ErrorResponse = {
                    success: false,
                    error: {
                        code: error.code,
                        message: error.message,
                        details: isProd ? undefined : error.details,
                    },
                    correlationId,
                };

                return c.json(response, error.statusCode as any);
            }

            if (error instanceof HTTPException) {
                childLogger.warn(`HTTPException: ${error.message}`, {
                    status: error.status,
                });

                return c.json({
                    success: false,
                    error: {
                        code: 'HTTP_ERROR',
                        message: error.message,
                    },
                    correlationId,
                }, error.status);
            }

            // Unexpected error
            const err = error as Error;
            childLogger.error('Unhandled error', err, {
                path: c.req.path,
                method: c.req.method,
            });

            return c.json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: isProd ? 'An unexpected error occurred' : err.message,
                },
                correlationId,
            }, 500);
        }
    };
}

// Typed app context extension
declare module 'hono' {
    interface ContextVariableMap {
        correlationId: string;
        logger: ReturnType<typeof logger.withCorrelationId>;
    }
}
