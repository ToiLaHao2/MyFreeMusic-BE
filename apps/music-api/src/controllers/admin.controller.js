// Admin Controller - Handle admin-related HTTP requests
const adminService = require("../services/admin.service");
const activityService = require("../services/activity.service");
const { sendSuccess, sendError } = require("../util/response");

/**
 * Create new user
 */
async function createUser(req, res) {
    try {
        const { user_email, user_password, user_full_name, role } = req.body;

        if (!user_email || !user_password || !user_full_name) {
            return sendError(res, 400, "Missing required fields");
        }

        const user = await adminService.createUser(req.body);

        // Log Activity (req.user_id comes from authMiddleware - Admin ID)
        activityService.logActivity(req.user_id, "USER_CREATE", user.id, { created_email: user.user_email }, req);

        return sendSuccess(res, "User created successfully", { user });
    } catch (error) {
        // Check for specific error messages (e.g. Email already registered)
        if (error.message.includes("already registered")) {
            return sendError(res, 409, error.message);
        }
        return sendError(res, 500, error.message);
    }
}

/**
 * Get all users
 */
async function getAllUsers(req, res) {
    try {
        const users = await adminService.getAllUsers();
        return sendSuccess(res, "Users fetched successfully", { users });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

/**
 * Get user by ID
 */
async function getUserById(req, res) {
    try {
        const user = await adminService.getUserById(req.params.id);
        if (!user) {
            return sendError(res, 404, "User not found");
        }
        return sendSuccess(res, "User fetched successfully", { user });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

/**
 * Update user status
 */
async function updateUserStatus(req, res) {
    try {
        const { isActive } = req.body;
        await adminService.updateUserStatus(req.params.id, isActive);

        activityService.logActivity(req.user_id, "USER_UPDATE_STATUS", req.params.id, { isActive }, req);

        return sendSuccess(res, "User status updated", {});
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

/**
 * Update user role
 */
async function updateUserRole(req, res) {
    try {
        const { role } = req.body;
        await adminService.updateUserRole(req.params.id, role);

        activityService.logActivity(req.user_id, "USER_UPDATE_ROLE", req.params.id, { role }, req);

        return sendSuccess(res, "User role updated", {});
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

/**
 * Delete user
 */
async function deleteUser(req, res) {
    try {
        await adminService.deleteUser(req.params.id);

        activityService.logActivity(req.user_id, "USER_DELETE", req.params.id, null, req);

        return sendSuccess(res, "User deleted successfully", {});
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

/**
 * Get dashboard stats
 */
async function getDashboardStats(req, res) {
    try {
        const stats = await adminService.getDashboardStats();
        return sendSuccess(res, "Stats fetched successfully", { stats });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

/**
 * Get activity logs
 */
async function getActivityLogs(req, res) {
    try {
        const { page, limit, action } = req.query;
        const result = await require("../services/activity.service").getLogs(
            parseInt(page) || 1,
            parseInt(limit) || 20,
            action
        );
        return sendSuccess(res, "Logs fetched successfully", result);
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

/**
 * Clear old logs
 */
async function clearActivityLogs(req, res) {
    try {
        const { days } = req.query;
        const deletedCount = await require("../services/activity.service").clearOldLogs(
            parseInt(days) || 30
        );
        return sendSuccess(res, `Cleared ${deletedCount} old logs`, { deletedCount });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

module.exports = {
    createUser,
    getAllUsers,
    getUserById,
    updateUserStatus,
    updateUserRole,
    deleteUser,
    getDashboardStats,
    getActivityLogs,
    clearActivityLogs
};
