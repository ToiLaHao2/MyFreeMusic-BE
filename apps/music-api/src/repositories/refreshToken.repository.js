const { RefreshToken } = require("../models/refreshToken.model");
const { Op } = require("sequelize");

class RefreshTokenRepository {
    async create(data) {
        return await RefreshToken.create(data);
    }

    async findByToken(token) {
        return await RefreshToken.findOne({
            where: {
                token,
                is_revoked: false,
                expires_at: { [Op.gt]: new Date() }
            }
        });
    }

    // Find active token for user on specific device type
    async findActiveSession(userId, deviceType) {
        return await RefreshToken.findOne({
            where: {
                user_id: userId,
                device_type: deviceType,
                is_revoked: false,
                expires_at: { [Op.gt]: new Date() }
            }
        });
    }

    // Revoke a specific token
    async revoke(id) {
        return await RefreshToken.update(
            { is_revoked: true },
            { where: { id } }
        );
    }

    // Revoke all tokens for a user (optional cleanup)
    async revokeAllForUser(userId) {
        return await RefreshToken.update(
            { is_revoked: true },
            { where: { user_id: userId } }
        );
    }

    // Revoke session for specific device type (to enforce 1 session limit)
    async revokeSessionForDevice(userId, deviceType) {
        return await RefreshToken.update(
            { is_revoked: true },
            {
                where: {
                    user_id: userId,
                    device_type: deviceType,
                    is_revoked: false
                }
            }
        );
    }
}

module.exports = new RefreshTokenRepository();
