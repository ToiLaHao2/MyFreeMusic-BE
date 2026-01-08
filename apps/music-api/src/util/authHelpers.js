const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logger = require("../util/logger");

async function HashPassword(password) {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        logger.info("Hash password complete");
        return hashedPassword;
    } catch (error) {
        logger.error("Error hash password: ", error);
        throw new Error("Hashing password failed" + error);
    }
}

async function CompareHashPassword(password, hashedPassword) {
    try {
        const compare = bcrypt.compare(password, hashedPassword);
        logger.info("Compare hash complete");
        return compare;
    } catch (error) {
        logger.error("Error compare hash: ", error);
        throw new Error("Comparing password failed" + error);
    }
}

async function CreateAccessToken(id) {
    try {
        console.log("[CreateAccessToken] Received id:", id, "type:", typeof id);

        const secret = process.env.JWT_SECRET || process.env.SECRET_TOKEN_KEY || "default_jwt_secret";
        const expiresIn = process.env.JWT_EXPIRES_IN || process.env.TOKEN_EXPIRES_IN || "7d";

        const payload = { id: id };
        console.log("[CreateAccessToken] Payload:", payload);

        const accessToken = jwt.sign(payload, secret, { expiresIn });

        // Verify what we just created
        const decoded = jwt.decode(accessToken);
        console.log("[CreateAccessToken] Created token decoded:", decoded);

        logger.info("Complete create access token");
        return accessToken;
    } catch (error) {
        logger.error("Error create token: ", error);
        return null;
    }
}

async function CreateRefreshToken(id) {
    try {
        const secret = process.env.JWT_SECRET || process.env.SECRET_TOKEN_KEY || "default_jwt_secret";
        const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || process.env.REFRESH_TOKEN_EXPIRES_IN || "30d";

        const refreshToken = await jwt.sign(
            { id: id },
            secret,
            { expiresIn }
        );
        logger.info("Complete create refresh token");
        return refreshToken;
    } catch (error) {
        logger.error("Error create refresh token: ", error);
        return null;
    }
}

async function VerifiedToken(token) {
    if (!token) {
        logger.warn("No token provided");
        return null;
    }
    try {
        const secret = process.env.JWT_SECRET || process.env.SECRET_TOKEN_KEY || "default_jwt_secret";
        console.log("[VerifiedToken] Using secret:", secret.substring(0, 10) + "...");
        console.log("[VerifiedToken] Token to verify:", token.substring(0, 30) + "...");

        const verified = jwt.verify(token, secret);
        console.log("[VerifiedToken] Success! User ID:", verified.id);
        return verified;
    } catch (error) {
        console.log("[VerifiedToken] ERROR:", error.name, error.message);
        logger.error("Error verified token: ", error);
        return null;
    }
}

module.exports = {
    HashPassword,
    CompareHashPassword,
    CreateAccessToken,
    CreateRefreshToken,
    VerifiedToken,
};
