const express = require("express");
const app = express();
const { Sequelize } = require("sequelize");
const mysql = require("mysql2/promise");
const { initSong } = require("./models/song.model");
const { initArtist } = require("./models/artist.model");
const { initGenre } = require("./models/genre.model");
const songRouter = require("./routes/song.route");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");

dotenv.config();

const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan("dev"));

/**
 * Tự động tạo database nếu chưa tồn tại
 */
async function ensureDatabaseExists() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    const dbName = process.env.DB_NAME || "myfreemusic";
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`✅ Database '${dbName}' đã sẵn sàng.`);
    await connection.end();
}

/**
 * Khởi tạo Sequelize và đồng bộ models
 */
async function initializeDatabase() {
    // Đảm bảo database tồn tại
    await ensureDatabaseExists();

    // Tạo instance sequelize
    const sequelize = new Sequelize({
        dialect: "mysql",
        host: process.env.DB_HOST || "localhost",
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || "myfreemusic",
        logging: false,
    });

    // Khởi tạo các mô hình
    initSong(sequelize);
    initArtist(sequelize);
    initGenre(sequelize);

    // Đồng bộ hóa cơ sở dữ liệu (tạo bảng nếu chưa có)
    await sequelize.sync({ force: false });
    console.log("✅ Các bảng đã được tạo thành công.");

    return sequelize;
}

// Routes
app.use("/api/song", songRouter);

app.get("/", (req, res) => {
    res.send("Đây là server Express 🎶");
});

// Khởi động server
async function startServer() {
    try {
        await initializeDatabase();

        app.listen(port, () => {
            console.log(`🚀 Express server running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error("❌ Không thể khởi động server:", error);
        process.exit(1);
    }
}

startServer();
