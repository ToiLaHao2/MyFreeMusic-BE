// Song Service - Business Logic Layer
// Contains all business logic for song management

const songRepository = require("../repositories/song.repository");
const artistRepository = require("../repositories/artist.repository");
const genreRepository = require("../repositories/genre.repository");
const fingerprintService = require("./fingerprint.service");
const storageService = require("./storage.service");
const { convertToHLS } = require("../util/hlsHelper");
const { downloadYoutubeAudio } = require("../util/youtubeHelpers");
const storage = require("../util/storage");
const fs = require("fs");
const path = require("path");
const playlistService = require("./playlist.service");
const { R2_PUBLIC_URL } = require("../config/r2.config");
const STORAGE_TYPE = process.env.STORAGE_TYPE || "LOCAL";

/**
 * Lấy tất cả bài hát
 */
async function getAllSongs() {
    return await songRepository.findAll();
}

/**
 * Lấy bài hát theo ID
 */
async function getSongById(id) {
    const song = await songRepository.findById(id);
    if (!song) {
        throw new Error("Bài hát không tồn tại.");
    }
    return song;
}

/**
 * Tạo slug từ title
 */
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

/**
 * Validate file upload
 */
function validateFile(file, allowedTypes, maxSize) {
    if (!allowedTypes.includes(file.mimetype)) {
        return { valid: false, error: "File không hợp lệ." };
    }
    if (file.size > maxSize) {
        return { valid: false, error: "File quá lớn." };
    }
    return { valid: true };
}

/**
 * Thêm bài hát từ thiết bị (với duplicate detection)
 */
async function addSongFromDevice(data, songFile, coverFile, options = {}) {
    const { songTitle, songGenreId, songArtistId, songArtistName } = data;
    const { skipDuplicateCheck = false } = options;

    // Validate files
    if (!songFile || !coverFile) {
        throw new Error("Thiếu file bài hát hoặc ảnh bìa.");
    }

    const allowedAudioTypes = ["audio/mpeg", "audio/mp3"];
    const allowedImageTypes = ["image/jpeg", "image/png"];

    const audioValidation = validateFile(songFile, allowedAudioTypes, 20 * 1024 * 1024);
    if (!audioValidation.valid) {
        throw new Error("File audio không hợp lệ (chỉ nhận .mp3, tối đa 20MB)");
    }

    const imageValidation = validateFile(coverFile, allowedImageTypes, 5 * 1024 * 1024);
    if (!imageValidation.valid) {
        throw new Error("File ảnh bìa không hợp lệ (chỉ nhận .jpg/.png, tối đa 5MB)");
    }

    // Handle artist: find by ID, or find/create by name
    let finalArtistId = songArtistId || null;
    if (!finalArtistId && songArtistName) {
        // Try to find artist by name, or create new one
        const artist = await artistRepository.findOrCreate(songArtistName);
        finalArtistId = artist.id;
    }

    // Validate genre exists (optional)
    if (songGenreId) {
        const genre = await genreRepository.findById(songGenreId);
        if (!genre) {
            throw new Error("Thể loại không tồn tại.");
        }
    }

    // ==========================================
    // P1-11: Fingerprint Duplicate Check
    // ==========================================
    let fingerprint = null;
    let duration = null;

    if (!skipDuplicateCheck) {
        const duplicateCheck = await fingerprintService.checkDuplicate(
            "DEVICE",
            songFile.path,
            null
        );

        if (duplicateCheck.isDuplicate) {
            // Clean up uploaded files
            if (fs.existsSync(songFile.path)) fs.unlinkSync(songFile.path);
            if (fs.existsSync(coverFile.path)) fs.unlinkSync(coverFile.path);

            return {
                isDuplicate: true,
                existingSong: duplicateCheck.existingSong,
                reason: duplicateCheck.reason,
                message: `Bài hát này có thể đã tồn tại: "${duplicateCheck.existingSong.title}"`,
            };
        }

        // Store fingerprint for new song
        fingerprint = duplicateCheck.fingerprint;
        duration = duplicateCheck.duration;
    }




    // Generate slug from title
    const slug = generateSlug(songTitle);

    // Save cover image using storage abstraction
    const coverUrl = await storage.saveCover(coverFile, slug);

    // Save original audio file and convert to HLS
    let finalFileUrl = "";

    if (STORAGE_TYPE === "CLOUDFLARE_R2") {
        // 1. Upload original to R2
        const originalKey = `original/${slug}.mp3`;
        await storageService.uploadToR2(songFile.path, originalKey);

        // 2. Convert to HLS locally (temp)
        const hlsOutputPath = path.join(storage.LOCAL_PATHS.temp, slug);
        storage.ensureDir(hlsOutputPath);

        await convertToHLS(songFile.path, hlsOutputPath);

        // 3. Upload HLS files to R2
        const hlsFiles = fs.readdirSync(hlsOutputPath);
        for (const file of hlsFiles) {
            const hlsKey = `hls/${slug}/${file}`;
            await storageService.uploadToR2(path.join(hlsOutputPath, file), hlsKey);
        }

        // 4. Set R2 URL
        finalFileUrl = `${R2_PUBLIC_URL}/hls/${slug}/index.m3u8`;

        // 5. Cleanup
        if (fs.existsSync(songFile.path)) fs.unlinkSync(songFile.path);
        if (fs.existsSync(hlsOutputPath)) fs.rmSync(hlsOutputPath, { recursive: true, force: true });

    } else {
        // LOCAL STORAGE FLOW
        storage.saveOriginalAudio(songFile, slug);

        // Convert to HLS
        const hlsOutputPath = storage.getHlsOutputPath(slug);
        await convertToHLS(songFile.path, hlsOutputPath);

        finalFileUrl = storage.getHlsUrl(slug);

        // Clean up temp upload file
        if (fs.existsSync(songFile.path)) fs.unlinkSync(songFile.path);
    }

    // Create song in database with fingerprint
    const newSong = await songRepository.create({
        title: songTitle,
        slug: slug,
        fileUrl: finalFileUrl,
        coverUrl: coverUrl,
        genre_id: songGenreId || null,
        artist_id: finalArtistId,
        source: "DEVICE",
        fingerprint: fingerprint,
        duration_seconds: duration,
        uploaded_by: options.userId
    });

    // P1-28: Auto-add to "Uploads" playlist
    if (options.userId) {
        await playlistService.autoAddSongToUploads(options.userId, newSong.id);
    }

    // Update storage stats after adding song
    storageService.updateStorageStats().catch(err => console.error('Failed to update storage stats:', err));

    return {
        isDuplicate: false,
        song: newSong,
    };
}

