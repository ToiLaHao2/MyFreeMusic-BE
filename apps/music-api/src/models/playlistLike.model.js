const { Model, DataTypes } = require("sequelize");

class PlaylistLike extends Model { }

const initPlaylistLike = (sequelize) => {
    PlaylistLike.init(
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
            playlist_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'playlists',
                    key: 'id'
                }
            },
            liked_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            sequelize,
            modelName: "PlaylistLike",
            tableName: "playlist_likes",
            timestamps: false,
            indexes: [
                {
                    unique: true,
                    fields: ['user_id', 'playlist_id']
                }
            ]
        }
    );

    return PlaylistLike;
};

module.exports = { PlaylistLike, initPlaylistLike };
