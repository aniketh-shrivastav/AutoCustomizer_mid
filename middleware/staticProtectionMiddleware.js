/**
 * Static File Protection Middleware (Application-level Middleware)
 *
 * These middleware functions protect static HTML files
 * based on user roles. They run at application level before
 * the static file serving middleware.
 *
 * Type: Application-level Middleware
 */

/**
 * Factory function to create role-based static file protection
 * @param {string} requiredRole - Required user role
 * @param {string} roleName - Human-readable role name
 * @returns {Function} Express middleware
 */
const protectStaticFiles = (requiredRole, roleName) => {
  return (req, res, next) => {
    // Only protect .html files
    if (!req.path.endsWith(".html")) {
      return next();
    }

    // Check authentication
    if (!req.session.user) {
      return res.redirect("/login");
    }

    // Check role
    if (req.session.user.role !== requiredRole) {
      return res.status(403).send(`Access Denied: ${roleName} Only`);
    }

    next();
  };
};

// Pre-built protection middleware for each role
const protectManagerFiles = protectStaticFiles("manager", "Managers");
const protectCustomerFiles = protectStaticFiles("customer", "Customers");
const protectServiceFiles = protectStaticFiles(
  "service-provider",
  "Service Providers",
);
const protectSellerFiles = protectStaticFiles("seller", "Sellers");

module.exports = {
  protectStaticFiles,
  protectManagerFiles,
  protectCustomerFiles,
  protectServiceFiles,
  protectSellerFiles,
};
