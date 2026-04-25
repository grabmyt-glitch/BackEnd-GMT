const express = require("express");

const authController = require("../controllers/auth.controller");
const userController = require("../controllers/user.controller");
const { authenticateToken } = require("../../../middlewares/auth.middleware");

const router = express.Router();

// Auth endpoints
router.post("/users/check", authController.checkUserExists);
router.post("/signup", authController.signup);
router.post("/verify-email", authController.verifyEmail);
router.post("/signin", authController.signin);

// User CRUD endpoints
router.get("/users", userController.getAllUsers);
router.get("/users/:userId", userController.getUserById);
router.put("/users/:userId", authenticateToken, userController.updateUser);
router.delete("/users/:userId", authenticateToken, userController.deleteUser);

module.exports = router;
