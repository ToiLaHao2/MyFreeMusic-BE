// Auth Service - Business Logic Layer
const userRepository = require("../repositories/user.repository");
const {
    CreateAccessToken,
    CreateRefreshToken,
    VerifiedToken,
    HashPassword,
    CompareHashPassword,
} = require("../util/authHelpers");

/**
 * Đăng nhập người dùng
 */
async function login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
        return { success: false, message: "Tên đăng nhập hoặc mật khẩu không đúng." };
    }

    const isPasswordValid = await CompareHashPassword(password, user.user_hash_password);
    if (!isPasswordValid) {
        return { success: false, message: "Tên đăng nhập hoặc mật khẩu không đúng." };
    }

    const accessToken = await CreateAccessToken(user.id);
    const refreshToken = await CreateRefreshToken(user.id);

    await userRepository.setActive(user.id, true);

    return {
        success: true,
        accessToken,
        refreshToken,
        user,
    };
}

/**
 * Đăng xuất người dùng
 */
async function logout(userId) {
    await userRepository.setActive(userId, false);
    return { success: true };
}

/**
 * Làm mới access token
 */
async function refreshAccessToken(refreshToken) {
    const decoded = VerifiedToken(refreshToken);
    if (!decoded) {
        return { success: false, message: "Refresh token không hợp lệ." };
    }

    const newAccessToken = CreateAccessToken(decoded.id);
    return { success: true, accessToken: newAccessToken };
}

/**
 * Đổi mật khẩu
 */
async function changePassword(userId, oldPassword, newPassword) {
    const user = await userRepository.findById(userId);
    if (!user) {
        return { success: false, message: "Người dùng không tồn tại." };
    }

    const isPasswordValid = await CompareHashPassword(oldPassword, user.user_hash_password);
    if (!isPasswordValid) {
        return { success: false, message: "Mật khẩu cũ không đúng." };
    }

    const hashedPassword = await HashPassword(newPassword);
    await userRepository.updatePassword(userId, hashedPassword);

    return { success: true };
}

module.exports = {
    login,
    logout,
    refreshAccessToken,
    changePassword,
};
