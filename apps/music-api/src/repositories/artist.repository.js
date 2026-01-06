// Artist Repository - Data Access Layer
const { Artist } = require("../models/artist.model");

async function findAll() {
    return await Artist.findAll();
}

async function findById(id) {
    return await Artist.findByPk(id);
}

async function findByName(name) {
    return await Artist.findOne({ where: { name } });
}

async function create(data) {
    return await Artist.create(data);
}

async function update(id, data) {
    return await Artist.update(data, { where: { id } });
}

async function remove(id) {
    return await Artist.destroy({ where: { id } });
}

async function findOrCreate(name) {
    const [artist] = await Artist.findOrCreate({
        where: { name },
        defaults: { name },
    });
    return artist;
}

module.exports = {
    findAll,
    findById,
    findByName,
    create,
    update,
    remove,
    findOrCreate,
};
