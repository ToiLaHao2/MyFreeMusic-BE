const { Model, DataTypes } = require("sequelize");

class StorageStats extends Model { }

const initStorageStats = (sequelize) => {
    StorageStats.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            total_songs: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                comment: "Total number of songs",
            },
            total_size_bytes: {
                type: DataTypes.BIGINT,
                defaultValue: 0,
                comment: "Total size of all music files in bytes",
            },
            total_size_formatted: {
                type: DataTypes.STRING(50),
                allowNull: true,
                comment: "Human-readable size (e.g., '2.5 GB')",
            },
            average_file_size: {
                type: DataTypes.BIGINT,
                defaultValue: 0,
                comment: "Average file size in bytes",
            },
            storage_type: {
                type: DataTypes.ENUM("LOCAL", "CLOUDFLARE_R2", "S3"),
                defaultValue: "LOCAL",
                comment: "Current storage backend type",
            },
            storage_path: {
                type: DataTypes.STRING(500),
                allowNull: true,
                comment: "Base path or bucket name",
            },
            last_scanned_at: {
                type: DataTypes.DATE,
                allowNull: true,
                comment: "Last time storage was scanned",
            },
        },
        {
            sequelize,
            modelName: "StorageStats",
            tableName: "storage_stats",
            timestamps: true,
        }
    );

    return StorageStats;
};

module.exports = { StorageStats, initStorageStats };
