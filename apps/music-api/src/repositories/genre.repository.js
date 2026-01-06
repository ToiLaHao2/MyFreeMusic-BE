// Genre Repository - Data Access Layer
const { Genre } = require("../models/genre.model");

async function findAll() {
    return await Genre.findAll();
}

async function findById(id) {
    return await Genre.findByPk(id);
}

async function findByName(name) {
    return await Genre.findOne({ where: { name } });
}

async function create(data) {
    return await Genre.create(data);
}

async function update(id, data) {
    return await Genre.update(data, { where: { id } });
}

async function remove(id) {
    return await Genre.destroy({ where: { id } });
}

async function findOrCreate(name) {
    const [genre] = await Genre.findOrCreate({
        where: { name },
        defaults: { name },
    });
    return genre;
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
