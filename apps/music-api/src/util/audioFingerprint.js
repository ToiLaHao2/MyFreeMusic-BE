// Audio Fingerprint Utility
// Uses Chromaprint/fpcalc to generate audio fingerprints for duplicate detection

const { execSync, exec } = require("child_process");
const path = require("path");
const fs = require("fs");

// Path to fpcalc executable
// Path to fpcalc executable in MyFreeMusic-BE/tools/
const FPCALC_PATH = path.join(__dirname, "..", "..", "..", "..", "tools", "fpcalc.exe");

/**
 * Generate audio fingerprint from file
 * @param {string} audioFilePath - Path to audio file
 * @returns {Promise<{fingerprint: string, duration: number} | null>}
 */
async function generateFingerprint(audioFilePath) {
    return new Promise((resolve) => {
        // Check if fpcalc exists
        if (!fs.existsSync(FPCALC_PATH)) {
            console.warn("fpcalc not found. Download from https://acoustid.org/chromaprint");
            resolve(null);
            return;
        }

        // Check if audio file exists
        if (!fs.existsSync(audioFilePath)) {
            console.error("Audio file not found:", audioFilePath);
            resolve(null);
            return;
        }

        try {
            const result = execSync(`"${FPCALC_PATH}" -raw "${audioFilePath}"`, {
                encoding: "utf8",
                timeout: 30000,
            });

            const fingerprintMatch = result.match(/FINGERPRINT=(.+)/);
            const durationMatch = result.match(/DURATION=(\d+)/);

            if (fingerprintMatch) {
                resolve({
                    fingerprint: fingerprintMatch[1].trim(),
                    duration: durationMatch ? parseInt(durationMatch[1]) : 0,
                });
            } else {
                resolve(null);
            }
        } catch (error) {
            console.error("Fingerprint generation error:", error.message);
            resolve(null);
        }
    });
}

/**
 * Calculate similarity between two fingerprints
 * Returns a value between 0 and 1 (1 = identical)
 * @param {string} fp1 - First fingerprint
 * @param {string} fp2 - Second fingerprint
 * @returns {number} Similarity score (0-1)
 */
function calculateSimilarity(fp1, fp2) {
    if (!fp1 || !fp2) return 0;

    // Convert fingerprints to arrays of integers
    const arr1 = fp1.split(",").map(Number);
    const arr2 = fp2.split(",").map(Number);

    // Use shorter length for comparison
    const length = Math.min(arr1.length, arr2.length);
    if (length === 0) return 0;

    let matches = 0;
    for (let i = 0; i < length; i++) {
        // XOR and count matching bits
        const xor = arr1[i] ^ arr2[i];
        const differentBits = countBits(xor);
        const matchingBits = 32 - differentBits;
        matches += matchingBits / 32;
    }

    return matches / length;
}

/**
 * Count number of 1 bits in a number (Hamming weight)
 */
function countBits(n) {
    let count = 0;
    while (n) {
        count += n & 1;
        n >>>= 1;
    }
    return count;
}

/**
 * Check if two fingerprints are similar enough to be considered duplicates
 * @param {string} fp1 - First fingerprint
 * @param {string} fp2 - Second fingerprint
 * @param {number} threshold - Similarity threshold (default 0.85 = 85% similar)
 * @returns {boolean}
 */
function areSimilar(fp1, fp2, threshold = 0.85) {
    const similarity = calculateSimilarity(fp1, fp2);
    return similarity >= threshold;
}

/**
 * Quick pre-filter: check if durations are similar
 * (Songs with very different durations are unlikely to be duplicates)
 */
function durationsSimilar(duration1, duration2, toleranceSeconds = 5) {
    return Math.abs(duration1 - duration2) <= toleranceSeconds;
}

module.exports = {
    generateFingerprint,
    calculateSimilarity,
    areSimilar,
    durationsSimilar,
    FPCALC_PATH,
};
