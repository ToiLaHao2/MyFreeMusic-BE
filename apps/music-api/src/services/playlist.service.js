const playlistRepository = require("../repositories/playlist.repository");
const songRepository = require("../repositories/song.repository");
const { PlaylistSong, SharedPlaylist, User, Playlist, Song, Artist, PlaylistLike } = require("../models"); // Direct access for models

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

async function updatePlaylist(id, userId, data, coverFile) {
    const playlist = await playlistRepository.findById(id);
    if (!playlist) throw new Error("Playlist not found");
    if (playlist.user_id !== userId) throw new Error("Unauthorized");

    let coverUrl = data.coverUrl;

    // Handle File Upload
    if (coverFile) {
        // Validate
        const allowedImageTypes = ["image/jpeg", "image/png"];
        if (!allowedImageTypes.includes(coverFile.mimetype)) {
            throw new Error("Invalid cover image format");
        }

        // Generate a simple slug for filename (or use playlist id)
        const slug = `playlist-${id}-${Date.now()}`;

        // Save using storage abstraction (reusing logic from song.service/storage.js)
        const storage = require("../util/storage");
        coverUrl = await storage.saveCover(coverFile, slug);

        // Clean up temp file
        const fs = require("fs");
        if (fs.existsSync(coverFile.path)) fs.unlinkSync(coverFile.path);
    }

    await playlistRepository.update(id, {
        playlist_name: data.name,
        playlist_description: data.description,
        playlist_is_private: data.isPrivate === 'true' || data.isPrivate === true, // Handle string/bool from FormData
        playlist_cover_url: coverUrl
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

/**
 * Share a playlist with another user by email
 */
async function sharePlaylist(playlistId, ownerId, targetEmail, permission = 'VIEW') {
    // 1. Verify ownership
    const playlist = await playlistRepository.findById(playlistId);
    if (!playlist) throw new Error("Playlist not found");
    if (playlist.user_id !== ownerId) throw new Error("Unauthorized");

    // 2. Find target user
    const targetUser = await User.findOne({ where: { user_email: targetEmail } });
    if (!targetUser) throw new Error("User with this email not found");
    if (targetUser.id === ownerId) throw new Error("Cannot share with yourself");

    // 3. Create or update share record
    const [shareRecord, created] = await SharedPlaylist.findOrCreate({
        where: {
            playlist_id: playlistId,
            shared_with_user_id: targetUser.id
        },
        defaults: {
            permission: permission
        }
    });

    if (!created) {
        shareRecord.permission = permission;
        await shareRecord.save();
    }

    return { success: true, message: `Playlist shared with ${targetEmail}` };
}

/**
 * Remove share from a user
 */
async function unsharePlaylist(playlistId, ownerId, targetUserId) {
    // 1. Verify ownership
    const playlist = await playlistRepository.findById(playlistId);
    if (!playlist) throw new Error("Playlist not found");
    if (playlist.user_id !== ownerId) throw new Error("Unauthorized");

    // 2. Delete share record
    await SharedPlaylist.destroy({
        where: {
            playlist_id: playlistId,
            shared_with_user_id: targetUserId
        }
    });

    return { success: true };
}

/**
 * Get playlists shared with me
 */
async function getSharedPlaylists(userId) {
    const sharedRecords = await SharedPlaylist.findAll({
        where: { shared_with_user_id: userId },
        include: [
            {
                model: Playlist,
                as: 'playlist',
                include: [
                    {
                        model: User, // Owner
                        attributes: ['id', 'user_full_name', 'user_email']
                    }
                ]
            }
        ],
        order: [['createdAt', 'DESC']]
    });

    // Transform to friendly format
    return sharedRecords.map(record => {
        if (!record.playlist) return null; // Handle if playlist deleted
        const playlistJson = record.playlist.toJSON();
        return {
            ...playlistJson,
            permission: record.permission,
            shared_from: playlistJson.User // Access via JSON structure
        };
    }).filter(p => p !== null);
}

/**
 * Get Community Playlists (Public)
 */
/**
 * Get Community Playlists (Public)
 */
async function getCommunityPlaylists(currentUserId) {
    const playlists = await Playlist.findAll({
        where: { playlist_is_private: false },
        include: [
            {
                model: User,
                attributes: ['id', 'user_full_name', 'user_profile_picture']
            },
            {
                model: Song,
                attributes: ['id', 'title', 'slug', 'coverUrl', 'duration_seconds'],
                include: [
                    {
                        model: Artist,
                        as: 'artist',
                        attributes: ['id', 'name']
                    }
                ],
                through: { attributes: [] }
            }
        ],
        order: [['createdAt', 'DESC']]
    });

    // Calculate likes for each playlist
    // This could be optimized with a subquery/aggregation in findAll, but for now loop is acceptable for small scale
    const playlistsWithLikes = await Promise.all(playlists.map(async (p) => {
        const likeCount = await PlaylistLike.count({ where: { playlist_id: p.id } });
        let isLiked = false;
        if (currentUserId) {
            const like = await PlaylistLike.findOne({
                where: { playlist_id: p.id, user_id: currentUserId }
            });
            isLiked = !!like;
        }

        return {
            ...p.toJSON(),
            likes: likeCount,
            isLiked: isLiked
        };
    }));

    return playlistsWithLikes;
}

async function toggleLike(userId, playlistId) {
    const playlist = await playlistRepository.findById(playlistId);
    if (!playlist) return { success: false, message: "Playlist not found" };

    // Check internal vs community
    if (playlist.playlist_is_private) return { success: false, message: "Cannot like private playlist" };

    const existingLike = await PlaylistLike.findOne({
        where: { user_id: userId, playlist_id: playlistId }
    });

    if (existingLike) {
        await existingLike.destroy();
        return { success: true, isLiked: false };
    } else {
        await PlaylistLike.create({
            user_id: userId,
            playlist_id: playlistId
        });
        return { success: true, isLiked: true };
    }
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
    autoAddSongToUploads,
    sharePlaylist,
    unsharePlaylist,
    getSharedPlaylists,
    getSharedPlaylists,
    getCommunityPlaylists,
    toggleLike
};
