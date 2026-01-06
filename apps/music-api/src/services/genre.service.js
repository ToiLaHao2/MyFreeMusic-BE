// Genre Service - Business Logic Layer
const genreRepository = require("../repositories/genre.repository");

async function getAllGenres() {
    return await genreRepository.findAll();
}

async function getGenreById(id) {
    const genre = await genreRepository.findById(id);
    if (!genre) {
        throw new Error("Thể loại không tồn tại.");
    }
    return genre;
}

async function createGenre(data) {
    if (!data.name) {
        throw new Error("Tên thể loại là bắt buộc.");
    }
    return await genreRepository.create(data);
}

async function updateGenre(id, data) {
    const genre = await genreRepository.findById(id);
    if (!genre) {
        throw new Error("Thể loại không tồn tại.");
    }
    await genreRepository.update(id, data);
    return await genreRepository.findById(id);
}

async function deleteGenre(id) {
    const genre = await genreRepository.findById(id);
    if (!genre) {
        throw new Error("Thể loại không tồn tại.");
    }
    await genreRepository.remove(id);
    return { success: true };
}

module.exports = {
    getAllGenres,
    getGenreById,
    createGenre,
    updateGenre,
    deleteGenre,
};
