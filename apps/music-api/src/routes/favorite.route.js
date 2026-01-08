const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favorite.controller');
const verifyToken = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(verifyToken);

router.get('/', favoriteController.getFavorites);
router.get('/check', favoriteController.checkFavorites); // /api/favorites/check?ids=...
router.post('/:songId', favoriteController.addFavorite);
router.delete('/:songId', favoriteController.removeFavorite);

module.exports = router;
