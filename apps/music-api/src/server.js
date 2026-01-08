// IMPORTANT: Load environment variables FIRST before any other imports
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const app = express();
const { Sequelize } = require("sequelize");
const mysql = require("mysql2/promise");
const { initUser } = require("./models/user.model");
const { initSong } = require("./models/song.model");
const { initPlaylist } = require("./models/playlist.model");
const { initArtist } = require("./models/artist.model");
const { initGenre } = require("./models/genre.model");
const { initRefreshToken } = require("./models/refreshToken.model");
const seedAdmin = require("./seeders/admin.seeder");
const authRoutes = require("./routes/auth.route");
const songRoutes = require("./routes/song.route");
const playlistRoutes = require("./routes/playlist.route");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const logger = require("./util/logger");

const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan("dev"));

// ULTRA-EARLY: Log ALL requests before anything else
app.use((req, res, next) => {
    console.log(`[EARLY-LOG] ${req.method} ${req.url}`);
    next();
});

/**
 * Tự động tạo database nếu chưa tồn tại
 */
async function ensureDatabaseExists() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });

        const dbName = process.env.DB_NAME || "myfreemusic";
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        logger.info(`✅ Database '${dbName}' đã sẵn sàng.`);
        await connection.end();
    } catch (e) {
        logger.error("Error creating DB:", e);
    }
}

/**
 * Khởi tạo Sequelize và đồng bộ models
 */
async function initializeDatabase() {
    // Đảm bảo database tồn tại
    await ensureDatabaseExists();

    // Import sequelize instance từ models
    const { sequelize } = require("./models");

    // Đồng bộ hóa cơ sở dữ liệu (tạo bảng nếu chưa có)
    // Sử dụng sync() đơn giản để tránh lỗi foreign key khi dùng alter: true
    // Nếu cần reset database hoàn toàn, dùng: await sequelize.sync({ force: true });
    await sequelize.sync();
    logger.info("✅ Các bảng đã được tạo/đồng bộ thành công.");

    // Seed Admin
    await seedAdmin();
    await require("./seeders/genre.seeder")();
    await require("./seeders/artist.seeder")();

    return sequelize;
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/genres", require("./routes/genre.route"));
app.use("/api/artists", require("./routes/artist.route"));
app.use("/api/admin", require("./routes/admin.route"));
app.use("/api/analytics", require("./routes/analytics.route"));
app.use("/api/storage", require("./routes/storage.route"));

app.get("/", (req, res) => {
    res.send("Đây là server Express 🎶");
});

// Khởi động server
async function startServer() {
    try {
        await initializeDatabase();

        app.listen(port, () => {
            logger.info(`🚀 Express server running on http://localhost:${port}`);
        });
    } catch (error) {
        logger.error("❌ Không thể khởi động server:", error);
        process.exit(1);
    }
}

startServer();
