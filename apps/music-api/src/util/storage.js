/**
 * Storage Configuration Utility
 * Centralized, flexible configuration for all file storage.
 * Supports multiple storage providers: LOCAL, CLOUDINARY, S3, etc.
 * 
 * HOW TO SWITCH STORAGE:
 * 1. Change STORAGE_PROVIDER for the type you want to switch
 * 2. Add necessary credentials in .env
 * 3. No code changes needed in services!
 */

const path = require("path");
const fs = require("fs");

// ===========================================
// STORAGE PROVIDERS - Change these to switch
// ===========================================
const STORAGE_PROVIDERS = {
    covers: "LOCAL",     // Options: "LOCAL", "CLOUDINARY"
    audio: "LOCAL",      // Options: "LOCAL", "S3"
    hls: "LOCAL",        // Options: "LOCAL", "S3"
};

// ===========================================
// LOCAL STORAGE CONFIG
// ===========================================
// Base path (relative to this file): util/ -> src/ -> music-api/ -> apps/ -> songs-storage/
const LOCAL_STORAGE_BASE = path.join(__dirname, "..", "..", "..", "songs-storage");

const LOCAL_PATHS = {
    base: LOCAL_STORAGE_BASE,
    original: path.join(LOCAL_STORAGE_BASE, "original"),
    hls: path.join(LOCAL_STORAGE_BASE, "hls"),
    covers: path.join(LOCAL_STORAGE_BASE, "covers"),
    temp: path.join(LOCAL_STORAGE_BASE, "temp"),
};

// ===========================================
// URL CONFIG
// ===========================================
const STREAMING_BASE_URL = process.env.STREAMING_URL || "http://localhost:4000";
const API_BASE_URL = process.env.API_URL || "http://localhost:3000";

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Ensure a directory exists, create if not
 */
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
    return dirPath;
}

/**
 * Initialize all local storage directories
 */
function initStorage() {
    if (STORAGE_PROVIDERS.audio === "LOCAL" || STORAGE_PROVIDERS.covers === "LOCAL") {
        Object.values(LOCAL_PATHS).forEach(p => {
            if (typeof p === "string") ensureDir(p);
        });
        console.log("✅ Local storage directories initialized:", LOCAL_STORAGE_BASE);
    }
}

// ===========================================
// COVER IMAGE STORAGE
// ===========================================

/**
 * Save cover image
 * @param {Object} file - Multer file object
 * @param {string} slug - Song slug for filename
 * @returns {Promise<string>} URL to access the cover
 */
async function saveCover(file, slug) {
    const ext = path.extname(file.originalname);
    const filename = `${slug}${ext}`;

    if (STORAGE_PROVIDERS.covers === "LOCAL") {
        ensureDir(LOCAL_PATHS.covers);
        const destPath = path.join(LOCAL_PATHS.covers, filename);
        fs.copyFileSync(file.path, destPath);
        fs.unlinkSync(file.path); // Clean temp
        return `${STREAMING_BASE_URL}/covers/${filename}`;
    }

    if (STORAGE_PROVIDERS.covers === "CLOUDINARY") {
        const cloudinary = require("../config/cloudinary.config");
        const result = await cloudinary.uploader.upload(file.path, {
            folder: "music_app/covers",
            public_id: slug,
        });
        fs.unlinkSync(file.path);
        return result.secure_url;
    }

    throw new Error(`Unknown cover storage provider: ${STORAGE_PROVIDERS.covers}`);
}

/**
 * Save cover from URL (for YouTube thumbnails)
 * @param {string} imageUrl - URL of the image
 * @param {string} slug - Song slug
 * @returns {Promise<string>} URL to access the cover
 */
async function saveCoverFromUrl(imageUrl, slug) {
    if (STORAGE_PROVIDERS.covers === "CLOUDINARY") {
        const cloudinary = require("../config/cloudinary.config");
        const result = await cloudinary.uploader.upload(imageUrl, {
            folder: "music_app/covers",
            public_id: slug,
        });
        return result.secure_url;
    }

    // For LOCAL, we'd need to download the image first
    // For now, just return the original URL
    return imageUrl;
}

// ===========================================
// AUDIO FILE STORAGE
// ===========================================

/**
 * Save original audio file
 * @param {Object} file - Multer file object
 * @param {string} slug - Song slug for filename
 * @returns {string} Path to the saved file
 */
function saveOriginalAudio(file, slug) {
    const ext = path.extname(file.originalname);
    const filename = `${slug}${ext}`;

    if (STORAGE_PROVIDERS.audio === "LOCAL") {
        ensureDir(LOCAL_PATHS.original);
        const destPath = path.join(LOCAL_PATHS.original, filename);
        fs.copyFileSync(file.path, destPath);
        return destPath;
    }

    throw new Error(`Unknown audio storage provider: ${STORAGE_PROVIDERS.audio}`);
}

/**
 * Get HLS output directory for a song
 * @param {string} slug - Song slug
 * @returns {string} HLS output directory path
 */
function getHlsOutputPath(slug) {
    if (STORAGE_PROVIDERS.hls === "LOCAL") {
        return path.join(LOCAL_PATHS.hls, slug);
    }
    throw new Error(`Unknown HLS storage provider: ${STORAGE_PROVIDERS.hls}`);
}

/**
 * Get HLS stream URL for a song
 * @param {string} slug - Song slug
 * @returns {string} HLS stream URL
 */
function getHlsUrl(slug) {
    return `${STREAMING_BASE_URL}/hls/${slug}/index.m3u8`;
}

// ===========================================
// EXPORTS
// ===========================================
module.exports = {
    // Config
    STORAGE_PROVIDERS,
    LOCAL_PATHS,
    STREAMING_BASE_URL,
    API_BASE_URL,

    // Legacy exports for compatibility
    PATHS: LOCAL_PATHS,

    // Helper functions
    ensureDir,
    initStorage,

    // Cover operations
    saveCover,
    saveCoverFromUrl,

    // Audio operations
    saveOriginalAudio,
    getHlsOutputPath,
    getHlsUrl,
};
