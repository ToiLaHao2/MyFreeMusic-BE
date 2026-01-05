// controllers/user.controller.js
// Controller layer - Only handles HTTP request/response
// Business logic is delegated to the service layer

const userService = require("../services/user.service");
const logger = require("../util/logger");
const { sendSuccess, sendError } = require("../util/response");

/**
 * Lấy thông tin người dùng
 */
async function GetUserInformation(req, res) {
    try {
        const { user_id } = req.params;

        const user = await userService.getUserById(user_id);
        if (!user) {
            return sendError(res, 404, "Người dùng không tồn tại.");
        }

        return sendSuccess(res, 200, {
            message: "Lấy thông tin người dùng thành công.",
            user: user,
            token_near_expired: req.token_near_expire || false,
        });
    } catch (error) {
        logger.error("Lỗi khi lấy thông tin người dùng:", error);
        return sendError(res, 500, "Lỗi hệ thống.");
    }
}

/**
 * Cập nhật thông tin người dùng
 */
async function UpdateUserInformation(req, res) {
    try {
        const { user_id } = req.params;
        const { user_full_name, user_email, user_phone_number } = req.body;

        const result = await userService.updateUser(user_id, {
            user_full_name,
            user_email,
            user_phone_number,
        });

        if (!result.success) {
            return sendError(res, 404, result.message);
        }

        return sendSuccess(res, 200, {
            message: "Cập nhật thông tin người dùng thành công.",
            token_near_expired: req.token_near_expire || false,
        });
    } catch (error) {
        logger.error("Lỗi khi cập nhật thông tin người dùng:", error);
        return sendError(res, 500, "Lỗi hệ thống.");
    }
}

/**
 * Thay đổi avatar người dùng
 */
async function ChangeUserAvatar(req, res) {
    try {
        const { user_id } = req.params;
        const file = req.file;

        const result = await userService.updateAvatar(user_id, file);
        if (!result.success) {
            return sendError(res, result.statusCode || 500, result.message);
        }

        return sendSuccess(res, 200, {
            message: "Avatar uploaded successfully",
            user: result.user,
            token_near_expired: req.token_near_expire || false,
        });
    } catch (error) {
        logger.error("Error uploading avatar:", error);
        return sendError(res, 500, "Lỗi hệ thống.");
    }
}

module.exports = {
    GetUserInformation,
    UpdateUserInformation,
    ChangeUserAvatar,
};