/**
 * Extract YouTube ID from URL
 */
function extractYoutubeId(url) {
    const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}

/**
 * Validate YouTube URL
 */
function isValidYoutubeUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be");
    } catch {
        return false;
    }
}

/**
 * Thêm bài hát từ YouTube URL (với duplicate detection)
 */
async function addSongFromYoutube(ytbURL, options = {}) {
    const { skipDuplicateCheck = false } = options;

    if (!ytbURL || !isValidYoutubeUrl(ytbURL)) {
        throw new Error("URL Youtube không hợp lệ.");
    }

    // ==========================================
    // P1-11: YouTube ID Duplicate Check (Fast)
    // ==========================================
    const youtubeId = extractYoutubeId(ytbURL);

    if (!skipDuplicateCheck && youtubeId) {
        const ytDuplicate = await fingerprintService.checkYoutubeDuplicate(ytbURL);
        if (ytDuplicate) {
            return {
                isDuplicate: true,
                existingSong: ytDuplicate.existingSong,
                reason: "YOUTUBE_ID_MATCH",
                message: `Bài hát từ YouTube này đã tồn tại: "${ytDuplicate.existingSong.title}"`,
            };
        }
    }

    // Fetch metadata from noembed
    const response = await fetch(`https://noembed.com/embed?url=${ytbURL}`);
    if (!response.ok) {
        throw new Error("Lỗi khi lấy thông tin từ Youtube.");
    }

    const infoJson = await response.json();
    if (!infoJson?.title || !infoJson?.thumbnail_url) {
        throw new Error("Dữ liệu trả về không đầy đủ từ YouTube.");
    }

    const { title, thumbnail_url } = infoJson;

    // Download audio from YouTube
    const filePath = await downloadYoutubeAudio(ytbURL);
    if (!filePath) {
        throw new Error("Không thể tải bài hát từ YouTube.");
    }

    // ==========================================
    // P1-11: Fingerprint Check (after download)
    // ==========================================
    let fingerprint = null;
    let duration = null;

    if (!skipDuplicateCheck) {
        const duplicateCheck = await fingerprintService.checkDuplicate(
            "YOUTUBE",
            filePath,
            ytbURL
        );

        if (duplicateCheck.isDuplicate && duplicateCheck.reason === "FINGERPRINT_MATCH") {
            // Clean up downloaded file
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

            return {
                isDuplicate: true,
                existingSong: duplicateCheck.existingSong,
                reason: duplicateCheck.reason,
                message: `Bài hát này có thể đã tồn tại: "${duplicateCheck.existingSong.title}"`,
            };
        }

        fingerprint = duplicateCheck.fingerprint;
        duration = duplicateCheck.duration;
    }

    // Generate slug from title
    const slug = generateSlug(title);


    // Save original file and convert to HLS
    let finalFileUrl = "";

    if (STORAGE_TYPE === "CLOUDFLARE_R2") {
        // 1. Upload original to R2
        const originalKey = `original/${slug}.mp3`;
        await storageService.uploadToR2(filePath, originalKey);

        // 2. Convert to HLS locally (temp)
        const hlsOutputPath = path.join(storage.LOCAL_PATHS.temp, slug);
        storage.ensureDir(hlsOutputPath);

        await convertToHLS(filePath, hlsOutputPath);

        // 3. Upload HLS files to R2
        const hlsFiles = fs.readdirSync(hlsOutputPath);
        for (const file of hlsFiles) {
            const hlsKey = `hls/${slug}/${file}`;
            await storageService.uploadToR2(path.join(hlsOutputPath, file), hlsKey);
        }

        // 4. Set R2 URL
        finalFileUrl = `${R2_PUBLIC_URL}/hls/${slug}/index.m3u8`;

        // 5. Cleanup
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        if (fs.existsSync(hlsOutputPath)) fs.rmSync(hlsOutputPath, { recursive: true, force: true });

    } else {
        // LOCAL STORAGE FLOW
        storage.ensureDir(storage.PATHS.original);
        const originalFilePath = path.join(storage.PATHS.original, `${slug}.mp3`);
        fs.copyFileSync(filePath, originalFilePath);

        // Convert to HLS
        const hlsOutputPath = storage.getHlsOutputPath(slug);
        await convertToHLS(filePath, hlsOutputPath);

        // Clean up temp downloaded file
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        finalFileUrl = storage.getHlsUrl(slug);
    }

    // Save cover using storage abstraction
    const coverUrl = await storage.saveCoverFromUrl(thumbnail_url, slug);

    // Create song with fingerprint and youtube_id
    const newSong = await songRepository.create({
        title: title,
        slug: slug,
        fileUrl: finalFileUrl,
        coverUrl: coverUrl,
        source: "YOUTUBE",
        youtube_id: youtubeId,
        fingerprint: fingerprint,
        duration_seconds: duration,
        uploaded_by: options.userId
    });

    // P1-28: Auto-add to "Uploads" playlist
    if (options.userId) {
        await playlistService.autoAddSongToUploads(options.userId, newSong.id);
    }

    // Update storage stats after adding song
    storageService.updateStorageStats().catch(err => console.error('Failed to update storage stats:', err));

    return {
        isDuplicate: false,
        song: newSong,
    };
}

