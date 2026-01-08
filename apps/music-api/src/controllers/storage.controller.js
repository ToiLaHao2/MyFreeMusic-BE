// Storage Controller
const storageService = require("../services/storage.service");
const { sendSuccess, sendError } = require("../util/response");

/**
 * Get storage statistics
 */
async function getStorageStats(req, res) {
    try {
        const forceRefresh = req.query.refresh === "true";
        const stats = await storageService.getStorageStats(forceRefresh);
        return sendSuccess(res, "Storage stats fetched successfully", { storage: stats });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

/**
 * Get database statistics
 */
async function getDatabaseStats(req, res) {
    try {
        const stats = await storageService.getDatabaseStats();
        return sendSuccess(res, "Database stats fetched successfully", { database: stats });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

/**
 * Force refresh storage cache
 */
async function refreshStorageCache(req, res) {
    try {
        // Force refresh by calling getStorageStats with true
        const stats = await storageService.getStorageStats(true);
        return sendSuccess(res, "Storage cache refreshed", { storage: stats });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

module.exports = {
    getStorageStats,
    getDatabaseStats,
    refreshStorageCache,
};
