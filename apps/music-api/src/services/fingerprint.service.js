// Fingerprint Service - Duplicate Detection Logic
const songRepository = require("../repositories/song.repository");
const { generateFingerprint, areSimilar, durationsSimilar } = require("../util/audioFingerprint");

/**
 * Extract YouTube ID from URL
 */
function extractYoutubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}

/**
 * Check if YouTube video already exists in database
 */
async function checkYoutubeDuplicate(youtubeUrl) {
    const youtubeId = extractYoutubeId(youtubeUrl);
    if (!youtubeId) return null;

    const existingSong = await songRepository.findByYoutubeId(youtubeId);
    if (existingSong) {
        return {
            isDuplicate: true,
            existingSong,
            reason: "YOUTUBE_ID_MATCH",
        };
    }
    return null;
}

/**
 * Check if audio file is duplicate using fingerprint
 * @param {string} audioFilePath - Path to audio file
 * @returns {Promise<{isDuplicate: boolean, existingSong?: object, similarity?: number}>}
 */
async function checkAudioDuplicate(audioFilePath) {
    // Generate fingerprint for new file
    const result = await generateFingerprint(audioFilePath);
    if (!result) {
        return { isDuplicate: false, fingerprint: null };
    }

    const { fingerprint, duration } = result;

    // Get all songs with similar duration (quick filter)
    const candidateSongs = await songRepository.findBySimilarDuration(duration, 5);

    // Compare fingerprints
    for (const song of candidateSongs) {
        if (song.fingerprint && areSimilar(fingerprint, song.fingerprint, 0.85)) {
            return {
                isDuplicate: true,
                existingSong: song,
                reason: "FINGERPRINT_MATCH",
                similarity: 0.85,
            };
        }
    }

    return {
        isDuplicate: false,
        fingerprint,
        duration,
    };
}

/**
 * Full duplicate check (YouTube + Fingerprint)
 */
async function checkDuplicate(source, audioFilePath, youtubeUrl = null) {
    // For YouTube: check ID first
    if (source === "YOUTUBE" && youtubeUrl) {
        const ytDuplicate = await checkYoutubeDuplicate(youtubeUrl);
        if (ytDuplicate) return ytDuplicate;
    }

    // For all sources: check fingerprint
    if (audioFilePath) {
        const fpDuplicate = await checkAudioDuplicate(audioFilePath);
        if (fpDuplicate.isDuplicate) return fpDuplicate;

        // Return fingerprint for saving
        return {
            isDuplicate: false,
            fingerprint: fpDuplicate.fingerprint,
            duration: fpDuplicate.duration,
        };
    }

    return { isDuplicate: false };
}

module.exports = {
    extractYoutubeId,
    checkYoutubeDuplicate,
    checkAudioDuplicate,
    checkDuplicate,
    generateFingerprint,
};
