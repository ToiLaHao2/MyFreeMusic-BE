const jwt = require("jsonwebtoken");
const logger = require("../util/logger");
const { VerifiedToken } = require("../util/authHelpers");
const { sendError } = require("../util/response");

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    // Debug logging
    console.log("[AUTH] Authorization header:", authHeader ? authHeader.substring(0, 50) + "..." : "MISSING");
    console.log("[AUTH] Token extracted:", token ? token.substring(0, 30) + "..." : "MISSING");

    if (!token) {
        return sendError(res, 401, "Không có token xác thực.");
    }

    const userRepository = require("../repositories/user.repository");

    try {
        const decoded = await VerifiedToken(token);
        console.log("[AUTH] Decoded token:", decoded);

        if (!decoded) {
            console.log("[AUTH] Token verification failed - decoded is null");
            return sendError(res, 401, "Token không hợp lệ.");
        }

        // Fetch full user for role check
        const user = await userRepository.findById(decoded.id);
        if (!user || !user.user_is_active) {
            return sendError(res, 401, "Người dùng không tồn tại hoặc bị khóa.");
        }

        req.user_id = decoded.id;
        req.user = user;

        // Check thời gian còn lại
        const timeRemaining = decoded.exp * 1000 - Date.now();
        const timeLimit = 5 * 60 * 1000; // 5 phút

        if (timeRemaining < timeLimit) {
            req.token_near_expire = true;
        }

        next();
    } catch (error) {
        console.log("[AUTH] CATCH ERROR:", error);
        console.log("[AUTH] Error name:", error.name);
        console.log("[AUTH] Error message:", error.message);
        console.log("[AUTH] Error stack:", error.stack);
        logger.warn("Token hết hạn hoặc không hợp lệ:", error.message);
        return sendError(res, 401, "Token hết hạn hoặc không hợp lệ.");
    }
};

module.exports = authMiddleware;
