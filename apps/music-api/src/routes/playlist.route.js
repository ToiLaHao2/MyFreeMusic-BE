const express = require("express");
const router = express.Router();
const playlistController = require("../controllers/playlist.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// All routes require auth
router.use(authMiddleware);

router.get("/", playlistController.getMyPlaylists);
router.post("/", playlistController.createPlaylist);
router.get("/:id", playlistController.getPlaylistById);
router.put("/:id", playlistController.updatePlaylist);
router.delete("/:id", playlistController.deletePlaylist);

router.post("/:id/songs", playlistController.addSong);
router.delete("/:id/songs/:songId", playlistController.removeSong);
router.put("/:id/songs/reorder", playlistController.reorderSongs);

module.exports = router;
