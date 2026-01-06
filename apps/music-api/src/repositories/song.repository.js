// Song Repository - Data Access Layer
// Only CRUD operations, NO business logic

const { Song } = require("../models/song.model");
const { Artist } = require("../models/artist.model");
const { Genre } = require("../models/genre.model");
const { Op } = require("sequelize");

const defaultIncludes = [
    { model: Genre, as: "genre", attributes: ["id", "name"] },
    { model: Artist, as: "artist", attributes: ["id", "name"] },
];

/**
 * Lấy tất cả bài hát
 */
async function findAll(options = {}) {
    return await Song.findAll({
        include: defaultIncludes,
        ...options,
    });
}

/**
 * Lấy bài hát theo ID
 */
async function findById(id) {
    return await Song.findOne({
        where: { id },
        include: defaultIncludes,
    });
}

/**
 * Lấy bài hát theo slug
 */
async function findBySlug(slug) {
    return await Song.findOne({
        where: { slug },
        include: defaultIncludes,
    });
}

/**
 * Tạo bài hát mới
 */
async function create(data) {
    return await Song.create(data);
}

/**
 * Cập nhật bài hát
 */
async function update(id, data) {
    return await Song.update(data, { where: { id } });
}

/**
 * Xóa bài hát
 */
async function remove(id) {
    return await Song.destroy({ where: { id } });
}

/**
 * Tìm bài hát theo tên (LIKE search)
 */
async function findByName(name) {
    return await Song.findAll({
        where: { title: { [Op.like]: `%${name}%` } },
        include: defaultIncludes,
    });
}

/**
 * Lấy bài hát theo artist_id
 */
async function findByArtistId(artistId) {
    return await Song.findAll({
        where: { artist_id: artistId },
        include: defaultIncludes,
    });
}

/**
 * Lấy bài hát theo genre_id
 */
async function findByGenreId(genreId) {
    return await Song.findAll({
        where: { genre_id: genreId },
        include: defaultIncludes,
    });
}

/**
 * Tìm bài hát theo YouTube ID
 */
async function findByYoutubeId(youtubeId) {
    return await Song.findOne({
        where: { youtube_id: youtubeId },
        include: defaultIncludes,
    });
}

/**
 * Tìm bài hát có duration tương tự (để pre-filter trước khi compare fingerprint)
 */
async function findBySimilarDuration(duration, toleranceSeconds = 5) {
    return await Song.findAll({
        where: {
            duration_seconds: {
                [Op.between]: [duration - toleranceSeconds, duration + toleranceSeconds],
            },
            fingerprint: { [Op.not]: null },
        },
        attributes: ["id", "title", "fingerprint", "duration_seconds"],
    });
}

module.exports = {
    findAll,
    findById,
    findBySlug,
    create,
    update,
    remove,
    findByName,
    findByArtistId,
    findByGenreId,
    findByYoutubeId,
    findBySimilarDuration,
};
