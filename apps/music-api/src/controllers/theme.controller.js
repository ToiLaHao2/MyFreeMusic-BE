const themeService = require("../services/theme.service");
const { sendSuccess, sendError } = require("../util/response");
const logger = require("../util/logger");

/**
 * Get current user's theme settings
 */
async function getTheme(req, res) {
    try {
        const userId = req.user_id;
        const theme = await themeService.getThemeSettings(userId);

        return sendSuccess(res, 200, {
            message: "Theme settings retrieved.",
            theme,
        });
    } catch (error) {
        logger.error("Error getting theme:", error);
        return sendError(res, 500, "Failed to get theme settings.");
    }
}

/**
 * Update user's theme settings
 */
async function updateTheme(req, res) {
    try {
        const userId = req.user_id;
        const { presetTheme, accentColor, backgroundType, backgroundColor, sidebarOpacity } = req.body;
        const backgroundFile = req.files?.background?.[0];

        const theme = await themeService.updateThemeSettings(
            userId,
            { presetTheme, accentColor, backgroundType, backgroundColor, sidebarOpacity },
            backgroundFile
        );

        return sendSuccess(res, 200, {
            message: "Theme settings updated.",
            theme,
        });
    } catch (error) {
        logger.error("Error updating theme:", error);
        return sendError(res, 500, "Failed to update theme settings.");
    }
}

/**
 * Get available theme presets
 */
async function getPresets(req, res) {
    try {
        const presets = themeService.getPresets();
        return sendSuccess(res, 200, { presets });
    } catch (error) {
        logger.error("Error getting presets:", error);
        return sendError(res, 500, "Failed to get presets.");
    }
}

module.exports = {
    getTheme,
    updateTheme,
    getPresets,
};
