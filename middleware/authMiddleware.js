/**
 * Authentication & Authorization Middleware (Custom Middleware)
 *
 * These are CUSTOM MIDDLEWARE functions that handle:
 * - User authentication verification
 * - Role-based access control (RBAC)
 *
 * Type: Custom Middleware
 */

/**
 * Helper function to detect if request expects JSON response
 * @param {Request} req - Express request object
 * @returns {boolean}
 */
function wantsJSON(req) {
  return (
    (req.headers.accept && req.headers.accept.includes("application/json")) ||
    req.xhr ||
    (req.path && req.path.startsWith("/api/")) ||
    (req.originalUrl && req.originalUrl.includes("/api/"))
  );
}

/**
 * Authentication Middleware
 * Verifies that a user session exists
 * Responds with JSON or redirect based on request type
 */
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }

  if (wantsJSON(req)) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated. Please log in.",
    });
  }
  return res.redirect("/login");
};

/**
 * Role-based Authorization Middleware Factory
 * Creates middleware that checks if user has the required role
 * @param {string} role - Required role
 * @param {string} roleName - Human-readable role name for error messages
 * @returns {Function} Express middleware
 */
function requireRole(role, roleName) {
  return (req, res, next) => {
    if (req.session.user?.role === role) {
      return next();
    }

    if (wantsJSON(req)) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: ${roleName} Only`,
      });
    }
    return res.status(403).send(`Access Denied: ${roleName} Only`);
  };
}

// Pre-built role middleware
const isManager = requireRole("manager", "Managers");
const isSeller = requireRole("seller", "Sellers");
const isCustomer = requireRole("customer", "Customers");
const isServiceProvider = requireRole("service-provider", "Service Providers");

// Combined middleware arrays for convenience
const managerOnly = [isAuthenticated, isManager];
const sellerOnly = [isAuthenticated, isSeller];
const customerOnly = [isAuthenticated, isCustomer];
const serviceOnly = [isAuthenticated, isServiceProvider];

module.exports = {
  wantsJSON,
  isAuthenticated,
  requireRole,
  isManager,
  isSeller,
  isCustomer,
  isServiceProvider,
  managerOnly,
  sellerOnly,
  customerOnly,
  serviceOnly,
};
