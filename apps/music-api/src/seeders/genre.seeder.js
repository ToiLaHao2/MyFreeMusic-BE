const { Genre } = require("../models");
const logger = require("../util/logger");

const DEFAULT_GENRES = [
    { name: "Pop", description: "Popular music" },
    { name: "Rock", description: "Rock and roll" },
    { name: "Hip Hop", description: "Hip Hop and Rap" },
    { name: "Electronic", description: "EDM, House, Techno" },
    { name: "R&B", description: "Rhythm and Blues" },
    { name: "Jazz", description: "Jazz music" },
    { name: "Classical", description: "Classical music" },
    { name: "Indie", description: "Independent music" },
    { name: "Country", description: "Country music" },
    { name: "K-Pop", description: "Korean Pop" },
    { name: "V-Pop", description: "Vietnamese Pop" }
];

async function seedGenres() {
    try {
        const count = await Genre.count();
        if (count > 0) {
            logger.info("Genres already seeded.");
            return;
        }

        await Genre.bulkCreate(DEFAULT_GENRES);
        logger.info(`Seeded ${DEFAULT_GENRES.length} genres successfully.`);
    } catch (error) {
        logger.error("Error seeding genres:", error);
    }
}

module.exports = seedGenres;
