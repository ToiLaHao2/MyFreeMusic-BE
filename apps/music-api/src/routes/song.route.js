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
const upload = require("../middlewares/upload.middleware");

const songRouter = express.Router();

// Multer error handler wrapper
const handleUpload = (req, res, next) => {
    console.log("[handleUpload] Starting multer upload...");
    console.log("[handleUpload] Content-Type:", req.headers['content-type']);

    upload.fields([
        { name: 'songFile', maxCount: 1 },
        { name: 'songCover', maxCount: 1 }
    ])(req, res, (err) => {
        console.log("[handleUpload] Multer callback reached");
        console.log("[handleUpload] err:", err);
        console.log("[handleUpload] req.files:", req.files ? Object.keys(req.files) : "NO FILES");
        console.log("[handleUpload] req.body:", req.body);

        if (err) {
            console.error("Multer Error:", err.message);
            return res.status(400).json({
                success: false,
                message: `Upload error: ${err.message}`,
                error: {}
            });
        }
        next();
    });
};

// CRUD
songRouter.get("/", GetAllSongs);
songRouter.get("/:id", GetSongById);
songRouter.post("/addNewSongFromDevice", handleUpload, AddNewSongFromDevice);
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
