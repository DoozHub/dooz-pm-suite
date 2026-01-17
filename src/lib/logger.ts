/**
 * Dooz Ecosystem - Structured Logger
 * 
 * Production-grade JSON logging with correlation IDs.
 * Shared across dooz-bridge, dooz-pm-suite, and other TypeScript services.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    service: string;
    message: string;
    correlationId?: string;
    data?: Record<string, unknown>;
    error?: {
        message: string;
        stack?: string;
    };
}

class Logger {
    private service: string;
    private minLevel: LogLevel;
    private correlationId?: string;

    private static levelPriority: Record<LogLevel, number> = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3,
    };

    constructor(service: string, minLevel: LogLevel = 'info') {
        this.service = service;
        this.minLevel = minLevel;
    }

    withCorrelationId(id: string): Logger {
        const child = new Logger(this.service, this.minLevel);
        child.correlationId = id;
        return child;
    }

    private shouldLog(level: LogLevel): boolean {
        return Logger.levelPriority[level] >= Logger.levelPriority[this.minLevel];
    }

    private format(level: LogLevel, message: string, data?: Record<string, unknown>, error?: Error): LogEntry {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            service: this.service,
            message,
        };

        if (this.correlationId) {
            entry.correlationId = this.correlationId;
        }

        if (data) {
            entry.data = data;
        }

        if (error) {
            entry.error = {
                message: error.message,
                stack: error.stack,
            };
        }

        return entry;
    }

    private output(entry: LogEntry): void {
        const isProd = process.env.NODE_ENV === 'production';

        if (isProd) {
            // JSON for production (structured logging for log aggregators)
            console.log(JSON.stringify(entry));
        } else {
            // Human-readable for development
            const color = {
                debug: '\x1b[90m',
                info: '\x1b[36m',
                warn: '\x1b[33m',
                error: '\x1b[31m',
            }[entry.level];
            const reset = '\x1b[0m';

            const parts = [
                `${color}[${entry.level.toUpperCase()}]${reset}`,
                `[${entry.service}]`,
                entry.message,
            ];

            if (entry.correlationId) {
                parts.push(`(${entry.correlationId})`);
            }

            console.log(parts.join(' '));

            if (entry.data) {
                console.log('  →', entry.data);
            }

            if (entry.error?.stack) {
                console.log('  ⚠', entry.error.stack);
            }
        }
    }

    debug(message: string, data?: Record<string, unknown>): void {
        if (this.shouldLog('debug')) {
            this.output(this.format('debug', message, data));
        }
    }

    info(message: string, data?: Record<string, unknown>): void {
        if (this.shouldLog('info')) {
            this.output(this.format('info', message, data));
        }
    }

    warn(message: string, data?: Record<string, unknown>): void {
        if (this.shouldLog('warn')) {
            this.output(this.format('warn', message, data));
        }
    }

    error(message: string, error?: Error, data?: Record<string, unknown>): void {
        if (this.shouldLog('error')) {
            this.output(this.format('error', message, data, error));
        }
    }
}

// Factory function
export function createLogger(service: string, minLevel?: LogLevel): Logger {
    const level = (process.env.LOG_LEVEL as LogLevel) || minLevel || 'info';
    return new Logger(service, level);
}

// Pre-configured loggers
export const bridgeLogger = createLogger('dooz-bridge');
export const pmSuiteLogger = createLogger('dooz-pm-suite');
