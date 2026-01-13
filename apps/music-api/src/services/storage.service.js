// Storage Service - Track and manage music storage usage with DB persistence
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { Song } = require("../models/song.model");
const { StorageStats } = require("../models/storageStats.model");
const logger = require("../util/logger");

const { Upload } = require("@aws-sdk/lib-storage");
const { GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const r2Client = require("../util/r2Client");
const { R2_BUCKET_NAME, R2_PUBLIC_URL } = require("../config/r2.config");

// Storage path from env
const SONGS_STORAGE_PATH = process.env.SONGS_STORAGE_PATH || path.join(__dirname, "../../../songs-storage");
const ORIGINAL_FILES_PATH = path.join(SONGS_STORAGE_PATH, "original");
const HLS_FILES_PATH = path.join(SONGS_STORAGE_PATH, "hls");

// Storage limit from env (in bytes) - defaults to 10GB for R2 free tier
const STORAGE_LIMIT_BYTES = parseInt(process.env.STORAGE_LIMIT_BYTES || (10 * 1024 * 1024 * 1024)); // 10GB default
const STORAGE_TYPE = process.env.STORAGE_TYPE || "LOCAL"; // LOCAL, CLOUDFLARE_R2, S3

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Get disk space info for local storage (Windows/Unix compatible)
 */
function getDiskSpace() {
    try {
        const drivePath = path.parse(SONGS_STORAGE_PATH).root || "C:\\";

        if (process.platform === "win32") {
            // Windows: use powershell (wmic is deprecated/unavailable)
            const drive = drivePath.charAt(0);
            const cmd = `powershell -Command "Get-Volume -DriveLetter ${drive} | Select-Object -Property SizeRemaining,Size | ConvertTo-Json"`;
            const output = execSync(cmd, { encoding: "utf8" });
            const data = JSON.parse(output);

            return {
                total: data.Size || 0,
                free: data.SizeRemaining || 0,
                used: (data.Size || 0) - (data.SizeRemaining || 0),
            };
        } else {
            // Unix/Mac: use df command
            const output = execSync(`df -B1 "${SONGS_STORAGE_PATH}"`, { encoding: "utf8" });
            const lines = output.trim().split("\n");
            if (lines.length >= 2) {
                const parts = lines[1].split(/\s+/);
                return {
                    total: parseInt(parts[1]) || 0,
                    free: parseInt(parts[3]) || 0,
                    used: parseInt(parts[2]) || 0,
                };
            }
        }
    } catch (err) {
        logger.error("Error getting disk space:", err);
    }

    return { total: 0, free: 0, used: 0 };
}

/**
 * Get size of a file or directory recursively
 */
function getDirectorySize(dirPath) {
    let totalSize = 0;
    let fileCount = 0;

    if (!fs.existsSync(dirPath)) {
        return { size: 0, count: 0 };
    }

    const items = fs.readdirSync(dirPath);
    for (const item of items) {
        const itemPath = path.join(dirPath, item);
        try {
            const stats = fs.statSync(itemPath);
            if (stats.isFile()) {
                totalSize += stats.size;
                fileCount++;
            } else if (stats.isDirectory()) {
                const subResult = getDirectorySize(itemPath);
                totalSize += subResult.size;
                fileCount += subResult.count;
            }
        } catch (err) {
            logger.error(`Error reading ${itemPath}:`, err);
        }
    }

    return { size: totalSize, count: fileCount };
}


/**
 * Scan storage directory and calculate total size
 */
async function scanStorageDirectory() {
    try {
        logger.info(`Scanning storage directory: ${SONGS_STORAGE_PATH}`);

        if (!fs.existsSync(SONGS_STORAGE_PATH)) {
            logger.warn(`Storage path does not exist: ${SONGS_STORAGE_PATH}`);
            // Return empty stats if path missing
            return {
                totalSize: 0,
                fileCount: 0,
                formatted: "0 Bytes",
                averageSize: 0,
                averageFormatted: "0 Bytes",
                originalSize: 0,
                originalSizeFormatted: "0 Bytes",
                originalFiles: 0,
                hlsSize: 0,
                hlsSizeFormatted: "0 Bytes",
                hlsFiles: 0,
            };
        }

        // Scan original music files
        const originalStats = getDirectorySize(ORIGINAL_FILES_PATH);

        // Scan HLS files (streaming chunks)
        const hlsStats = getDirectorySize(HLS_FILES_PATH);

        logger.info(`Storage Scan Result: Original=${originalStats.formatted}, HLS=${hlsStats.formatted}, Total=${formatBytes(originalStats.size + hlsStats.size)}`);

        const totalSize = originalStats.size + hlsStats.size;
        const totalFiles = originalStats.count + hlsStats.count;

        return {
            totalSize,
            fileCount: totalFiles,
            formatted: formatBytes(totalSize),
            averageSize: totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0,
            averageFormatted: totalFiles > 0 ? formatBytes(Math.round(totalSize / totalFiles)) : "0 Bytes",
            originalSize: originalStats.size,
            originalSizeFormatted: formatBytes(originalStats.size),
            originalFiles: originalStats.count,
            hlsSize: hlsStats.size,
            hlsSizeFormatted: formatBytes(hlsStats.size),
            hlsFiles: hlsStats.count,
        };
    } catch (error) {
        logger.error(`Error scanning storage directory (${SONGS_STORAGE_PATH}):`, error);
        throw error;
    }
}

/**
 * Get or create StorageStats record from database
 */
async function getStorageStatsFromDb() {
    try {
        const { StorageStats } = require("../models");
        let stats = await StorageStats.findOne({ where: { id: 1 } });
        return stats;
    } catch (error) {
        logger.error("Error getting storage stats from DB:", error);
        return null;
    }
}

/**
 * Save storage stats to database
 */
async function saveStorageStatsToDb(data) {
    try {
        const { StorageStats } = require("../models");

        // Upsert - update if exists, create if not
        const [stats] = await StorageStats.upsert({
            id: 1,
            total_songs: data.totalSongs,
            total_size_bytes: data.totalSizeBytes,
            total_size_formatted: data.totalSizeFormatted,
            average_file_size: data.averageSizeBytes,
            storage_type: data.storageType || "LOCAL",
            storage_path: data.storagePath,
            last_scanned_at: new Date(),
        });

        logger.info("Storage stats saved to database");
        return stats;
    } catch (error) {
        logger.error("Error saving storage stats to DB:", error);
        throw error;
    }
}

/**
 * Get storage statistics
 * - If forceRefresh=false, return from DB cache
 * - If forceRefresh=true or no DB cache, scan filesystem and save to DB
 */
async function getStorageStats(forceRefresh = false) {
    try {
        // Try to get from database first (unless force refresh)
        if (!forceRefresh) {
            const dbStats = await getStorageStatsFromDb();
            if (dbStats && dbStats.last_scanned_at) {
                // Get capacity info
                const diskSpace = STORAGE_TYPE === "LOCAL" ? getDiskSpace() : null;
                const storageLimit = STORAGE_TYPE === "LOCAL"
                    ? diskSpace?.total || STORAGE_LIMIT_BYTES
                    : STORAGE_LIMIT_BYTES;
                // Calculate usage
                const usedBytes = parseInt(dbStats.total_size_bytes || 0);
                const totalDiskUsed = diskSpace ? (diskSpace.total - diskSpace.free) : usedBytes;
                const otherUsedBytes = Math.max(0, totalDiskUsed - usedBytes);

                return {
                    totalSongs: dbStats.total_songs,
                    filesOnDisk: dbStats.total_songs,
                    totalSizeBytes: usedBytes,
                    totalSizeFormatted: dbStats.total_size_formatted,
                    averageSizeBytes: parseInt(dbStats.average_file_size),
                    averageSizeFormatted: formatBytes(parseInt(dbStats.average_file_size)),
                    storageType: dbStats.storage_type || STORAGE_TYPE,
                    storagePath: dbStats.storage_path || SONGS_STORAGE_PATH,
                    // Capacity info
                    capacity: {
                        limitBytes: storageLimit,
                        limitFormatted: formatBytes(storageLimit),

                        // Music usage
                        usedBytes: usedBytes,
                        usedFormatted: dbStats.total_size_formatted,
                        usagePercent: storageLimit > 0 ? (usedBytes / storageLimit) * 100 : 0,

                        // Other system usage (for local disk)
                        otherUsedBytes: otherUsedBytes,
                        otherUsedFormatted: formatBytes(otherUsedBytes),
                        otherUsagePercent: storageLimit > 0 ? (otherUsedBytes / storageLimit) * 100 : 0,

                        freeBytes: storageLimit - totalDiskUsed,
                        freeFormatted: formatBytes(storageLimit - totalDiskUsed),

                        diskTotal: diskSpace?.total || 0,
                        diskTotalFormatted: formatBytes(diskSpace?.total || 0),
                        diskFree: diskSpace?.free || 0,
                        diskFreeFormatted: formatBytes(diskSpace?.free || 0),
                    },
                    fromCache: true,
                    fromDatabase: true,
                    lastScannedAt: dbStats.last_scanned_at.toISOString(),
                };
            }
        }

        // Perform fresh scan
        let scanResult;

        if (STORAGE_TYPE === "LOCAL") {
            scanResult = await scanStorageDirectory();
        } else {
            // For R2/S3, scanning is expensive/slow.
            // For now, we fallback to DB stats or estimations
            // Todo: Implement S3 inventory/metrics based stats
            scanResult = {
                totalSize: 0, // Should come from DB sum(size)
                fileCount: 0,
                formatted: "Unknown",
                averageSize: 0,
                averageFormatted: "0 Bytes",
                originalSize: 0,
                originalSizeFormatted: "0 Bytes",
                originalFiles: 0,
                hlsSize: 0,
                hlsSizeFormatted: "0 Bytes",
                hlsFiles: 0,
            };
        }

        const totalSongsInDb = await Song.count();

        // Get capacity info
        const diskSpace = STORAGE_TYPE === "LOCAL" ? getDiskSpace() : null;
        const storageLimit = STORAGE_TYPE === "LOCAL"
            ? diskSpace?.total || STORAGE_LIMIT_BYTES
            : STORAGE_LIMIT_BYTES;

        const stats = {
            totalSongs: totalSongsInDb,
            filesOnDisk: scanResult.fileCount,
            totalSizeBytes: scanResult.totalSize,
            totalSizeFormatted: scanResult.formatted,
            averageSizeBytes: scanResult.averageSize,
            averageSizeFormatted: scanResult.averageFormatted,
            originalSize: scanResult.originalSize,
            originalSizeFormatted: scanResult.originalSizeFormatted,
            originalFiles: scanResult.originalFiles,
            hlsSize: scanResult.hlsSize,
            hlsSizeFormatted: scanResult.hlsSizeFormatted,
            hlsFiles: scanResult.hlsFiles,
            storageType: STORAGE_TYPE,
            storagePath: STORAGE_TYPE === "LOCAL" ? SONGS_STORAGE_PATH : R2_BUCKET_NAME,
        };

        // Save to database for future cache
        await saveStorageStatsToDb(stats);

        // Calculate usage
        const totalDiskUsed = diskSpace ? (diskSpace.total - diskSpace.free) : scanResult.totalSize;
        const otherUsedBytes = Math.max(0, totalDiskUsed - scanResult.totalSize);

        return {
            ...stats,
            // Capacity info
            capacity: {
                limitBytes: storageLimit,
                limitFormatted: formatBytes(storageLimit),

                // Music usage
                usedBytes: scanResult.totalSize,
                usedFormatted: scanResult.formatted,
                usagePercent: storageLimit > 0 ? (scanResult.totalSize / storageLimit) * 100 : 0,

                // Other system usage
                otherUsedBytes: otherUsedBytes,
                otherUsedFormatted: formatBytes(otherUsedBytes),
                otherUsagePercent: storageLimit > 0 ? (otherUsedBytes / storageLimit) * 100 : 0,

                freeBytes: storageLimit - totalDiskUsed,
                freeFormatted: formatBytes(storageLimit - totalDiskUsed),

                diskTotal: diskSpace?.total || 0,
                diskTotalFormatted: formatBytes(diskSpace?.total || 0),
                diskFree: diskSpace?.free || 0,
                diskFreeFormatted: formatBytes(diskSpace?.free || 0),
            },
            fromCache: false,
            fromDatabase: false,
            lastScannedAt: new Date().toISOString(),
        };
    } catch (error) {
        logger.error("Error getting storage stats:", error);
        throw error;
    }
}

/**
 * Update storage stats when songs are added/deleted
 * Call this function after uploading or deleting songs
 */
async function updateStorageStats() {
    try {
        logger.info("Updating storage stats after song change...");
        return await getStorageStats(true); // Force refresh
    } catch (error) {
        logger.error("Error updating storage stats:", error);
    }
}

/**
 * Get database statistics
 */
async function getDatabaseStats() {
    try {
        const { sequelize } = require("../models");

        // Get table sizes (MySQL specific)
        const results = await sequelize.query(`
            SELECT 
                table_name AS tableName,
                ROUND(((data_length + index_length) / 1024 / 1024), 2) AS sizeMB,
                table_rows AS rowCount
            FROM information_schema.TABLES 
            WHERE table_schema = DATABASE()
            ORDER BY (data_length + index_length) DESC
        `, { type: sequelize.QueryTypes.SELECT });

        logger.info(`[DEBUG] Database stats query results: ${JSON.stringify(results)}`);

        if (!results || results.length === 0) {
            logger.warn("[DEBUG] No tables found or empty result set.");
        }

        const totalSizeMB = results.reduce((acc, t) => acc + parseFloat(t.sizeMB || 0), 0);

        return {
            tables: results.map(r => ({
                name: r.tableName,
                sizeMB: parseFloat(r.sizeMB) || 0,
                rowCount: parseInt(r.rowCount) || 0,
            })),
            totalSizeMB: Math.round(totalSizeMB * 100) / 100,
            totalSizeFormatted: formatBytes(totalSizeMB * 1024 * 1024),
        };
    } catch (error) {
        logger.error("Error getting database stats:", error);
        return {
            tables: [],
            totalSizeMB: 0,
            totalSizeFormatted: "Unknown",
            error: error.message,
        };
    }
}

/**
 * Upload file to R2
 */
async function uploadToR2(filePath, key) {
    if (STORAGE_TYPE !== "CLOUDFLARE_R2") return null;

    try {
        const fileStream = fs.createReadStream(filePath);
        const upload = new Upload({
            client: r2Client,
            params: {
                Bucket: R2_BUCKET_NAME,
                Key: key,
                Body: fileStream,
                ContentType: getContentType(filePath),
            },
        });

        await upload.done();

        // Return full public URL
        return `${R2_PUBLIC_URL}/${key}`;
    } catch (error) {
        logger.error(`Error uploading to R2 (${key}):`, error);
        throw error;
    }
}

/**
 * Delete file from R2
 */
async function deleteFromR2(key) {
    if (STORAGE_TYPE !== "CLOUDFLARE_R2") return;

    try {
        const command = new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        });

        await r2Client.send(command);
    } catch (error) {
        logger.error(`Error deleting from R2 (${key}):`, error);
        // Don't throw, just log
    }
}

