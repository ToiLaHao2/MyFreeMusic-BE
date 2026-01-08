// User Repository - Data Access Layer
const { User } = require("../models/user.model");

/**
 * Lấy người dùng theo ID (không có password)
 */
async function findById(userId) {
    return await User.findOne({
        where: { id: userId },
        attributes: { exclude: ["user_hash_password", "user_refresh_token"] },
    });
}

/**
 * Lấy người dùng theo ID (đầy đủ thông tin - dùng nội bộ)
 */
async function findByIdFull(userId) {
    return await User.findOne({
        where: { id: userId },
    });
}

/**
 * Lấy người dùng theo email
 */
async function findByEmail(email) {
    return await User.findOne({
        where: { user_email: email },
    });
}

/**
 * Cập nhật thông tin người dùng
 */
async function update(userId, userData) {
    return await User.update(userData, { where: { id: userId } });
}

/**
 * Cập nhật avatar người dùng
 */
async function updateAvatar(userId, avatarUrl) {
    return await User.update(
        { user_profile_picture: avatarUrl },
        { where: { id: userId } }
    );
}

/**
 * Cập nhật mật khẩu người dùng
 */
async function updatePassword(userId, hashedPassword) {
    return await User.update(
        { user_hash_password: hashedPassword },
        { where: { id: userId } }
    );
}

/**
 * Đặt trạng thái hoạt động của người dùng
 */
async function setActive(userId, isActive) {
    return await User.update(
        { user_is_active: isActive },
        { where: { id: userId } }
    );
}

module.exports = {
    findById,
    findByIdFull,
    findByEmail,
    update,
    updateAvatar,
    updatePassword,
    setActive,
};
