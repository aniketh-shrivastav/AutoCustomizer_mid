/**
 * Middleware Index
 *
 * Central export file for all middleware modules.
 * This file demonstrates the 6 types of Express middleware:
 *
 * 1. APPLICATION-LEVEL MIDDLEWARE
 *    - Bound to app using app.use() or app.METHOD()
 *    - Examples: requestLogger, securityHeaders, staticProtection
 *
 * 2. ROUTER-LEVEL MIDDLEWARE
 *    - Bound to router using router.use() or router.METHOD()
 *    - Examples: isAuthenticated, isSeller (when used with router)
 *
 * 3. BUILT-IN MIDDLEWARE
 *    - express.json(), express.urlencoded(), express.static()
 *    - These are imported directly from express in server.js
 *
 * 4. THIRD-PARTY MIDDLEWARE
 *    - cors, express-session, multer
 *    - Examples: uploadMiddleware (wraps multer)
 *
 * 5. ERROR-HANDLING MIDDLEWARE
 *    - Has signature (err, req, res, next)
 *    - Examples: errorHandler, handleUploadError
 *
 * 6. CUSTOM MIDDLEWARE
 *    - User-defined middleware for specific functionality
 *    - Examples: auth, validation, security, logging
 */

// Authentication & Authorization (Custom Middleware)
const authMiddleware = require("./authMiddleware");

// Validation (Custom Middleware)
const validationMiddleware = require("./validationMiddleware");

// Logging (Custom Middleware)
const loggingMiddleware = require("./loggingMiddleware");

// Security (Custom Middleware)
const securityMiddleware = require("./securityMiddleware");

// File Upload (Third-Party Middleware - multer wrapper)
const uploadMiddleware = require("./uploadMiddleware");

// Static File Protection (Application-level Middleware)
const staticProtectionMiddleware = require("./staticProtectionMiddleware");

// Error Handling (Error-handling Middleware)
const errorMiddleware = require("./errorMiddleware");

module.exports = {
  // Auth exports
  ...authMiddleware,

  // Validation exports
  ...validationMiddleware,

  // Logging exports
  ...loggingMiddleware,

  // Security exports
  ...securityMiddleware,

  // Upload exports
  ...uploadMiddleware,

  // Static protection exports
  ...staticProtectionMiddleware,

  // Error handling exports
  ...errorMiddleware,

  // Named module exports for selective imports
  auth: authMiddleware,
  validation: validationMiddleware,
  logging: loggingMiddleware,
  security: securityMiddleware,
  upload: uploadMiddleware,
  staticProtection: staticProtectionMiddleware,
  error: errorMiddleware,
};
