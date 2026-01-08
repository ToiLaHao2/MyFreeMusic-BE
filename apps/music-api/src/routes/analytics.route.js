const express = require("express");
const analyticsController = require("../controllers/analytics.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const analyticsRouter = express.Router();

// All analytics routes require authentication
analyticsRouter.use(authMiddleware);

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

analyticsRouter.use(requireAdmin);

// Analytics endpoints
analyticsRouter.get("/", analyticsController.getAnalytics);
analyticsRouter.get("/users/:userId/logs", analyticsController.getUserLogs);

module.exports = analyticsRouter;
