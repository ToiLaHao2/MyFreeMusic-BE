const { Model, DataTypes } = require("sequelize");

class UserThemeSettings extends Model { }

const initUserThemeSettings = (sequelize) => {
    UserThemeSettings.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                unique: true,
                references: {
                    model: "users",
                    key: "id",
                },
            },
            preset_theme: {
                type: DataTypes.STRING(50),
                defaultValue: "Dark",
            },
            accent_color: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            background_type: {
                type: DataTypes.STRING(20),
                defaultValue: "default",
            },
            background_value: {
                type: DataTypes.STRING(500),
                allowNull: true,
            },
            sidebar_opacity: {
                type: DataTypes.FLOAT,
                defaultValue: 1.0,
            },
        },
        {
            sequelize,
            modelName: "UserThemeSettings",
            tableName: "user_theme_settings",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );

    return UserThemeSettings;
};

module.exports = { UserThemeSettings, initUserThemeSettings };
