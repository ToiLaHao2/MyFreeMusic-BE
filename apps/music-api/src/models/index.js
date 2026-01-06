const { Sequelize, DataTypes } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config();

const { initUser } = require("./user.model");
const { initPlaylist } = require("./playlist.model");
const { initSong } = require("./song.model");
const { initGenre } = require("./genre.model");
const { initArtist } = require("./artist.model");
const { initRefreshToken } = require("./refreshToken.model");
const { initPlaylistSong } = require("./playlistSong.model");

const sequelize = new Sequelize({
    dialect: "mysql",
    host: process.env.DB_HOST || "localhost",
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "myfreemusic",
    logging: false,
});

const User = initUser(sequelize);
const Playlist = initPlaylist(sequelize);
const Song = initSong(sequelize);
const Genre = initGenre(sequelize);
const Artist = initArtist(sequelize);
const RefreshToken = initRefreshToken(sequelize);
const PlaylistSong = initPlaylistSong(sequelize);

// Associations
User.hasMany(Playlist, { foreignKey: "user_id" });
Playlist.belongsTo(User, { foreignKey: "user_id" });

Genre.hasMany(Song, { foreignKey: "genre_id", as: "songs" });
Song.belongsTo(Genre, { foreignKey: "genre_id", as: "genre" });

Artist.hasMany(Song, { foreignKey: "artist_id", as: "songs" });
Song.belongsTo(Artist, { foreignKey: "artist_id", as: "artist" });

Playlist.belongsToMany(Song, { through: PlaylistSong, foreignKey: "playlist_id" });
Song.belongsToMany(Playlist, { through: PlaylistSong, foreignKey: "song_id" });

module.exports = {
    sequelize,
    User,
    Playlist,
    Song,
    Genre,
    Artist,
    RefreshToken,
    PlaylistSong
};
