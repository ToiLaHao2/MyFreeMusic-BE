// Analytics Service - Aggregate data for dashboard
const { User } = require("../models/user.model");
const { Song } = require("../models/song.model");
const { Playlist } = require("../models/playlist.model");
const { Genre } = require("../models/genre.model");
const { Artist } = require("../models/artist.model");
const { sequelize } = require("../models");
const logger = require("../util/logger");

/**
 * Get overall analytics data
 */
async function getAnalytics() {
    try {
        // Get basic counts
        const totalUsers = await User.count();
        const activeUsers = await User.count({ where: { user_is_active: true } });
        const totalSongs = await Song.count();
        const totalPlaylists = await Playlist.count();

        // Get top songs with artist info via includes
        const topSongs = await Song.findAll({
            limit: 5,
            order: [["views", "DESC"]],
            attributes: ["id", "title", "views"],
            include: [
                { model: Artist, as: "artist", attributes: ["name"] },
                { model: Genre, as: "genre", attributes: ["name"] }
            ]
        });

        // Get genre distribution - count songs by genre_id
        const genreStats = await Song.findAll({
            attributes: [
                "genre_id",
                [sequelize.fn("COUNT", sequelize.col("Song.id")), "count"],
            ],
            include: [
                { model: Genre, as: "genre", attributes: ["name"] }
            ],
            group: ["genre_id", "genre.id", "genre.name"],
            raw: true,
            nest: true
        });

        const genreDistribution = genreStats.map((g) => ({
            genre: g.genre?.name || "Unknown",
            percentage: totalSongs > 0
                ? Math.round((parseInt(g.count) / totalSongs) * 100)
                : 0,
        }));

        // Get plays per day from ActivityLog (last 7 days)
        const { ActivityLog } = require("../models");
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const playsPerDayRaw = await ActivityLog.findAll({
            where: {
                action: "PLAY_SONG",
                createdAt: {
                    [require("sequelize").Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            },
            attributes: [
                [sequelize.fn("DAYOFWEEK", sequelize.col("createdAt")), "dayOfWeek"],
                [sequelize.fn("COUNT", sequelize.col("id")), "count"]
            ],
            group: [sequelize.fn("DAYOFWEEK", sequelize.col("createdAt"))],
            raw: true
        });

        // Build plays per day array (Mon-Sun)
        const playsMap = {};
        playsPerDayRaw.forEach(row => {
            const dayIndex = (parseInt(row.dayOfWeek) + 5) % 7; // Convert MySQL DAYOFWEEK to Mon=0
            playsMap[dayIndex] = parseInt(row.count);
        });
        const playsPerDay = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => ({
            day,
            plays: playsMap[i] || 0
        }));

        // Calculate totalPlays from sum of all song views
        const totalPlaysResult = await Song.sum("views") || 0;

        return {
            totalPlays: totalPlaysResult,
            totalUsers,
            activeSessions: activeUsers,
            playsPerDay,
            topSongs: topSongs.map((s) => ({
                title: s.title,
                artist: s.artist?.name || "Unknown",
                plays: s.views || 0,
            })),
            genreDistribution,
        };
    } catch (error) {
        logger.error("Error in getAnalytics:", error);
        throw error;
    }
}

/**
 * Get user activity logs (from ActivityLog table)
 */
async function getUserLogs(userId) {
    try {
        const { ActivityLog } = require("../models");

        const logs = await ActivityLog.findAll({
            where: { user_id: userId },
            order: [['createdAt', 'DESC']],
            limit: 50,
        });

        return logs.map(log => ({
            id: log.id,
            userId: log.user_id,
            action: log.action,
            details: typeof log.details === 'object'
                ? JSON.stringify(log.details)
                : (log.details || `Action: ${log.action}`),
            timestamp: log.createdAt,
            ipAddress: log.ip_address,
            userAgent: log.user_agent,
        }));
    } catch (error) {
        logger.error("Error in getUserLogs:", error);
        return [];
    }
}

module.exports = {
    getAnalytics,
    getUserLogs,
};

