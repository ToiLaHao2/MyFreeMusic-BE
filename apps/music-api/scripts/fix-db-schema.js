const { sequelize } = require('../src/models');

async function fixSchema() {
    try {
        console.log("Fixing schema...");

        // Add user_bio
        try {
            await sequelize.query("ALTER TABLE users ADD COLUMN user_bio TEXT;");
            console.log("Added user_bio column");
        } catch (e) {
            console.log("user_bio might already exist or error:", e.original?.code || e.message);
        }

        // Add user_theme
        try {
            await sequelize.query("ALTER TABLE users ADD COLUMN user_theme VARCHAR(255) DEFAULT 'Dark';");
            console.log("Added user_theme column");
        } catch (e) {
            console.log("user_theme might already exist or error:", e.original?.code || e.message);
        }

        // Force sync for new table just in case
        try {
            await sequelize.models.PlaylistLike.sync({ alter: true });
            console.log("Synced PlaylistLike table");
        } catch (e) {
            console.log("Error syncing PlaylistLike:", e.message);
        }

        console.log("Done");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

fixSchema();
