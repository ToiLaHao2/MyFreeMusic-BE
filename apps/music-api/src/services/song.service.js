// Song Service - Business Logic Layer
const songRepository = require("../repositories/song.repository");

/**
 * Lấy tất cả bài hát
 */
async function getAllSongs(options = {}) {
    return await songRepository.findAll(options);
}

/**
 * Lấy bài hát theo ID
 */
async function getSongById(id) {
    return await songRepository.findById(id);
}

/**
 * Tạo bài hát mới
 */
async function createSong(songData) {
    // Business logic validation here
    return await songRepository.create(songData);
}

/**
 * Cập nhật bài hát
 */
async function updateSong(id, songData) {
    return await songRepository.update(id, songData);
}

/**
 * Xóa bài hát
 */
async function deleteSong(id) {
    return await songRepository.delete(id);
}

/**
 * Tìm bài hát theo tên
 */
async function filterByName(name) {
    return await songRepository.findByName(name);
}

/**
 * Tìm bài hát theo nghệ sĩ
 */
async function filterByArtist(artistId) {
    return await songRepository.findByArtist(artistId);
}

/**
 * Tìm bài hát theo thể loại
 */
async function filterByGenre(genreId) {
    return await songRepository.findByGenre(genreId);
}

module.exports = {
    getAllSongs,
    getSongById,
    createSong,
    updateSong,
    deleteSong,
    filterByName,
    filterByArtist,
    filterByGenre,
};
