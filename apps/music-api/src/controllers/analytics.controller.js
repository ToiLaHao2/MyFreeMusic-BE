// Analytics Controller
const analyticsService = require("../services/analytics.service");
const { sendSuccess, sendError } = require("../util/response");

/**
 * Get analytics data
 */
async function getAnalytics(req, res) {
    try {
        const analytics = await analyticsService.getAnalytics();
        return sendSuccess(res, "Analytics fetched successfully", { analytics });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

/**
 * Get user activity logs
 */
async function getUserLogs(req, res) {
    try {
        const logs = await analyticsService.getUserLogs(req.params.userId);
        return sendSuccess(res, "User logs fetched successfully", { logs });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

module.exports = {
    getAnalytics,
    getUserLogs,
};