/**
 * Delete directory (prefix) from R2
 * Used for deleting HLS folder for a song
 */
async function deleteFolderFromR2(prefix) {
    if (STORAGE_TYPE !== "CLOUDFLARE_R2") return;

    try {
        // List objects with prefix
        const { ListObjectsV2Command } = require("@aws-sdk/client-s3");
        const listCommand = new ListObjectsV2Command({
            Bucket: R2_BUCKET_NAME,
            Prefix: prefix,
        });

        const listedObjects = await r2Client.send(listCommand);

        if (!listedObjects.Contents || listedObjects.Contents.length === 0) return;

        // Delete objects
        const deleteParams = {
            Bucket: R2_BUCKET_NAME,
            Delete: { Objects: [] },
        };

        listedObjects.Contents.forEach(({ Key }) => {
            deleteParams.Delete.Objects.push({ Key });
        });

        const { DeleteObjectsCommand } = require("@aws-sdk/client-s3");
        const deleteCommand = new DeleteObjectsCommand(deleteParams);
        await r2Client.send(deleteCommand);

        if (listedObjects.IsTruncated) await deleteFolderFromR2(prefix);
    } catch (error) {
        logger.error(`Error deleting folder from R2 (${prefix}):`, error);
    }
}

function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.m3u8') return 'application/vnd.apple.mpegurl';
    if (ext === '.ts') return 'video/mp2t';
    if (ext === '.mp3') return 'audio/mpeg';
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
    if (ext === '.png') return 'image/png';
    return 'application/octet-stream';
}

module.exports = {
    getStorageStats,
    getDatabaseStats,
    updateStorageStats,
    formatBytes,
    uploadToR2,
    deleteFromR2,
    deleteFolderFromR2,
};
