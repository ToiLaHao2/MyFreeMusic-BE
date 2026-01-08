const { Favorite, Song, Artist, Genre } = require('../models');

/**
 * Add a song to favorites
 */
const addFavorite = async (userId, songId) => {
    // Check if song exists
    const song = await Song.findByPk(songId);
    if (!song) {
        throw new Error("Song not found");
    }

    // Check if already favorite
    const existing = await Favorite.findOne({
        where: { user_id: userId, song_id: songId }
    });

    if (existing) {
        return existing; // Already liked
    }

    const favorite = await Favorite.create({
        user_id: userId,
        song_id: songId
    });

    return favorite;
};

/**
 * Remove a song from favorites
 */
const removeFavorite = async (userId, songId) => {
    const deleted = await Favorite.destroy({
        where: { user_id: userId, song_id: songId }
    });
    return deleted;
};

/**
 * Get user favorites
 */
const getFavorites = async (userId) => {
    // We want to return the actual Songs, not just the Favorite entries
    const favorites = await Favorite.findAll({
        where: { user_id: userId },
        include: [
            {
                model: Song,
                as: 'song',
                include: [
                    { model: Artist, as: 'artist' },
                    { model: Genre, as: 'genre' }
                ]
            }
        ],
        order: [['createdAt', 'DESC']]
    });

    // Map to just return the Song objects (with an extra isLiked: true property if needed)
    return favorites.map(f => ({
        ...f.song.toJSON(),
        likedAt: f.createdAt
    }));
};

/**
 * Check if specific songs are liked by user
 */
const checkFavorites = async (userId, songIds) => {
    // ensure songIds is array
    if (!Array.isArray(songIds)) songIds = [songIds];

    const favorites = await Favorite.findAll({
        where: {
            user_id: userId,
            song_id: songIds
        },
        attributes: ['song_id']
    });

    return favorites.map(f => f.song_id);
};

module.exports = {
    addFavorite,
    removeFavorite,
    getFavorites,
    checkFavorites
};
