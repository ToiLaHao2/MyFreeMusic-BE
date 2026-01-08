const playlistService = require("../services/playlist.service");
const { sendSuccess, sendError } = require("../util/response");

async function createPlaylist(req, res) {
    try {
        const result = await playlistService.createPlaylist(req.user_id, req.body);
        return sendSuccess(res, "Playlist created successfully", { playlist: result });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

async function getMyPlaylists(req, res) {
    try {
        const result = await playlistService.getUserPlaylists(req.user_id);
        return sendSuccess(res, "Playlists fetched successfully", { playlists: result });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

async function getPlaylistById(req, res) {
    try {
        const result = await playlistService.getPlaylistById(req.params.id, req.user_id);
        return sendSuccess(res, "Playlist fetched successfully", { playlist: result });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

async function updatePlaylist(req, res) {
    try {
        const result = await playlistService.updatePlaylist(req.params.id, req.user_id, req.body);
        return sendSuccess(res, result, "Playlist updated");
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

async function deletePlaylist(req, res) {
    try {
        const result = await playlistService.deletePlaylist(req.params.id, req.user_id);
        return sendSuccess(res, result, "Playlist deleted");
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

async function addSong(req, res) {
    try {
        const { songId } = req.body;
        const result = await playlistService.addSongToPlaylist(req.params.id, songId, req.user_id);
        return sendSuccess(res, result, "Song added to playlist");
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

async function removeSong(req, res) {
    try {
        const { songId } = req.params;
        const result = await playlistService.removeSongFromPlaylist(req.params.id, songId, req.user_id);
        return sendSuccess(res, result, "Song removed from playlist");
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

async function reorderSongs(req, res) {
    try {
        const { songIds } = req.body; // Expect array of songIds in new order
        if (!Array.isArray(songIds)) throw new Error("Invalid format. Expected list of songIds.");

        await playlistService.reorderPlaylist(req.params.id, req.user_id, songIds);
        return sendSuccess(res, null, "Playlist reordered");
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

module.exports = {
    createPlaylist,
    getMyPlaylists,
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
    addSong,
    removeSong,
    reorderSongs
};
