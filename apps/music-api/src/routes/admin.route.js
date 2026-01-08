const express = require("express");
const adminController = require("../controllers/admin.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const adminRouter = express.Router();

// All admin routes require authentication
adminRouter.use(authMiddleware);

// Admin role check middleware
const requireAdmin = (req, res, next) => {
    if (req.user.role !== "ADMIN") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Admin only.",
        });
    }
    next();
};

adminRouter.use(requireAdmin);

// User management
adminRouter.post("/users", adminController.createUser);
adminRouter.get("/users", adminController.getAllUsers);
adminRouter.get("/users/:id", adminController.getUserById);
adminRouter.patch("/users/:id/status", adminController.updateUserStatus);
adminRouter.patch("/users/:id/role", adminController.updateUserRole);
adminRouter.delete("/users/:id", adminController.deleteUser);

// Dashboard stats
adminRouter.get("/stats", adminController.getDashboardStats);

// Activity Logs
adminRouter.get("/logs", adminController.getActivityLogs);
adminRouter.delete("/logs", adminController.clearActivityLogs);

module.exports = adminRouter;
