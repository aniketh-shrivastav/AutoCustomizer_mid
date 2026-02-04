/**
 * Validation Middleware (Custom Middleware)
 *
 * These are CUSTOM MIDDLEWARE functions that handle:
 * - Input validation
 * - Request sanitization
 * - Data normalization
 *
 * Type: Custom Middleware
 */

/**
 * Validate MongoDB ObjectId format
 * Responds with 400 if invalid
 */
const validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    const mongoose = require("mongoose");
    const id = req.params[paramName];

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`,
      });
    }
    next();
  };
};

/**
 * Validate required fields in request body
 * @param {string[]} fields - Array of required field names
 */
const validateRequiredFields = (fields) => {
  return (req, res, next) => {
    const missing = fields.filter(
      (field) => req.body[field] === undefined || req.body[field] === "",
    );

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }
    next();
  };
};

/**
 * Sanitize string fields - trim whitespace
 * @param {string[]} fields - Array of field names to sanitize
 */
const sanitizeFields = (fields) => {
  return (req, res, next) => {
    fields.forEach((field) => {
      if (typeof req.body[field] === "string") {
        req.body[field] = req.body[field].trim();
      }
    });
    next();
  };
};

/**
 * Validate email format
 */
const validateEmail = (fieldName = "email") => {
  return (req, res, next) => {
    const email = req.body[fieldName];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email && !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }
    next();
  };
};

/**
 * Validate numeric range
 * @param {string} fieldName - Field to validate
 * @param {object} options - { min, max }
 */
const validateNumericRange = (fieldName, options = {}) => {
  return (req, res, next) => {
    const value = Number(req.body[fieldName]);

    if (isNaN(value)) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be a number`,
      });
    }

    if (options.min !== undefined && value < options.min) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be at least ${options.min}`,
      });
    }

    if (options.max !== undefined && value > options.max) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be at most ${options.max}`,
      });
    }

    next();
  };
};

module.exports = {
  validateObjectId,
  validateRequiredFields,
  sanitizeFields,
  validateEmail,
  validateNumericRange,
};
