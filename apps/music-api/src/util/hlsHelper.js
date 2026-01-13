const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

async function convertToHLS(inputPath, outputDir) {
    return new Promise((resolve, reject) => {
        // Path to ffmpeg in MyFreeMusic-BE/tools/ffmpeg/bin/
        let ffmpegPath = path.resolve(
            __dirname,
            "..", "..", "..", "..",
            "tools", "ffmpeg", "bin", "ffmpeg.exe"
        );

        // If not on Windows or file doesn't exist (e.g. inside Docker), use system ffmpeg
        if (process.platform !== 'win32' || !fs.existsSync(ffmpegPath)) {
            ffmpegPath = 'ffmpeg';
        }

        // Đảm bảo thư mục đầu ra tồn tại
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        ffmpeg(inputPath)
            .setFfmpegPath(ffmpegPath)
            .addOptions([
                "-profile:v baseline",
                "-level 3.0",
                "-start_number 0",
                "-hls_time 10",
                "-hls_list_size 0",
                "-f hls",
                "-c:a aac",
                "-v debug", // Debug để kiểm tra lỗi chi tiết
            ])
            .output(`${outputDir}/index.m3u8`)
            .on("end", () => resolve(true))
            .on("error", (err, stdout, stderr) => {
                console.error("Error during HLS conversion:", err);
                console.error("stdout:", stdout);
                console.error("stderr:", stderr);
                reject(new Error(`Conversion failed: ${stderr}`));
            })
            .run();
    });
}

module.exports = { convertToHLS };
