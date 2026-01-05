// controllers/auth.controller.js
// Controller layer - Only handles HTTP request/response
// Business logic is delegated to the service layer

const authService = require("../services/auth.service");
const { sendSuccess, sendError } = require("../util/response");
const logger = require("../util/logger");

/**
 * Làm mới access token
 */
async function refreshAccessToken(req, res) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return sendError(res, 401, "Refresh token không được cung cấp.");
        }

        const result = await authService.refreshAccessToken(refreshToken);
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
        const { user_email, user_password } = req.body;

        const result = await authService.login(user_email, user_password);
        if (!result.success) {
            return sendError(res, 401, result.message);
        }

        return sendSuccess(res, 200, {
            message: "Đăng nhập thành công.",
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        });
    } catch (error) {
        logger.error("Error during login: ", error);
        return sendError(res, 500, "Lỗi không xác định.");
    }
}

/**
 * Đăng xuất
 */
async function logout(req, res) {
    try {
        const { user_id } = req.body;

        const result = await authService.logout(user_id);
        if (!result.success) {
            return sendError(res, 404, result.message);
        }

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

        const result = await authService.changePassword(user_id, old_password, new_password);
        if (!result.success) {
            const statusCode = result.message.includes("không tồn tại") ? 404 : 401;
            return sendError(res, statusCode, result.message);
        }

        return sendSuccess(res, 200, {
            message: "Đổi mật khẩu thành công.",
        });
    } catch (error) {
        logger.error("Error during change password: ", error);
        return sendError(res, 500, "Lỗi không xác định.");
    }
}

module.exports = {
    refreshAccessToken,
    login,
    logout,
    changePassword,
};
