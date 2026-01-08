const { sequelize } = require('../src/models');

async function fixSchema() {
    try {
        console.log("Adding custom cover columns...");

        try {
            await sequelize.query("ALTER TABLE users ADD COLUMN custom_all_songs_cover VARCHAR(255);");
            console.log("Added custom_all_songs_cover column");
        } catch (e) {
            console.log("custom_all_songs_cover might already exist or error:", e.original?.code || e.message);
        }

        try {
            await sequelize.query("ALTER TABLE users ADD COLUMN custom_liked_songs_cover VARCHAR(255);");
            console.log("Added custom_liked_songs_cover column");
        } catch (e) {
            console.log("custom_liked_songs_cover might already exist or error:", e.original?.code || e.message);
        }

        console.log("Done");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

fixSchema();
