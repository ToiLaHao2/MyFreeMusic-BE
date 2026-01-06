// Artist Controller - HTTP Handling Layer
const artistService = require("../services/artist.service");
const logger = require("../util/logger");
const { sendError, sendSuccess } = require("../util/response");

async function GetAllArtists(req, res) {
    try {
        const artists = await artistService.getAllArtists();
        return sendSuccess(res, 200, { artists });
    } catch (error) {
        logger.error("Lỗi khi lấy danh sách nghệ sĩ:", error);
        return sendError(res, 500, "Lỗi hệ thống.");
    }
}

async function GetArtistById(req, res) {
    try {
        const artist = await artistService.getArtistById(req.params.id);
        return sendSuccess(res, 200, { artist });
    } catch (error) {
        logger.error("Lỗi khi lấy nghệ sĩ:", error);
        const statusCode = error.message.includes("không tồn tại") ? 404 : 500;
        return sendError(res, statusCode, error.message);
    }
}

async function CreateArtist(req, res) {
    try {
        const artist = await artistService.createArtist(req.body);
        return sendSuccess(res, 201, { message: "Tạo nghệ sĩ thành công.", artist });
    } catch (error) {
        logger.error("Lỗi khi tạo nghệ sĩ:", error);
        return sendError(res, 400, error.message);
    }
}

async function UpdateArtist(req, res) {
    try {
        const artist = await artistService.updateArtist(req.params.id, req.body);
        return sendSuccess(res, 200, { message: "Cập nhật nghệ sĩ thành công.", artist });
    } catch (error) {
        logger.error("Lỗi khi cập nhật nghệ sĩ:", error);
        const statusCode = error.message.includes("không tồn tại") ? 404 : 500;
        return sendError(res, statusCode, error.message);
    }
}

async function DeleteArtist(req, res) {
    try {
        await artistService.deleteArtist(req.params.id);
        return sendSuccess(res, 200, { message: "Xóa nghệ sĩ thành công." });
    } catch (error) {
        logger.error("Lỗi khi xóa nghệ sĩ:", error);
        const statusCode = error.message.includes("không tồn tại") ? 404 : 500;
        return sendError(res, statusCode, error.message);
    }
}

module.exports = {
    GetAllArtists,
    GetArtistById,
    CreateArtist,
    UpdateArtist,
    DeleteArtist,
};
