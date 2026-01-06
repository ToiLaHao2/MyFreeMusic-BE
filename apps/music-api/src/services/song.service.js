// Song Service - Business Logic Layer
// Contains all business logic for song management

const songRepository = require("../repositories/song.repository");
const artistRepository = require("../repositories/artist.repository");
const genreRepository = require("../repositories/genre.repository");
const fingerprintService = require("./fingerprint.service");
const cloudinary = require("../config/cloudinary.config");
const { convertToHLS } = require("../util/hlsHelper");
const { downloadYoutubeAudio } = require("../util/youtubeHelpers");
const fs = require("fs");
const path = require("path");

const SONGS_STORAGE_PATH = path.join(__dirname, "..", "..", "songs-storage");

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
    const { songTitle, songGenreId, songArtistId } = data;
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

    // Validate artist & genre exist (optional)
    if (songArtistId) {
        const artist = await artistRepository.findById(songArtistId);
        if (!artist) {
            throw new Error("Nghệ sĩ không tồn tại.");
        }
    }

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

    // Upload cover to Cloudinary
    const cloudinaryResult = await cloudinary.uploader.upload(coverFile.path, {
        folder: "music_app/covers",
    });
    fs.unlinkSync(coverFile.path);

    // Convert to HLS
    const slug = generateSlug(songTitle);
    const hlsOutputPath = path.join(SONGS_STORAGE_PATH, "hls", slug);
    await convertToHLS(songFile.path, hlsOutputPath);

    // Create song in database with fingerprint
    const newSong = await songRepository.create({
        title: songTitle,
        slug: slug,
        fileUrl: `${hlsOutputPath}/index.m3u8`,
        coverUrl: cloudinaryResult.secure_url,
        genre_id: songGenreId || null,
        artist_id: songArtistId || null,
        source: "DEVICE",
        fingerprint: fingerprint,
        duration_seconds: duration,
    });

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

    // Convert to HLS
    const slug = generateSlug(title);
    const hlsOutputPath = path.join(SONGS_STORAGE_PATH, "hls", slug);
    await convertToHLS(filePath, hlsOutputPath);

    // Upload thumbnail to Cloudinary
    const cloudinaryResult = await cloudinary.uploader.upload(thumbnail_url, {
        folder: "music_app/covers",
    });

    // Create song with fingerprint and youtube_id
    const newSong = await songRepository.create({
        title: title,
        slug: slug,
        fileUrl: `${hlsOutputPath}/index.m3u8`,
        coverUrl: cloudinaryResult.secure_url,
        source: "YOUTUBE",
        youtube_id: youtubeId,
        fingerprint: fingerprint,
        duration_seconds: duration,
    });

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

    // TODO: Delete HLS files from storage
    // TODO: Delete cover from Cloudinary

    await songRepository.remove(id);
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
