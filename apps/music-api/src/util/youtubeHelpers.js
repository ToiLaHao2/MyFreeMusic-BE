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

    // Paths to tools or system commands
    let ytDlpPath = path.resolve(__dirname, "..", "..", "..", "..", "tools", "yt-dlp.exe");
    let ffmpegPath = path.resolve(__dirname, "..", "..", "..", "..", "tools", "ffmpeg", "bin", "ffmpeg.exe");

    const isWin = process.platform === "win32";

    // Fallback to system commands if tools not found or not Windows
    if (!isWin || !fs.existsSync(ytDlpPath)) {
        ytDlpPath = "yt-dlp";
    }
    if (!isWin || !fs.existsSync(ffmpegPath)) {
        ffmpegPath = "ffmpeg";
    }

    // Verify tools exist (skip check for system commands)
    if (ytDlpPath !== "yt-dlp" && !fs.existsSync(ytDlpPath)) {
        throw new Error(`yt-dlp.exe not found at: ${ytDlpPath}`);
    }
    if (ffmpegPath !== "ffmpeg" && !fs.existsSync(ffmpegPath)) {
        throw new Error(`ffmpeg.exe not found at: ${ffmpegPath}`);
    }

    // Prepare ffmpeg location argument
    // If using system ffmpeg, we can usually omit --ffmpeg-location or point to executable if needed
    // yt-dlp usually finds ffmpeg in PATH, but if we want to be explicit:
    const ffmpegArg = ffmpegPath === "ffmpeg" ? "" : `--ffmpeg-location "${ffmpegPath}"`;

    // yt-dlp command with --no-playlist to avoid downloading entire playlists
    const command = `"${ytDlpPath}" ${ffmpegArg} -x --audio-format mp3 --no-playlist -o "${outputPath}" "${ytbURL}"`;

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
