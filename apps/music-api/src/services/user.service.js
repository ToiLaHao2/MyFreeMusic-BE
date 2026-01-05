// User Service - Business Logic Layer
const userRepository = require("../repositories/user.repository");

/**
 * Lấy thông tin người dùng theo ID
 */
async function getUserById(userId) {
    return await userRepository.findById(userId);
}

/**
 * Cập nhật thông tin người dùng
 */
async function updateUser(userId, userData) {
    return await userRepository.update(userId, userData);
}

/**
 * Cập nhật avatar người dùng
 */
async function updateAvatar(userId, avatarUrl) {
    return await userRepository.updateAvatar(userId, avatarUrl);
}

module.exports = {
    getUserById,
    updateUser,
    updateAvatar,
};
