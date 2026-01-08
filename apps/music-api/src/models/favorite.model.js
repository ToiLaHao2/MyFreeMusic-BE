const { DataTypes } = require("sequelize");

const initFavorite = (sequelize) => {
    const Favorite = sequelize.define("Favorite", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        song_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Songs',
                key: 'id'
            }
        }
    }, {
        tableName: "favorites",
        timestamps: true,
    });

    return Favorite;
};

module.exports = { initFavorite };
