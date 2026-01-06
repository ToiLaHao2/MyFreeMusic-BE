const { Artist } = require("../models");
const logger = require("../util/logger");

const DEFAULT_ARTISTS = [
    { name: "Unknown Artist", bio: "Default artist for uploaded songs" },
    { name: "The Weeknd", bio: "Canadian singer-songwriter" },
    { name: "Taylor Swift", bio: "American singer-songwriter" },
    { name: "Son Tung M-TP", bio: "Vietnamese singer-songwriter" },
    { name: "Imagine Dragons", bio: "American pop rock band" },
    { name: "Bruno Mars", bio: "American singer-songwriter" }
];

async function seedArtists() {
    try {
        const count = await Artist.count();
        if (count > 0) {
            logger.info("Artists already seeded.");
            return;
        }

        await Artist.bulkCreate(DEFAULT_ARTISTS);
        logger.info(`Seeded ${DEFAULT_ARTISTS.length} artists successfully.`);
    } catch (error) {
        logger.error("Error seeding artists:", error);
    }
}

module.exports = seedArtists;
