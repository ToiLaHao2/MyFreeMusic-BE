const { Model, DataTypes } = require("sequelize");

class RefreshToken extends Model { }

const initRefreshToken = (sequelize) => {
    RefreshToken.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            token: {
                type: DataTypes.STRING(500),
                allowNull: false,
            },
            device_type: {
                type: DataTypes.ENUM('web', 'app'),
                allowNull: false,
            },
            device_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            is_revoked: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            expires_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            sequelize,
            modelName: "RefreshToken",
            tableName: "refresh_tokens",
            timestamps: false,
            indexes: [
                {
                    fields: ['user_id', 'device_type'],
                },
                {
                    fields: ['token'],
                }
            ]
        }
    );

    return RefreshToken;
};

module.exports = { RefreshToken, initRefreshToken };
