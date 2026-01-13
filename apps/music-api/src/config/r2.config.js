require("dotenv").config();

module.exports = {
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || "myfreemusic",
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL, // R2 custom domain or public bucket URL
};
