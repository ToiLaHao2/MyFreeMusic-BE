// Song Controller - HTTP Handling Layer
// Only handles HTTP request/response, delegates logic to service

const songService = require("../services/song.service");
const logger = require("../util/logger");
const { sendError, sendSuccess } = require("../util/response");

/**
 * Thêm bài hát mới từ thiết bị
 */
async function AddNewSongFromDevice(req, res) {
    try {
        const { songTitle, songGenreId, songArtistId, skipDuplicateCheck } = req.body;
        const songFile = req.files?.songFile?.[0];
        const songCover = req.files?.songCover?.[0];

        const result = await songService.addSongFromDevice(
            { songTitle, songGenreId, songArtistId },
            songFile,
            songCover,
            { skipDuplicateCheck: skipDuplicateCheck === "true" }
        );

        // Handle duplicate detection
        if (result.isDuplicate) {
            return sendSuccess(res, 200, {
                isDuplicate: true,
                message: result.message,
                existingSong: result.existingSong,
                reason: result.reason,
            });
        }

        return sendSuccess(res, 201, {
            isDuplicate: false,
            message: "Thêm bài hát thành công.",
            song: result.song,
        });
    } catch (error) {
        logger.error("Lỗi khi thêm bài hát từ thiết bị:", error);
        return sendError(res, 400, error.message);
    }
}

/**
 * Thêm bài hát từ YouTube URL
 */
async function AddNewSongFromYtUrl(req, res) {
    try {
        const { ytbURL, skipDuplicateCheck } = req.body;
        const result = await songService.addSongFromYoutube(ytbURL, {
            skipDuplicateCheck: skipDuplicateCheck === true,
        });

        // Handle duplicate detection
        if (result.isDuplicate) {
            return sendSuccess(res, 200, {
                isDuplicate: true,
                message: result.message,
                existingSong: result.existingSong,
                reason: result.reason,
            });
        }

        return sendSuccess(res, 201, {
            isDuplicate: false,
            message: "Thêm bài hát từ Youtube thành công.",
            song: result.song,
        });
    } catch (error) {
        logger.error("Lỗi khi thêm bài hát từ Youtube:", error);
        return sendError(res, 400, error.message);
    }
}


/**
 * Lấy tất cả bài hát
 */
async function GetAllSongs(req, res) {
    try {
        const songs = await songService.getAllSongs();
        return sendSuccess(res, 200, {
            message: "Lấy danh sách bài hát thành công.",
            songs,
        });
    } catch (error) {
        logger.error("Lỗi khi lấy danh sách bài hát:", error);
        return sendError(res, 500, "Lỗi hệ thống.");
    }
}

/**
 * Lấy bài hát theo ID
 */
async function GetSongById(req, res) {
    try {
        const song = await songService.getSongById(req.params.id);
        return sendSuccess(res, 200, {
            message: "Lấy thông tin bài hát thành công.",
            song,
        });
    } catch (error) {
        logger.error("Lỗi khi lấy bài hát theo id:", error);
        const statusCode = error.message.includes("không tồn tại") ? 404 : 500;
        return sendError(res, statusCode, error.message);
    }
}

/**
 * Cập nhật bài hát
 */
async function UpdateSong(req, res) {
    try {
        const song = await songService.updateSong(req.params.id, req.body);
        return sendSuccess(res, 200, {
            message: "Cập nhật bài hát thành công.",
            song,
        });
    } catch (error) {
        logger.error("Lỗi khi cập nhật bài hát:", error);
        const statusCode = error.message.includes("không tồn tại") ? 404 : 500;
        return sendError(res, statusCode, error.message);
    }
}

/**
 * Xóa bài hát
 */
async function DeleteSong(req, res) {
    try {
        await songService.deleteSong(req.params.id);
        return sendSuccess(res, 200, {
            message: "Xóa bài hát thành công.",
        });
    } catch (error) {
        logger.error("Lỗi khi xóa bài hát:", error);
        const statusCode = error.message.includes("không tồn tại") ? 404 : 500;
        return sendError(res, statusCode, error.message);
    }
}

/**
 * Tìm bài hát theo tên
 */
async function FilterSongByName(req, res) {
    try {
        const songs = await songService.searchSongsByName(req.query.name);
        return sendSuccess(res, 200, {
            message: "Lọc bài hát theo tên thành công.",
            songs,
        });
    } catch (error) {
        logger.error("Lỗi khi lọc bài hát theo tên:", error);
        return sendError(res, 500, "Lỗi hệ thống.");
    }
}

/**
 * Lọc bài hát theo nghệ sĩ
 */
async function FilterSongByArtist(req, res) {
    try {
        const songs = await songService.getSongsByArtist(req.query.artistId);
        return sendSuccess(res, 200, {
            message: "Lọc bài hát theo nghệ sĩ thành công.",
            songs,
        });
    } catch (error) {
        logger.error("Lỗi khi lọc bài hát theo nghệ sĩ:", error);
        return sendError(res, 500, "Lỗi hệ thống.");
    }
}

/**
 * Lọc bài hát theo thể loại
 */
async function FilterSongByGenre(req, res) {
    try {
        const songs = await songService.getSongsByGenre(req.query.genreId);
        return sendSuccess(res, 200, {
            message: "Lọc bài hát theo thể loại thành công.",
            songs,
        });
    } catch (error) {
        logger.error("Lỗi khi lọc bài hát theo thể loại:", error);
        return sendError(res, 500, "Lỗi hệ thống.");
    }
}

/**
 * Stream Song (Get HLS URL)
 */
async function StreamSong(req, res) {
    try {
        const song = await songService.getSongById(req.params.id);

        // Construct HLS URL pointing to Streaming Service (Port 4000)
        // song.slug is used to match directory structure: musics/hls/<slug>/index.m3u8
        const streamUrl = `http://localhost:4000/hls/${song.slug}/index.m3u8`;

        return sendSuccess(res, 200, {
            message: "Ready to stream",
            streamUrl,
            song
        });
    } catch (error) {
        logger.error("Error streaming song:", error);
        return sendError(res, 404, error.message);
    }
}

module.exports = {
    AddNewSongFromDevice,
    AddNewSongFromYtUrl,
    GetAllSongs,
    GetSongById,
    UpdateSong,
    DeleteSong,
    FilterSongByName,
    FilterSongByArtist,
    FilterSongByGenre,
    StreamSong
};
