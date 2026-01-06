const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { PATHS, ensureDir } = require("../util/storage");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // All uploads go to temp first, then moved by service after processing
        ensureDir(PATHS.temp);
        cb(null, PATHS.temp);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueName + path.extname(file.originalname));
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["audio/mpeg", "audio/mp3", "image/jpeg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("File không hợp lệ (chỉ nhận .mp3, .jpg, .png)"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 },
});

module.exports = upload;
