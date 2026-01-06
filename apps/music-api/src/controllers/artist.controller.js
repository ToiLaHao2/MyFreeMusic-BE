const artistRepository = require("../repositories/artist.repository");
const { sendSuccess, sendError } = require("../util/response");

async function getAllArtists(req, res) {
    try {
        const artists = await artistRepository.findAll();
        return sendSuccess(res, 200, {
            artists
        });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

module.exports = {
    getAllArtists
};
