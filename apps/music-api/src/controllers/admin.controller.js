// Admin Controller - Handle admin-related HTTP requests
const adminService = require("../services/admin.service");
const { sendSuccess, sendError } = require("../util/response");

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

module.exports = {
    getAllUsers,
    getUserById,
    updateUserStatus,
    updateUserRole,
    deleteUser,
    getDashboardStats,
};