/**
 * Cập nhật bài hát
 */
async function updateSong(id, data) {
    const song = await songRepository.findById(id);
    if (!song) {
        throw new Error("Bài hát không tồn tại.");
    }

    await songRepository.update(id, data);
    return await songRepository.findById(id);
}

/**
 * Xóa bài hát
 */
async function deleteSong(id) {
    const song = await songRepository.findById(id);
    if (!song) {
        throw new Error("Bài hát không tồn tại.");
    }

    // Delete HLS files from storage
    if (song.slug) {
        if (STORAGE_TYPE === "CLOUDFLARE_R2") {
            // Delete original
            await storageService.deleteFromR2(`original/${song.slug}.mp3`);
            // Delete HLS folder
            await storageService.deleteFolderFromR2(`hls/${song.slug}/`);
        } else {
            // Local delete (todo: implement if needed, or rely on manual cleanup)
        }
    }

    // TODO: Delete cover from Cloudinary

    await songRepository.remove(id);

    // Update storage stats after deleting song
    storageService.updateStorageStats().catch(err => console.error('Failed to update storage stats:', err));

    return { success: true };
}

/**
 * Tìm bài hát theo tên
 */
async function searchSongsByName(name) {
    return await songRepository.findByName(name);
}

/**
 * Lọc bài hát theo artist
 */
async function getSongsByArtist(artistId) {
    return await songRepository.findByArtistId(artistId);
}

/**
 * Lọc bài hát theo genre
 */
async function getSongsByGenre(genreId) {
    return await songRepository.findByGenreId(genreId);
}

module.exports = {
    getAllSongs,
    getSongById,
    addSongFromDevice,
    addSongFromYoutube,
    updateSong,
    deleteSong,
    searchSongsByName,
    getSongsByArtist,
    getSongsByGenre,
};
