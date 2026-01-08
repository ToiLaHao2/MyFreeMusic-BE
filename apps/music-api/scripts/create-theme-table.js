const { sequelize } = require('../src/models');

async function createThemeSettingsTable() {
    try {
        console.log("Creating user_theme_settings table...");

        // Drop if exists to start clean
        await sequelize.query(`DROP TABLE IF EXISTS user_theme_settings`);

        // Create with matching charset to users table
        await sequelize.query(`
            CREATE TABLE user_theme_settings (
                id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
                user_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
                preset_theme VARCHAR(50) DEFAULT 'Dark',
                accent_color VARCHAR(20) DEFAULT NULL,
                background_type VARCHAR(20) DEFAULT 'default',
                background_value VARCHAR(500) DEFAULT NULL,
                sidebar_opacity FLOAT DEFAULT 1.0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY unique_user (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin
        `);

        // Add FK after table creation
        try {
            await sequelize.query(`
                ALTER TABLE user_theme_settings 
                ADD CONSTRAINT fk_theme_user 
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            `);
            console.log("Foreign key added.");
        } catch (fkErr) {
            console.log("FK constraint skipped (may already exist or incompatible):", fkErr.message);
        }

        console.log("Table created successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Failed to create table:", error.message || error);
        process.exit(1);
    }
}

createThemeSettingsTable();
