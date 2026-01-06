const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Public routes
router.post("/login", authController.login);
router.post("/refresh", authController.refreshAccessToken);

// Protected routes
router.post("/logout", authMiddleware, authController.logout);
router.post("/change-password", authMiddleware, authController.changePassword);

module.exports = router;
