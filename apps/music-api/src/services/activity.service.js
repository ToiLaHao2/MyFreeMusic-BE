const { ActivityLog, User } = require("../models");
const { Op } = require("sequelize");

/**
 * Record an activity
 * @param {string} userId - ID of the user performing the action
 * @param {string} action - Action code (e.g., USER_LOGIN)
 * @param {string|null} entityId - Target entity ID
 * @param {object|null} details - Additional details
 * @param {object} req - Express request object (to extract IP/Agent)
 */
async function logActivity(userId, action, entityId = null, details = null, req = null) {
    try {
        let ip_address = null;
        let user_agent = null;

        if (req) {
            ip_address = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            user_agent = req.headers['user-agent'];
        }

        await ActivityLog.create({
            user_id: userId,
            action,
            entity_id: entityId,
            details,
            ip_address,
            user_agent
        });
    } catch (error) {
        // Logging should not break the application flow, just error to console
        console.error("Failed to log activity:", error);
    }
}

/**
 * Get paginated logs for admin
 */
async function getLogs(page = 1, limit = 50, action = null) {
    const offset = (page - 1) * limit;
    const where = {};

    if (action) {
        where.action = action;
    }

    const { count, rows } = await ActivityLog.findAndCountAll({
        where,
        include: [
            {
                model: User,
                attributes: ['id', 'user_full_name', 'user_email']
            }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
    });

    return {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        logs: rows
    };
}

/**
 * Delete logs older than X days
 */
async function clearOldLogs(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const deletedCount = await ActivityLog.destroy({
        where: {
            createdAt: {
                [Op.lt]: cutoffDate
            }
        }
    });

    return deletedCount;
}

module.exports = {
    logActivity,
    getLogs,
    clearOldLogs
};
