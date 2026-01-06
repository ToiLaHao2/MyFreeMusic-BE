// Repositories index - Export all repositories
const songRepository = require("./song.repository");
const userRepository = require("./user.repository");
const artistRepository = require("./artist.repository");
const genreRepository = require("./genre.repository");

module.exports = {
    songRepository,
    userRepository,
    artistRepository,
    genreRepository,
};
