const { Model, DataTypes } = require("sequelize");

class PlaylistSong extends Model { }

const initPlaylistSong = (sequelize) => {
    PlaylistSong.init(
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
                    model: "playlists",
                    key: "id",
                },
            },
            song_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: "songs",
                    key: "id",
                },
            },
            order: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            added_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            sequelize,
            modelName: "PlaylistSong",
            tableName: "playlist_songs",
            timestamps: false,
        }
    );

    return PlaylistSong;
};

module.exports = { PlaylistSong, initPlaylistSong };
