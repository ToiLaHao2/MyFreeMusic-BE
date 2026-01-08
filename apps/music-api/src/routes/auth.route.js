const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Public routes
router.post("/login", authController.login);
router.post("/refresh", authController.refreshAccessToken);

// Protected routes
const upload = require("../middlewares/upload.middleware");

// ...

// Protected routes
router.post("/logout", authMiddleware, authController.logout);
router.post("/change-password", authMiddleware, authController.changePassword);

router.put("/me", authMiddleware, upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'customAllSongsCover', maxCount: 1 },
    { name: 'customLikedSongsCover', maxCount: 1 }
]), authController.updateProfile);

module.exports = router;
