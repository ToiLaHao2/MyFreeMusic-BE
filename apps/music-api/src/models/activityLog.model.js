const { Model, DataTypes } = require("sequelize");

class ActivityLog extends Model { }

const initActivityLog = (sequelize) => {
    ActivityLog.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            action: {
                type: DataTypes.STRING,
                allowNull: false,
                comment: "Short code for the action (e.g. USER_LOGIN, PLAYLIST_CREATE)",
            },
            entity_id: {
                type: DataTypes.UUID,
                allowNull: true,
                comment: "ID of the affected object (e.g. playlist_id)",
            },
            details: {
                type: DataTypes.JSON,
                allowNull: true,
                comment: "Extra details about the action",
            },
            ip_address: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            user_agent: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: "ActivityLog",
            tableName: "activity_logs",
            timestamps: true,
            updatedAt: false, // Logs are immutable
        }
    );

    return ActivityLog;
};

module.exports = { ActivityLog, initActivityLog };
