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
const { initActivityLog } = require("./activityLog.model");
const { initStorageStats } = require("./storageStats.model");
const { initPlaylistLike } = require("./playlistLike.model");
// Favorites
const { initFavorite } = require("./favorite.model");
const { initUserThemeSettings } = require("./userThemeSettings.model");

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
const StorageStats = initStorageStats(sequelize);
const SharedPlaylist = require("./sharedPlaylist.model")(sequelize);
const ActivityLog = initActivityLog(sequelize);
const PlaylistLike = initPlaylistLike(sequelize);
const Favorite = initFavorite(sequelize);
const UserThemeSettings = initUserThemeSettings(sequelize);

// Associations
User.hasMany(Playlist, { foreignKey: "user_id" });
Playlist.belongsTo(User, { foreignKey: "user_id" });

Genre.hasMany(Song, { foreignKey: "genre_id", as: "songs" });
Song.belongsTo(Genre, { foreignKey: "genre_id", as: "genre" });

Artist.hasMany(Song, { foreignKey: "artist_id", as: "songs" });
Song.belongsTo(Artist, { foreignKey: "artist_id", as: "artist" });

Playlist.belongsToMany(Song, { through: PlaylistSong, foreignKey: "playlist_id" });
Song.belongsToMany(Playlist, { through: PlaylistSong, foreignKey: "song_id" });

// Shared Playlists
User.hasMany(SharedPlaylist, { foreignKey: "shared_with_user_id" });
SharedPlaylist.belongsTo(User, { foreignKey: "shared_with_user_id", as: "user" });

Playlist.hasMany(SharedPlaylist, { foreignKey: "playlist_id" });
SharedPlaylist.belongsTo(Playlist, { foreignKey: "playlist_id", as: "playlist" });

// Playlist Likes
User.belongsToMany(Playlist, { through: PlaylistLike, foreignKey: "user_id", as: "likedPlaylists" });
Playlist.belongsToMany(User, { through: PlaylistLike, foreignKey: "playlist_id", as: "likedByUsers" });

User.hasMany(PlaylistLike, { foreignKey: "user_id" });
PlaylistLike.belongsTo(User, { foreignKey: "user_id" });

Playlist.hasMany(PlaylistLike, { foreignKey: "playlist_id" });
PlaylistLike.belongsTo(Playlist, { foreignKey: "playlist_id" });

// Activity Logs
User.hasMany(ActivityLog, { foreignKey: "user_id" });
ActivityLog.belongsTo(User, { foreignKey: "user_id" });

// Favorites
User.hasMany(Favorite, { foreignKey: "user_id", as: "favorites" });
Favorite.belongsTo(User, { foreignKey: "user_id" });

Song.hasMany(Favorite, { foreignKey: "song_id" });
Favorite.belongsTo(Song, { foreignKey: "song_id", as: "song" });

// Helper: User <-> Song via Favorite (Optional but useful)
User.belongsToMany(Song, { through: Favorite, foreignKey: "user_id", as: "likedSongs" });
Song.belongsToMany(User, { through: Favorite, foreignKey: "song_id", as: "likedBy" });

// User Theme Settings
User.hasOne(UserThemeSettings, { foreignKey: "user_id", as: "themeSettings" });
UserThemeSettings.belongsTo(User, { foreignKey: "user_id" });

module.exports = {
    sequelize,
    User,
    Playlist,
    Song,
    Genre,
    Artist,
    RefreshToken,
    PlaylistSong,
    StorageStats,
    SharedPlaylist,
    ActivityLog,
    PlaylistLike,
    Favorite,
    UserThemeSettings
};

