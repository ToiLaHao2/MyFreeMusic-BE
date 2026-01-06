const playlistRepository = require("../repositories/playlist.repository");
const songRepository = require("../repositories/song.repository");
const { PlaylistSong } = require("../models"); // Direct access for bulk ops if needed, or add to repo

async function createPlaylist(userId, data) {
    const { name, description, isPrivate, coverUrl } = data;
    return await playlistRepository.create({
        playlist_name: name,
        playlist_description: description,
        playlist_is_private: isPrivate || false,
        playlist_cover_url: coverUrl,
        user_id: userId,
    });
}

async function getUserPlaylists(userId) {
    return await playlistRepository.findAllByUserId(userId);
}

async function getPlaylistById(id, userId) {
    const playlist = await playlistRepository.findById(id);
    if (!playlist) throw new Error("Playlist not found");

    // Check permission if private
    if (playlist.playlist_is_private && playlist.user_id !== userId) {
        throw new Error("Unauthorized access to private playlist");
    }
    return playlist;
}

async function updatePlaylist(id, userId, data) {
    const playlist = await playlistRepository.findById(id);
    if (!playlist) throw new Error("Playlist not found");
    if (playlist.user_id !== userId) throw new Error("Unauthorized");

    await playlistRepository.update(id, {
        playlist_name: data.name,
        playlist_description: data.description,
        playlist_is_private: data.isPrivate,
        playlist_cover_url: data.coverUrl
    });
    return await playlistRepository.findById(id);
}

async function deletePlaylist(id, userId) {
    const playlist = await playlistRepository.findById(id);
    if (!playlist) throw new Error("Playlist not found");
    if (playlist.user_id !== userId) throw new Error("Unauthorized");

    await playlistRepository.delete(id);
    return { success: true };
}

async function addSongToPlaylist(playlistId, songId, userId) {
    const playlist = await playlistRepository.findById(playlistId);
    if (!playlist) throw new Error("Playlist not found");
    if (playlist.user_id !== userId) throw new Error("Unauthorized");

    const song = await songRepository.findById(songId);
    if (!song) throw new Error("Song not found");

    await playlistRepository.addSong(playlistId, songId);
    return { success: true };
}

async function removeSongFromPlaylist(playlistId, songId, userId) {
    const playlist = await playlistRepository.findById(playlistId);
    if (!playlist) throw new Error("Playlist not found");
    if (playlist.user_id !== userId) throw new Error("Unauthorized");

    await playlistRepository.removeSong(playlistId, songId);
    return { success: true };
}

async function reorderPlaylist(playlistId, userId, songIds) {
    const playlist = await playlistRepository.findById(playlistId);
    if (!playlist) throw new Error("Playlist not found");
    if (playlist.user_id !== userId) throw new Error("Unauthorized");

    // This is a naive implementation. For large playlists, this is heavy.
    // Ideally we update only changed items.
    // For now, we iterate and update 'order' field.

    const updatePromises = songIds.map((songId, index) => {
        return PlaylistSong.update(
            { order: index },
            { where: { playlist_id: playlistId, song_id: songId } }
        );
    });

    await Promise.all(updatePromises);
    return { success: true };
}

/**
 * Finds or creates a system playlist "Uploads" for the user and adds the song.
 */
async function autoAddSongToUploads(userId, songId) {
    // Check if "Uploads" playlist exists
    let playlists = await playlistRepository.findAllByUserId(userId);
    let uploadsPlaylist = playlists.find(p => p.playlist_name === "Uploads");

    if (!uploadsPlaylist) {
        uploadsPlaylist = await playlistRepository.create({
            playlist_name: "Uploads",
            playlist_description: "Bài hát bạn đã tải lên",
            playlist_is_private: true,
            user_id: userId
        });
    }

    await playlistRepository.addSong(uploadsPlaylist.id, songId);
}

module.exports = {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    reorderPlaylist,
    autoAddSongToUploads
};
