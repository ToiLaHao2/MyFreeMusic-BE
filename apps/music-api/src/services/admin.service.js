const { User } = require("../models/user.model");
const { Song } = require("../models/song.model");
const { Playlist } = require("../models/playlist.model");
const { Op } = require("sequelize");
const { HashPassword } = require("../util/authHelpers");

/**
 * Create new user (admin only)
 */
async function createUser(userData) {
    const { user_email, user_password, user_full_name, role } = userData;

    // Check if email exists
    const existingUser = await User.findOne({ where: { user_email } });
    if (existingUser) {
        throw new Error("Email already registered");
    }

    // Hash password
    const hashedPassword = await HashPassword(user_password);

    // Create user
    const newUser = await User.create({
        user_email,
        user_password: user_password, // This might be unused if we only store hash, but model expects proper mapping
        user_hash_password: hashedPassword,
        user_full_name,
        role: role || 'USER',
        user_is_active: true
    });

    // Remove sensitive data
    const user = newUser.toJSON();
    delete user.user_hash_password;
    delete user.user_refresh_token;

    return user;
}

/**
 * Get all users (for admin)
 */
async function getAllUsers() {
    return await User.findAll({
        attributes: { exclude: ["user_hash_password", "user_refresh_token"] },
        order: [["created_at", "DESC"]],
    });
}

/**
 * Get user by ID (for admin)
 */
async function getUserById(userId) {
    return await User.findOne({
        where: { id: userId },
        attributes: { exclude: ["user_hash_password", "user_refresh_token"] },
    });
}

/**
 * Update user status (active/inactive)
 */
async function updateUserStatus(userId, isActive) {
    return await User.update(
        { user_is_active: isActive },
        { where: { id: userId } }
    );
}

/**
 * Update user role
 */
async function updateUserRole(userId, role) {
    if (!["ADMIN", "USER"].includes(role)) {
        throw new Error("Invalid role. Must be 'ADMIN' or 'USER'");
    }
    return await User.update(
        { role: role },
        { where: { id: userId } }
    );
}

/**
 * Delete user (soft or hard)
 */
async function deleteUser(userId) {
    // Don't allow deleting the master admin
    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error("User not found");
    }
    if (user.user_email === "master_admin") {
        throw new Error("Cannot delete master admin");
    }
    return await User.destroy({ where: { id: userId } });
}

/**
 * Get dashboard stats
 */
async function getDashboardStats() {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { user_is_active: true } });
    const totalSongs = await Song.count();
    const totalPlaylists = await Playlist.count();

    return {
        totalUsers,
        activeUsers,
        totalSongs,
        totalPlaylists,
    };
}

module.exports = {
    createUser,
    getAllUsers,
    getUserById,
    updateUserStatus,
    updateUserRole,
    deleteUser,
    getDashboardStats,
};
