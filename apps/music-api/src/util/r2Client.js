const { S3Client } = require("@aws-sdk/client-s3");
const config = require("../config/r2.config");

// Validate config presence to avoid hard-to-debug AWS errors
const isR2Configured = config.R2_ACCOUNT_ID && config.R2_ACCESS_KEY_ID && config.R2_SECRET_ACCESS_KEY;

let r2Client;

if (isR2Configured) {
    r2Client = new S3Client({
        region: "auto",
        endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: config.R2_ACCESS_KEY_ID,
            secretAccessKey: config.R2_SECRET_ACCESS_KEY,
        },
    });
} else {
    // Only warn if we intend to use R2
    if (process.env.STORAGE_TYPE === 'CLOUDFLARE_R2') {
        console.warn("⚠️  R2 credentials missing. R2 client setup skipped.");
    }
}

module.exports = r2Client;
