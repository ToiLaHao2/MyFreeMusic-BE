const express = require("express");
const {
    AddNewSongFromDevice,
    AddNewSongFromYtUrl,
    GetAllSongs,
    GetSongById,
    UpdateSong,
    DeleteSong,
    FilterSongByName,
    FilterSongByArtist,
    FilterSongByGenre,
} = require("../controllers/song.controller");

const songRouter = express.Router();

// CRUD
songRouter.get("/", GetAllSongs);
songRouter.get("/:id", GetSongById);
songRouter.post("/addNewSongFromDevice", AddNewSongFromDevice);
songRouter.post("/addNewSongFromYtUrl", AddNewSongFromYtUrl);
songRouter.put("/:id", UpdateSong);
songRouter.delete("/:id", DeleteSong);

// Filters
songRouter.get("/filter/name", FilterSongByName);
songRouter.get("/filter/artist", FilterSongByArtist);
songRouter.get("/filter/genre", FilterSongByGenre);

// Stream
songRouter.get("/stream/:id", require("../controllers/song.controller").StreamSong);

module.exports = songRouter;
