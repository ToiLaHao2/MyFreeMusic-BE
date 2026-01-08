const express = require("express");
const router = express.Router();
const themeController = require("../controllers/theme.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

// All routes require authentication
router.use(authMiddleware);

// GET /theme - Get current theme settings
router.get("/", themeController.getTheme);

// PUT /theme - Update theme settings (with optional background image)
router.put("/", upload.fields([{ name: "background", maxCount: 1 }]), themeController.updateTheme);

// GET /theme/presets - Get available presets
router.get("/presets", themeController.getPresets);

module.exports = router;
