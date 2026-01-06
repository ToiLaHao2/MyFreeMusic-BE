const genreRepository = require("../repositories/genre.repository");
const { sendSuccess, sendError } = require("../util/response");

async function getAllGenres(req, res) {
    try {
        const genres = await genreRepository.findAll();
        return sendSuccess(res, 200, {
            genres
        });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

module.exports = {
    getAllGenres
};
