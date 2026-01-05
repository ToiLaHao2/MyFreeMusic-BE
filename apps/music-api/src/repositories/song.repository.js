// Song Repository - Data Access Layer
const { Song } = require("../models/song.model");
const { Artist } = require("../models/artist.model");
const { Genre } = require("../models/genre.model");
const { Op } = require("sequelize");

/**
 * Lấy tất cả bài hát
 */
async function findAll(options = {}) {
    const { limit, offset, include = true } = options;
    const queryOptions = {
        limit,
        offset,
    };

    if (include) {
        queryOptions.include = [
            { model: Artist, as: "artist" },
            { model: Genre, as: "genre" },
        ];
    }

    return await Song.findAll(queryOptions);
}

/**
 * Lấy bài hát theo ID
 */
async function findById(id) {
    return await Song.findByPk(id, {
        include: [
            { model: Artist, as: "artist" },
            { model: Genre, as: "genre" },
        ],
    });
}

/**
 * Tạo bài hát mới
 */
async function create(songData) {
    return await Song.create(songData);
}

/**
 * Cập nhật bài hát
 */
async function update(id, songData) {
    return await Song.update(songData, { where: { id } });
}

/**
 * Xóa bài hát
 */
async function deleteSong(id) {
    return await Song.destroy({ where: { id } });
}

/**
 * Tìm bài hát theo tên
 */
async function findByName(name) {
    return await Song.findAll({
        where: {
            song_name: { [Op.like]: `%${name}%` },
        },
        include: [
            { model: Artist, as: "artist" },
            { model: Genre, as: "genre" },
        ],
    });
}

/**
 * Tìm bài hát theo nghệ sĩ
 */
async function findByArtist(artistId) {
    return await Song.findAll({
        where: { artist_id: artistId },
        include: [
            { model: Artist, as: "artist" },
            { model: Genre, as: "genre" },
        ],
    });
}

/**
 * Tìm bài hát theo thể loại
 */
async function findByGenre(genreId) {
    return await Song.findAll({
        where: { genre_id: genreId },
        include: [
            { model: Artist, as: "artist" },
            { model: Genre, as: "genre" },
        ],
    });
}

module.exports = {
    findAll,
    findById,
    create,
    update,
    delete: deleteSong,
    findByName,
    findByArtist,
    findByGenre,
};
