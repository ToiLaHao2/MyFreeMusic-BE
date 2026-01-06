const { sendError } = require("../util/response");

// Middleware to check user role
// Usage: requireRole('ADMIN') or requireRole(['ADMIN', 'MODERATOR'])
const requireRole = (roles) => (req, res, next) => {
    if (!req.user) {
        return sendError(res, 401, "Unauthorized");
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(req.user.role)) {
        return sendError(res, 403, "Access denied. Insufficient permissions.");
    }

    next();
};

module.exports = requireRole;
