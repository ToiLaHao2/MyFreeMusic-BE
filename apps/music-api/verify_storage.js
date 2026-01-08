const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const SONGS_STORAGE_PATH = process.env.SONGS_STORAGE_PATH || path.join(__dirname, '../../../songs-storage');
console.log('SONGS_STORAGE_PATH:', SONGS_STORAGE_PATH);

try {
    if (!fs.existsSync(SONGS_STORAGE_PATH)) {
        console.error('ERROR: Storage path does not exist!');
    } else {
        console.log('Storage path exists.');
        const files = fs.readdirSync(SONGS_STORAGE_PATH);
        console.log(`Found ${files.length} files/dirs in root:`, files);

        const originalPath = path.join(SONGS_STORAGE_PATH, 'original');
        if (fs.existsSync(originalPath)) {
            const originalFiles = fs.readdirSync(originalPath);
            console.log(`Found ${originalFiles.length} files in 'original':`, originalFiles);
        } else {
            console.log("'original' folder missing");
        }
    }
} catch (error) {
    console.error('Error scanning:', error);
}
