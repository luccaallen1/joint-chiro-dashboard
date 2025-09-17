const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../../logs');
require('fs').mkdirSync(logDir, { recursive: true });

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      msg += ' ' + JSON.stringify(meta, null, 2);
    }

    return msg;
  })
);

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'jointchiro-dashboard' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),

    // Combined logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),

    // Import-specific logs
    new winston.transports.File({
      filename: path.join(logDir, 'import.log'),
      level: 'info',
      maxsize: 50 * 1024 * 1024, // 50MB for import logs
      maxFiles: 10,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format((info) => {
          // Only log import-related messages to this file
          if (info.message && (
            info.message.includes('import') ||
            info.message.includes('Import') ||
            info.message.includes('batch') ||
            info.message.includes('Batch') ||
            info.message.includes('scheduler') ||
            info.message.includes('Scheduler')
          )) {
            return info;
          }
          return false;
        })()
      )
    })
  ],

  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || 'debug'
  }));
}

// Create specialized loggers for different components
const importLogger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.label({ label: 'IMPORT' }),
    winston.format.json()
  ),
  defaultMeta: { component: 'import' },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'import-detailed.log'),
      maxsize: 100 * 1024 * 1024, // 100MB
      maxFiles: 5,
      tailable: true
    })
  ]
});

// Add console for import logger in development
if (process.env.NODE_ENV !== 'production') {
  importLogger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.label({ label: 'IMPORT' }),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, label, message, ...meta }) => {
        let msg = `${timestamp} [${label}] [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
          msg += ' ' + JSON.stringify(meta);
        }
        return msg;
      })
    )
  }));
}

const schedulerLogger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.label({ label: 'SCHEDULER' }),
    winston.format.json()
  ),
  defaultMeta: { component: 'scheduler' },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'scheduler.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    })
  ]
});

// Add console for scheduler logger in development
if (process.env.NODE_ENV !== 'production') {
  schedulerLogger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.label({ label: 'SCHEDULER' }),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, label, message, ...meta }) => {
        let msg = `${timestamp} [${label}] [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
          msg += ' ' + JSON.stringify(meta);
        }
        return msg;
      })
    )
  }));
}

// Helper functions for structured logging
logger.logImport = (level, message, meta = {}) => {
  importLogger.log(level, message, { ...meta, timestamp: new Date().toISOString() });
  logger.log(level, `[IMPORT] ${message}`, meta);
};

logger.logScheduler = (level, message, meta = {}) => {
  schedulerLogger.log(level, message, { ...meta, timestamp: new Date().toISOString() });
  logger.log(level, `[SCHEDULER] ${message}`, meta);
};

// Log startup
logger.info('Logger initialized', {
  logLevel: process.env.LOG_LEVEL || 'info',
  environment: process.env.NODE_ENV || 'development',
  logDirectory: logDir
});

module.exports = logger;