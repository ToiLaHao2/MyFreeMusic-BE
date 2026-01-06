// Auth Service - Business Logic Layer
const userRepository = require("../repositories/user.repository");
const refreshTokenRepository = require("../repositories/refreshToken.repository");
const {
    CreateAccessToken,
    CreateRefreshToken,
    VerifiedToken,
    HashPassword,
    CompareHashPassword,
} = require("../util/authHelpers");

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_SHORT = 7; // 7 days
const REFRESH_TOKEN_EXPIRY_LONG = 30; // 30 days

/**
 * Đăng nhập người dùng
 */
async function login(email, password, deviceType, rememberMe) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
        return { success: false, message: "Tên đăng nhập hoặc mật khẩu không đúng." };
    }

    const isPasswordValid = await CompareHashPassword(password, user.user_hash_password);
    if (!isPasswordValid) {
        return { success: false, message: "Tên đăng nhập hoặc mật khẩu không đúng." };
    }

    // 1. Enforce single session per device type (revoke old session)
    if (deviceType) {
        await refreshTokenRepository.revokeSessionForDevice(user.id, deviceType);
    }

    // 2. Create tokens
    const accessToken = await CreateAccessToken(user.id);
    const refreshTokenString = await CreateRefreshToken(user.id);

    // 3. Store refresh token in DB
    const expiryDays = rememberMe ? REFRESH_TOKEN_EXPIRY_LONG : REFRESH_TOKEN_EXPIRY_SHORT;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    await refreshTokenRepository.create({
        user_id: user.id,
        token: refreshTokenString,
        device_type: deviceType || 'web',
        expires_at: expiresAt,
    });

    await userRepository.setActive(user.id, true);

    return {
        success: true,
        accessToken,
        refreshToken: refreshTokenString,
        user: {
            id: user.id,
            email: user.user_email,
            name: user.user_full_name,
            role: user.role,
            avatar: user.user_profile_picture
        },
    };
}

/**
 * Đăng xuất người dùng
 */
async function logout(userId, refreshToken) {
    if (refreshToken) {
        const tokenRecord = await refreshTokenRepository.findByToken(refreshToken);
        if (tokenRecord) {
            await refreshTokenRepository.revoke(tokenRecord.id);
        }
    }

    await userRepository.setActive(userId, false);
    return { success: true };
}

/**
 * Làm mới access token
 */
async function refreshAccessToken(refreshToken, deviceType) {
    // 1. Verify JWT format
    const decoded = VerifiedToken(refreshToken);
    if (!decoded) {
        return { success: false, message: "Refresh token không hợp lệ." };
    }

    // 2. Check DB for valid session
    const tokenRecord = await refreshTokenRepository.findByToken(refreshToken);
    if (!tokenRecord) {
        return { success: false, message: "Refresh token không tồn tại hoặc đã bị hủy." };
    }

    // 3. Optional: Check device type match
    if (deviceType && tokenRecord.device_type !== deviceType) {
        // Suspicious activity?
    }

    // 4. Create new Access Token
    const newAccessToken = await CreateAccessToken(decoded.id);
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

    // Optional: Revoke all sessions on password change
    await refreshTokenRepository.revokeAllForUser(userId);

    return { success: true };
}

module.exports = {
    login,
    logout,
    refreshAccessToken,
    changePassword,
};
