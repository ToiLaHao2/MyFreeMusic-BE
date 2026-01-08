const playlistService = require("../services/playlist.service");
const activityService = require("../services/activity.service");
const { sendSuccess, sendError } = require("../util/response");

async function createPlaylist(req, res) {
    try {
        const result = await playlistService.createPlaylist(req.user_id, req.body);

        activityService.logActivity(req.user_id, "PLAYLIST_CREATE", result.id, { name: result.playlist_name }, req);

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
        const coverFile = req.file; // From upload.single('cover')
        const result = await playlistService.updatePlaylist(req.params.id, req.user_id, req.body, coverFile);
        return sendSuccess(res, result, "Playlist updated");
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

async function deletePlaylist(req, res) {
    try {
        const result = await playlistService.deletePlaylist(req.params.id, req.user_id);

        activityService.logActivity(req.user_id, "PLAYLIST_DELETE", req.params.id, null, req);

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

async function sharePlaylist(req, res) {
    try {
        const { email, permission } = req.body;
        const result = await playlistService.sharePlaylist(req.params.id, req.user_id, email, permission);

        activityService.logActivity(req.user_id, "PLAYLIST_SHARE", req.params.id, { email, permission }, req);

        return sendSuccess(res, result.message, null);
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

async function unsharePlaylist(req, res) {
    try {
        const { userId } = req.params;
        await playlistService.unsharePlaylist(req.params.id, req.user_id, userId);

        activityService.logActivity(req.user_id, "PLAYLIST_UNSHARE", req.params.id, { userId }, req);

        return sendSuccess(res, "Sharing removed", null);
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

async function getSharedPlaylists(req, res) {
    try {
        const result = await playlistService.getSharedPlaylists(req.user_id);
        return sendSuccess(res, "Shared playlists fetched", { playlists: result });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

async function getCommunityPlaylists(req, res) {
    try {
        const result = await playlistService.getCommunityPlaylists(req.user_id);
        return sendSuccess(res, "Community playlists fetched", { playlists: result });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

async function toggleLike(req, res) {
    try {
        const result = await playlistService.toggleLike(req.user_id, req.params.id);
        if (!result.success) return sendError(res, 400, result.message);
        return sendSuccess(res, "Toggle like success", result);
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
    reorderSongs,
    sharePlaylist,
    unsharePlaylist,
    getSharedPlaylists,
    getSharedPlaylists,
    getCommunityPlaylists,
    toggleLike
};
