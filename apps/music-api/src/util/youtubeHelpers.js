const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const storage = require("./storage");

async function downloadYoutubeAudio(ytbURL) {
    const id = uuidv4();

    // Use storage utility for temp directory
    storage.ensureDir(storage.PATHS.temp);
    const outputPath = path.join(storage.PATHS.temp, `${id}.mp3`);

    // Paths to tools in MyFreeMusic-BE/tools/
    const ytDlpPath = path.resolve(__dirname, "..", "..", "..", "..", "tools", "yt-dlp.exe");
    const ffmpegPath = path.resolve(__dirname, "..", "..", "..", "..", "tools", "ffmpeg", "bin", "ffmpeg.exe");

    // Verify tools exist
    if (!fs.existsSync(ytDlpPath)) {
        throw new Error(`yt-dlp.exe not found at: ${ytDlpPath}`);
    }
    if (!fs.existsSync(ffmpegPath)) {
        throw new Error(`ffmpeg.exe not found at: ${ffmpegPath}`);
    }

    // yt-dlp command with --no-playlist to avoid downloading entire playlists
    const command = `"${ytDlpPath}" --ffmpeg-location "${ffmpegPath}" -x --audio-format mp3 --no-playlist -o "${outputPath}" "${ytbURL}"`;

    console.log(`[YouTube] Starting download...`);
    console.log(`[YouTube] URL: ${ytbURL}`);
    console.log(`[YouTube] Output: ${outputPath}`);
    console.log(`[YouTube] Command: ${command}`);

    // Execute yt-dlp
    const result = await new Promise((resolve, reject) => {
        exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
            console.log(`[YouTube] stdout: ${stdout}`);
            console.log(`[YouTube] stderr: ${stderr}`);

            if (error) {
                console.error(`[YouTube] ERROR: ${error.message}`);
                return reject(new Error(`YT-DLP error: ${stderr || error.message}`));
            }

            // Verify file was created
            if (!fs.existsSync(outputPath)) {
                return reject(new Error(`Download completed but file not found: ${outputPath}`));
            }

            console.log(`[YouTube] Download completed: ${outputPath}`);
            resolve(outputPath);
        });
    });

    return result;
}

module.exports = { downloadYoutubeAudio };
