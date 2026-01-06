const { Model, DataTypes } = require("sequelize");

class Song extends Model { }

const initSong = (sequelize) => {
    Song.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            slug: {
                type: DataTypes.STRING,
                unique: true,
            },
            source: {
                type: DataTypes.ENUM("DEVICE", "YOUTUBE"),
                allowNull: false,
            },
            fileUrl: DataTypes.STRING,
            coverUrl: DataTypes.STRING,
            views: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },

            // Duplicate detection fields
            youtube_id: {
                type: DataTypes.STRING(20),
                allowNull: true,
                comment: "YouTube video ID for duplicate check",
            },
            fingerprint: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: "Chromaprint audio fingerprint",
            },
            duration_seconds: {
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: "Audio duration in seconds",
            },

            // Audio metadata
            bitrate: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            format: {
                type: DataTypes.STRING(10),
                allowNull: true,
            },

            // Relations
            genre_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            artist_id: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            uploaded_by: {
                type: DataTypes.UUID,
                allowNull: true,
                comment: "User who uploaded this song",
            },
        },
        {
            sequelize,
            modelName: "Song",
            tableName: "songs",
            timestamps: true,
            tableName: "songs",
            timestamps: true,
            // indexes: [
            //     { fields: ["youtube_id"] },
            //     { fields: ["duration_seconds"] },
            // ],
        }
    );

    return Song;
};

module.exports = { Song, initSong };
