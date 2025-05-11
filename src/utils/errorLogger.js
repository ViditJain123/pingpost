/**
 * Error Logger Utility
 * 
 * Provides consistent error logging and reporting throughout the application.
 * In production, this can be connected to monitoring services like Sentry.
 */

// Severity levels for errors
const ERROR_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Log an error with context information
 * 
 * @param {Error|string} error - The error object or message
 * @param {Object} options - Additional options
 * @param {string} options.level - Error severity level
 * @param {string} options.context - Context where the error occurred
 * @param {Object} options.metadata - Additional metadata about the error
 * @param {boolean} options.report - Whether to report to error monitoring service
 */
function logError(error, options = {}) {
  const {
    level = ERROR_LEVELS.ERROR,
    context = '',
    metadata = {},
    report = process.env.NODE_ENV === 'production'
  } = options;
  
  // Format the error message
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : new Error().stack;
  
  // Create the log entry
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message: errorMessage,
    context,
    ...metadata,
    stack: process.env.NODE_ENV !== 'production' ? errorStack : undefined
  };
  
  // Console logging with appropriate formatting
  switch (level) {
    case ERROR_LEVELS.DEBUG:
      console.debug(`[DEBUG] ${context}:`, errorMessage, metadata);
      break;
    case ERROR_LEVELS.INFO:
      console.info(`[INFO] ${context}:`, errorMessage, metadata);
      break;
    case ERROR_LEVELS.WARNING:
      console.warn(`[WARNING] ${context}:`, errorMessage, metadata);
      break;
    case ERROR_LEVELS.ERROR:
      console.error(`[ERROR] ${context}:`, errorMessage, metadata);
      break;
    case ERROR_LEVELS.CRITICAL:
      console.error(`[CRITICAL] ${context}:`, errorMessage, metadata);
      break;
    default:
      console.log(`[${level}] ${context}:`, errorMessage, metadata);
  }
  
  // In production, send to error monitoring service
  if (report && process.env.NODE_ENV === 'production') {
    // Example: Send to error monitoring service
    // This would be replaced with your actual error reporting service
    reportToMonitoringService(logEntry);
  }
  
  return logEntry;
}

/**
 * Report error to an external monitoring service (placeholder)
 * 
 * @param {Object} logEntry - The error log entry
 */
function reportToMonitoringService(logEntry) {
  // TODO: Implement connection to your error monitoring service
  // Example with Sentry:
  // Sentry.captureException(new Error(logEntry.message), {
  //   level: logEntry.level,
  //   tags: { context: logEntry.context },
  //   extra: logEntry
  // });
  
  // This is just a placeholder for now
  if (process.env.NODE_ENV === 'production') {
    console.log('[MONITORING] Would send to monitoring service:', logEntry);
  }
}

/**
 * Creates a context-specific error logger
 * 
 * @param {string} context - The context for the logger (e.g., component name)
 * @returns {Object} Context-specific logging methods
 */
function createContextLogger(context) {
  return {
    debug: (message, metadata = {}) => 
      logError(message, { level: ERROR_LEVELS.DEBUG, context, metadata, report: false }),
    info: (message, metadata = {}) => 
      logError(message, { level: ERROR_LEVELS.INFO, context, metadata, report: false }),
    warn: (message, metadata = {}) => 
      logError(message, { level: ERROR_LEVELS.WARNING, context, metadata }),
    error: (error, metadata = {}) => 
      logError(error, { level: ERROR_LEVELS.ERROR, context, metadata }),
    critical: (error, metadata = {}) => 
      logError(error, { level: ERROR_LEVELS.CRITICAL, context, metadata, report: true })
  };
}

/**
 * API Error Handler for Next.js API routes
 * 
 * @param {Error} error - The error object
 * @param {Object} res - Next.js response object
 * @param {string} context - Context where the error occurred
 */
function handleApiError(error, res, context = 'API') {
  const isOperationalError = error.isOperational === true;
  
  // Log the error
  logError(error, {
    level: isOperationalError ? ERROR_LEVELS.WARNING : ERROR_LEVELS.ERROR,
    context,
    metadata: {
      isOperational: isOperationalError,
      code: error.code || 'UNKNOWN_ERROR'
    }
  });
  
  // Determine status code
  const statusCode = error.statusCode || (isOperationalError ? 400 : 500);
  
  // Return appropriate error response
  return res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An internal server error occurred'
      : error.message || 'Unknown error',
    code: error.code,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
}

export {
  ERROR_LEVELS,
  logError,
  createContextLogger,
  handleApiError
};