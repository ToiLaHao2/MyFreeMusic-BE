const express = require("express");
const router = express.Router();
const playlistController = require("../controllers/playlist.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// All routes require auth
router.use(authMiddleware);

router.get("/", playlistController.getMyPlaylists);
router.post("/", playlistController.createPlaylist);
// Sharing endpoints
router.get("/community", playlistController.getCommunityPlaylists); // Defined BEFORE /:id
router.get("/shared", playlistController.getSharedPlaylists);
router.post("/:id/share", playlistController.sharePlaylist);
router.delete("/:id/share/:userId", playlistController.unsharePlaylist);
router.post("/:id/like", playlistController.toggleLike);

const upload = require("../middlewares/upload.middleware");

router.get("/:id", playlistController.getPlaylistById);
router.put("/:id", upload.single('cover'), playlistController.updatePlaylist);
router.delete("/:id", playlistController.deletePlaylist);

router.post("/:id/songs", playlistController.addSong);
router.delete("/:id/songs/:songId", playlistController.removeSong);
router.put("/:id/songs/reorder", playlistController.reorderSongs);

module.exports = router;
