// controllers/auth.controller.js
const authService = require("../services/auth.service");
const activityService = require("../services/activity.service");
const { sendSuccess, sendError } = require("../util/response");
const logger = require("../util/logger");

/**
 * Làm mới access token
 */
async function refreshAccessToken(req, res) {
    try {
        const { refreshToken, device_type } = req.body;
        if (!refreshToken) {
            return sendError(res, 401, "Refresh token không được cung cấp.");
        }

        // Get device type from body or header
        const deviceType = device_type || req.headers['x-device-type'];

        const result = await authService.refreshAccessToken(refreshToken, deviceType);
        if (!result.success) {
            return sendError(res, 403, result.message);
        }

        return sendSuccess(res, 200, {
            message: "Tạo access token mới thành công.",
            accessToken: result.accessToken,
        });
    } catch (error) {
        logger.error("Error during refresh token: ", error);
        return sendError(res, 500, "Lỗi không xác định.");
    }
}

/**
 * Đăng nhập
 */
async function login(req, res) {
    try {
        const { user_email, user_password, device_type, remember_me } = req.body;

        if (!user_email || !user_password) {
            return sendError(res, 400, "Email và mật khẩu là bắt buộc.");
        }

        // Validate device_type
        const validDeviceTypes = ['web', 'app'];
        const deviceType = device_type && validDeviceTypes.includes(device_type) ? device_type : 'web';

        const result = await authService.login(user_email, user_password, deviceType, remember_me);

        if (!result.success) {
            return sendError(res, 401, result.message);
        }

        // Log Activity
        activityService.logActivity(result.user.id, "USER_LOGIN", null, { deviceType }, req);

        return sendSuccess(res, 200, {
            message: "Đăng nhập thành công.",
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: result.user
        });
    } catch (error) {
        logger.error("Error during login: ", error);
        return sendError(res, 500, `Lỗi: ${error.message}`);
    }
}

/**
 * Đăng xuất
 */
async function logout(req, res) {
    try {
        // user_id comes from authMiddleware
        const user_id = req.user_id;
        const { refreshToken } = req.body;

        const result = await authService.logout(user_id, refreshToken);
        if (!result.success) {
            return sendError(res, 404, result.message);
        }

        // Log Activity
        activityService.logActivity(user_id, "USER_LOGOUT", null, null, req);

        return sendSuccess(res, 200, {
            message: "Đăng xuất thành công.",
        });
    } catch (error) {
        logger.error("Error during logout: ", error);
        return sendError(res, 500, "Lỗi không xác định.");
    }
}

/**
 * Đổi mật khẩu
 */
async function changePassword(req, res) {
    try {
        const { user_id, old_password, new_password } = req.body;

        // Ensure user can only change their own password unless admin
        // req.user_id comes from token
        if (req.user_id !== user_id) {
            // Optional: check if admin in future
            return sendError(res, 403, "Không có quyền thực hiện.");
        }

        const result = await authService.changePassword(user_id, old_password, new_password);
        if (!result.success) {
            const statusCode = result.message.includes("không tồn tại") ? 404 : 401;
            return sendError(res, statusCode, result.message);
        }

        return sendSuccess(res, 200, {
            message: "Đổi mật khẩu thành công.",
        });
    } catch (error) {
        logger.error("Error during password change: ", error);
        return sendError(res, 500, "Lỗi không xác định.");
    }
}

/**
 * Cập nhật profile
 */
async function updateProfile(req, res) {
    try {
        const user_id = req.user_id; // From token
        const { fullName, email, bio, theme } = req.body;
        const avatarFile = req.files?.avatar?.[0];

        const result = await authService.updateProfile(user_id, { fullName, email, bio, theme }, avatarFile);

        if (!result.success) {
            return sendError(res, 400, result.message);
        }

        // Log Activity
        activityService.logActivity(user_id, "USER_UPDATE_PROFILE", null, null, req);

        return sendSuccess(res, 200, {
            message: "Cập nhật thông tin thành công.",
            user: result.user
        });
    } catch (error) {
        logger.error("Error during profile update: ", error);
        return sendError(res, 500, "Lỗi không xác định.");
    }
}

module.exports = {
    refreshAccessToken,
    login,
    logout,
    changePassword,
    updateProfile,
};
