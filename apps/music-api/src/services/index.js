// Services index - Export all services
const songService = require("./song.service");
const userService = require("./user.service");
const authService = require("./auth.service");
const artistService = require("./artist.service");
const genreService = require("./genre.service");

module.exports = {
    songService,
    userService,
    authService,
    artistService,
    genreService,
};
