// Artist Service - Business Logic Layer
const artistRepository = require("../repositories/artist.repository");

async function getAllArtists() {
    return await artistRepository.findAll();
}

async function getArtistById(id) {
    const artist = await artistRepository.findById(id);
    if (!artist) {
        throw new Error("Nghệ sĩ không tồn tại.");
    }
    return artist;
}

async function createArtist(data) {
    if (!data.name) {
        throw new Error("Tên nghệ sĩ là bắt buộc.");
    }
    return await artistRepository.create(data);
}

async function updateArtist(id, data) {
    const artist = await artistRepository.findById(id);
    if (!artist) {
        throw new Error("Nghệ sĩ không tồn tại.");
    }
    await artistRepository.update(id, data);
    return await artistRepository.findById(id);
}

async function deleteArtist(id) {
    const artist = await artistRepository.findById(id);
    if (!artist) {
        throw new Error("Nghệ sĩ không tồn tại.");
    }
    await artistRepository.remove(id);
    return { success: true };
}

module.exports = {
    getAllArtists,
    getArtistById,
    createArtist,
    updateArtist,
    deleteArtist,
};
