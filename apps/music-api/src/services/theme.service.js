const { UserThemeSettings, User } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Default theme preset colors
const THEME_PRESETS = {
    Dark: { accent: "#00ABA9", background: "#000000" },
    Ocean: { accent: "#0078D7", background: "#0A1929" },
    Sunset: { accent: "#FA6800", background: "#1A0A00" },
    Forest: { accent: "#A4C400", background: "#0A1A0A" },
    Midnight: { accent: "#AA00FF", background: "#0F0A1A" },
    HighContrast: { accent: "#FFFFFF", background: "#000000" },
};

/**
 * Get user's theme settings (or create default)
 */
async function getThemeSettings(userId) {
    let settings = await UserThemeSettings.findOne({ where: { user_id: userId } });

    if (!settings) {
        // Create default settings for new users
        settings = await UserThemeSettings.create({
            id: uuidv4(),
            user_id: userId,
            preset_theme: "Dark",
            accent_color: null,
            background_type: "default",
            background_value: null,
            sidebar_opacity: 1.0,
        });
    }

    return formatThemeResponse(settings);
}

/**
 * Update user's theme settings
 */
async function updateThemeSettings(userId, data, backgroundFile) {
    let settings = await UserThemeSettings.findOne({ where: { user_id: userId } });

    if (!settings) {
        settings = await UserThemeSettings.create({
            id: uuidv4(),
            user_id: userId,
        });
    }

    // Update fields
    if (data.presetTheme !== undefined) settings.preset_theme = data.presetTheme;
    if (data.accentColor !== undefined) settings.accent_color = data.accentColor;
    if (data.backgroundType !== undefined) settings.background_type = data.backgroundType;
    if (data.sidebarOpacity !== undefined) settings.sidebar_opacity = data.sidebarOpacity;

    // Handle background value
    if (data.backgroundType === "color" && data.backgroundColor) {
        settings.background_value = data.backgroundColor;
    } else if (data.backgroundType === "default") {
        settings.background_value = null;
    }

    // Handle background image upload
    if (backgroundFile && data.backgroundType === "image") {
        const storage = require("../util/storage");
        const slug = `theme-bg-${userId}-${Date.now()}`;
        const url = await storage.saveCover(backgroundFile, slug);
        settings.background_value = url;
    }

    await settings.save();

    return formatThemeResponse(settings);
}

/**
 * Format theme settings for API response
 */
function formatThemeResponse(settings) {
    const preset = THEME_PRESETS[settings.preset_theme] || THEME_PRESETS.Dark;

    return {
        presetTheme: settings.preset_theme,
        accentColor: settings.accent_color || preset.accent,
        backgroundType: settings.background_type,
        backgroundValue: settings.background_value || preset.background,
        sidebarOpacity: settings.sidebar_opacity,
        // Computed values for frontend convenience
        effectiveAccent: settings.accent_color || preset.accent,
        effectiveBackground: settings.background_type === "default"
            ? preset.background
            : settings.background_value,
    };
}

/**
 * Get available theme presets
 */
function getPresets() {
    return Object.keys(THEME_PRESETS).map(name => ({
        name,
        ...THEME_PRESETS[name],
    }));
}

module.exports = {
    getThemeSettings,
    updateThemeSettings,
    getPresets,
    THEME_PRESETS,
};
