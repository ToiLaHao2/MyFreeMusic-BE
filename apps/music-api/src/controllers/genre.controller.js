// Genre Controller - HTTP Handling Layer
const genreService = require("../services/genre.service");
const logger = require("../util/logger");
const { sendError, sendSuccess } = require("../util/response");

async function GetAllGenres(req, res) {
    try {
        const genres = await genreService.getAllGenres();
        return sendSuccess(res, 200, { genres });
    } catch (error) {
        logger.error("Lỗi khi lấy danh sách thể loại:", error);
        return sendError(res, 500, "Lỗi hệ thống.");
    }
}

async function GetGenreById(req, res) {
    try {
        const genre = await genreService.getGenreById(req.params.id);
        return sendSuccess(res, 200, { genre });
    } catch (error) {
        logger.error("Lỗi khi lấy thể loại:", error);
        const statusCode = error.message.includes("không tồn tại") ? 404 : 500;
        return sendError(res, statusCode, error.message);
    }
}

async function CreateGenre(req, res) {
    try {
        const genre = await genreService.createGenre(req.body);
        return sendSuccess(res, 201, { message: "Tạo thể loại thành công.", genre });
    } catch (error) {
        logger.error("Lỗi khi tạo thể loại:", error);
        return sendError(res, 400, error.message);
    }
}

async function UpdateGenre(req, res) {
    try {
        const genre = await genreService.updateGenre(req.params.id, req.body);
        return sendSuccess(res, 200, { message: "Cập nhật thể loại thành công.", genre });
    } catch (error) {
        logger.error("Lỗi khi cập nhật thể loại:", error);
        const statusCode = error.message.includes("không tồn tại") ? 404 : 500;
        return sendError(res, statusCode, error.message);
    }
}

async function DeleteGenre(req, res) {
    try {
        await genreService.deleteGenre(req.params.id);
        return sendSuccess(res, 200, { message: "Xóa thể loại thành công." });
    } catch (error) {
        logger.error("Lỗi khi xóa thể loại:", error);
        const statusCode = error.message.includes("không tồn tại") ? 404 : 500;
        return sendError(res, statusCode, error.message);
    }
}

module.exports = {
    GetAllGenres,
    GetGenreById,
    CreateGenre,
    UpdateGenre,
    DeleteGenre,
};
