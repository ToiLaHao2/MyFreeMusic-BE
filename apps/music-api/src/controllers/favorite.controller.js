const favoriteService = require('../services/favorite.service');

const getFavorites = async (req, res) => {
    try {
        const userId = req.user.id;
        const favorites = await favoriteService.getFavorites(userId);
        res.json({
            status: "success",
            data: {
                songs: favorites
            }
        });
    } catch (error) {
        console.error("Get Favorites Error:", error);
        res.status(500).json({ message: "Failed to get favorites" });
    }
};

const addFavorite = async (req, res) => {
    try {
        const userId = req.user.id;
        const { songId } = req.params;
        await favoriteService.addFavorite(userId, songId);
        res.json({
            status: "success",
            message: "Added to favorites"
        });
    } catch (error) {
        console.error("Add Favorite Error:", error);
        res.status(500).json({ message: error.message || "Failed to add favorite" });
    }
};

const removeFavorite = async (req, res) => {
    try {
        const userId = req.user.id;
        const { songId } = req.params;
        await favoriteService.removeFavorite(userId, songId);
        res.json({
            status: "success",
            message: "Removed from favorites"
        });
    } catch (error) {
        console.error("Remove Favorite Error:", error);
        res.status(500).json({ message: "Failed to remove favorite" });
    }
};

const checkFavorites = async (req, res) => {
    try {
        const userId = req.user.id;
        // Expecting ?ids=id1,id2,id3
        const { ids } = req.query;
        if (!ids) {
            return res.json({ status: "success", data: [] });
        }

        const songIds = ids.split(',');
        const likedIds = await favoriteService.checkFavorites(userId, songIds);

        res.json({
            status: "success",
            data: likedIds
        });
    } catch (error) {
        console.error("Check Favorites Error:", error);
        res.status(500).json({ message: "Failed to check favorites" });
    }
};

module.exports = {
    getFavorites,
    addFavorite,
    removeFavorite,
    checkFavorites
};
