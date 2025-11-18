/**
 * Structured Logger
 *
 * Provides contextual logging with levels and structured data
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: Date;
  error?: Error;
}

export class Logger {
  constructor(
    private context: string,
    private minLevel: LogLevel = LogLevel.INFO,
  ) {}

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (level < this.minLevel) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      context: { ...context, logger: this.context },
      timestamp: new Date(),
      error,
    };

    this.write(entry);
  }

  private write(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const timestamp = entry.timestamp.toISOString();

    const contextStr = entry.context
      ? ` ${JSON.stringify(entry.context)}`
      : '';

    const errorStr = entry.error
      ? `\n  ${entry.error.stack || entry.error.message}`
      : '';

    const color = {
      [LogLevel.DEBUG]: '\x1b[36m',  // Cyan
      [LogLevel.INFO]: '\x1b[32m',   // Green
      [LogLevel.WARN]: '\x1b[33m',   // Yellow
      [LogLevel.ERROR]: '\x1b[31m',  // Red
    }[entry.level];
    const reset = '\x1b[0m';

    console.log(
      `${color}[${timestamp}] ${levelName}${reset} [${this.context}] ${entry.message}${contextStr}${errorStr}`,
    );
  }

  /**
   * Create a child logger with additional context
   */
  child(childContext: string): Logger {
    return new Logger(`${this.context}:${childContext}`, this.minLevel);
  }

  /**
   * Set minimum log level
   */
  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}

/**
 * Create a logger instance
 */
export function createLogger(context: string, level?: LogLevel): Logger {
  return new Logger(context, level);
}

/**
 * Default logger instance
 */
export const logger = createLogger('App', LogLevel.INFO);
