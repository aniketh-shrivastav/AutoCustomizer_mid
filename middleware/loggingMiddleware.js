/**
 * Logging Middleware (Custom Middleware)
 *
 * These are CUSTOM MIDDLEWARE functions that handle:
 * - Request logging
 * - Response time tracking
 * - Debug information
 *
 * Type: Custom Middleware (Application-level when used with app.use())
 */

const path = require("path");
const fs = require("fs");

// Log file configuration
const LOG_DIR = path.join(__dirname, "..", "logs");
const ACCESS_LOG = path.join(LOG_DIR, "access.log");
const PERF_LOG = path.join(LOG_DIR, "performance.log");
const DEBUG_LOG = path.join(LOG_DIR, "debug.log");
const ERROR_LOG = path.join(LOG_DIR, "error.log");

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Helper function to append log to file
 * @param {string} filePath - Path to log file
 * @param {string} message - Log message
 */
const appendLog = (filePath, message) => {
  fs.appendFile(filePath, message + "\n", (err) => {
    if (err) console.error("Failed to write log:", err);
  });
};

/**
 * Request Logger Middleware
 * Logs incoming requests with method, URL, and timestamp to access.log
 */
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.connection?.remoteAddress || "unknown";

  const logMessage = `[${timestamp}] ${method} ${url} - IP: ${ip}`;
  appendLog(ACCESS_LOG, logMessage);
  next();
};

/**
 * Response Time Middleware
 * Tracks and logs response time to performance.log
 */
const responseTime = (req, res, next) => {
  const startTime = Date.now();

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - startTime;
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${req.method} ${req.originalUrl || req.url} - ${duration}ms`;
    appendLog(PERF_LOG, logMessage);
    originalEnd.apply(res, args);
  };

  next();
};

/**
 * Debug Middleware (use only in development)
 * Logs detailed request information to debug.log
 */
const debugLogger = (req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    const timestamp = new Date().toISOString();
    const debugInfo = [
      `--- DEBUG REQUEST [${timestamp}] ---`,
      `Headers: ${JSON.stringify(req.headers, null, 2)}`,
      `Body: ${JSON.stringify(req.body, null, 2)}`,
      `Query: ${JSON.stringify(req.query, null, 2)}`,
      `Params: ${JSON.stringify(req.params, null, 2)}`,
      `Session User: ${req.session?.user ? JSON.stringify(req.session.user) : "Not logged in"}`,
      "---------------------",
    ].join("\n");
    appendLog(DEBUG_LOG, debugInfo);
  }
  next();
};

/**
 * Error Logger - logs errors to error.log
 * @param {string} message - Error message
 * @param {Error} [error] - Optional error object
 */
const logError = (message, error = null) => {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] ${message}`;
  if (error && error.stack) {
    logMessage += `\n${error.stack}`;
  }
  appendLog(ERROR_LOG, logMessage);
};

/**
 * API Request Counter (for basic analytics)
 */
let requestCounts = {};
const apiAnalytics = (req, res, next) => {
  const route = `${req.method} ${req.route?.path || req.path}`;
  requestCounts[route] = (requestCounts[route] || 0) + 1;
  next();
};

/**
 * Get analytics data
 */
const getAnalytics = () => ({ ...requestCounts });

/**
 * Reset analytics data
 */
const resetAnalytics = () => {
  requestCounts = {};
};

module.exports = {
  LOG_DIR,
  ACCESS_LOG,
  PERF_LOG,
  DEBUG_LOG,
  ERROR_LOG,
  appendLog,
  logError,
  requestLogger,
  responseTime,
  debugLogger,
  apiAnalytics,
  getAnalytics,
  resetAnalytics,
};
