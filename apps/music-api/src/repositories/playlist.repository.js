const { Playlist, PlaylistSong, Song } = require("../models");

const PlaylistRepository = {
    async create(data) {
        return await Playlist.create(data);
    },

    async findById(id) {
        return await Playlist.findByPk(id, {
            include: [
                {
                    model: Song,
                    through: { attributes: ["added_at", "order"] },
                },
            ],
        });
    },

    async findAllByUserId(userId) {
        return await Playlist.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: Song,
                    attributes: ["id", "title", "coverUrl", "duration_seconds", "artist_id"], // Lite info
                    through: { attributes: [] },
                }
            ],
            order: [["createdAt", "DESC"]],
        });
    },

    async update(id, data) {
        return await Playlist.update(data, { where: { id } });
    },

    async delete(id) {
        return await Playlist.destroy({ where: { id } });
    },

    async addSong(playlistId, songId) {
        // Check if exists
        const exists = await PlaylistSong.findOne({ where: { playlist_id: playlistId, song_id: songId } });
        if (exists) return exists;

        return await PlaylistSong.create({
            playlist_id: playlistId,
            song_id: songId,
            order: 0, // Default to top or bottom? Logic in service
        });
    },

    async removeSong(playlistId, songId) {
        return await PlaylistSong.destroy({ where: { playlist_id: playlistId, song_id: songId } });
    },

    async countSongs(playlistId) {
        return await PlaylistSong.count({ where: { playlist_id: playlistId } });
    }
};

module.exports = PlaylistRepository;
