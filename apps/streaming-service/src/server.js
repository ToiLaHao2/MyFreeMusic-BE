const express = require("express");
const path = require("path");
const app = express();
const cors = require("cors");

app.use(cors());

// Centralized storage path: apps/songs-storage/
const SONGS_STORAGE_PATH = path.join(__dirname, "..", "..", "songs-storage");

// Serve static HLS files from centralized storage
app.use("/hls", express.static(path.join(SONGS_STORAGE_PATH, "hls")));

// Serve cover images
app.use("/covers", express.static(path.join(SONGS_STORAGE_PATH, "covers")));

app.listen(4000, () => {
    console.log("🎧 Streaming server running at http://localhost:4000");
});
