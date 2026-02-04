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

/**
 * Request Logger Middleware
 * Logs incoming requests with method, URL, and timestamp
 */
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.connection?.remoteAddress || "unknown";

  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
  next();
};

/**
 * Response Time Middleware
 * Tracks and logs response time for performance monitoring
 */
const responseTime = (req, res, next) => {
  const startTime = Date.now();

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - startTime;
    console.log(
      `[PERF] ${req.method} ${req.originalUrl || req.url} - ${duration}ms`,
    );
    originalEnd.apply(res, args);
  };

  next();
};

/**
 * Debug Middleware (use only in development)
 * Logs detailed request information
 */
const debugLogger = (req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    console.log("--- DEBUG REQUEST ---");
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Body:", JSON.stringify(req.body, null, 2));
    console.log("Query:", JSON.stringify(req.query, null, 2));
    console.log("Params:", JSON.stringify(req.params, null, 2));
    console.log("Session User:", req.session?.user || "Not logged in");
    console.log("---------------------");
  }
  next();
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
  requestLogger,
  responseTime,
  debugLogger,
  apiAnalytics,
  getAnalytics,
  resetAnalytics,
};
