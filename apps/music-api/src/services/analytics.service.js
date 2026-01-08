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

        // Mock plays per day (would need a plays/listens table for real tracking)
        const playsPerDay = [
            { day: "Mon", plays: Math.floor(Math.random() * 100) + 50 },
            { day: "Tue", plays: Math.floor(Math.random() * 100) + 50 },
            { day: "Wed", plays: Math.floor(Math.random() * 100) + 50 },
            { day: "Thu", plays: Math.floor(Math.random() * 100) + 50 },
            { day: "Fri", plays: Math.floor(Math.random() * 100) + 50 },
            { day: "Sat", plays: Math.floor(Math.random() * 100) + 50 },
            { day: "Sun", plays: Math.floor(Math.random() * 100) + 50 },
        ];

        return {
            totalPlays: totalSongs * 10, // Mock calculation
            totalUsers,
            activeSessions: activeUsers,
            playsPerDay,
            topSongs: topSongs.map((s) => ({
                title: s.title,
                artist: s.artist?.artist_name || "Unknown",
                plays: s.views || Math.floor(Math.random() * 500) + 100,
            })),
            genreDistribution,
        };
    } catch (error) {
        logger.error("Error in getAnalytics:", error);
        throw error;
    }
}

/**
 * Get user activity logs (mock for now - would need activity_logs table)
 */
async function getUserLogs(userId) {
    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return [];
        }

        // Return mock logs
        return [
            {
                id: "1",
                userId: userId,
                action: "LOGIN",
                details: `Logged in from Chrome/Windows`,
                timestamp: new Date().toISOString(),
            },
            {
                id: "2",
                userId: userId,
                action: "PLAY_SONG",
                details: `Played a song`,
                timestamp: new Date(Date.now() - 3600000).toISOString(),
            },
        ];
    } catch (error) {
        logger.error("Error in getUserLogs:", error);
        return [];
    }
}

module.exports = {
    getAnalytics,
    getUserLogs,
};

