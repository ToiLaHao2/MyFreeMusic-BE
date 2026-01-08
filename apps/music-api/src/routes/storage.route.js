const express = require("express");
const storageController = require("../controllers/storage.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const storageRouter = express.Router();

// All storage routes require authentication
storageRouter.use(authMiddleware);

// Admin role check
const requireAdmin = (req, res, next) => {
    if (req.user.role !== "ADMIN") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Admin only.",
        });
    }
    next();
};

storageRouter.use(requireAdmin);

// Storage endpoints
storageRouter.get("/", storageController.getStorageStats);
storageRouter.get("/database", storageController.getDatabaseStats);
storageRouter.post("/refresh", storageController.refreshStorageCache);

module.exports = storageRouter;
