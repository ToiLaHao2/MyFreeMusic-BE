const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const SharedPlaylist = sequelize.define(
        "SharedPlaylist",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            playlist_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: "Playlists", // Table name
                    key: "id",
                },
                onDelete: 'CASCADE'
            },
            shared_with_user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: "Users", // Table name
                    key: "id",
                },
                onDelete: 'CASCADE'
            },
            permission: {
                type: DataTypes.ENUM("VIEW", "EDIT"),
                defaultValue: "VIEW",
            },
        },
        {
            tableName: "SharedPlaylists",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );

    return SharedPlaylist;
};
